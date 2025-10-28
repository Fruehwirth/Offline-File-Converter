/**
 * Audio Processing Conversion
 * Handles audio decoding and format conversion using efficient encoders:
 * - MP3: lamejs encoder (worker)
 * - WAV: Native PCM encoder (worker)
 * - OGG/FLAC/AAC/M4A: FFmpeg WASM (fast, non-realtime encoding)
 */

import type { FormatId } from './formatRegistry'
import AudioProcessingWorker from '../workers/audioProcessing.worker?worker'
import type {
  AudioConversionMessage,
  AudioConversionResponse,
} from '../workers/audioProcessing.worker'
// @ts-ignore - FFmpeg 0.11 uses CommonJS
import * as FFmpegModule from '@ffmpeg/ffmpeg'
const { createFFmpeg, fetchFile } = FFmpegModule as any

export interface AudioProcessingOptions {
  bitrate?: number // kbps for lossy formats (default: 192)
  sampleRate?: number // Hz (default: original)
  channels?: number // 1 = mono, 2 = stereo (default: original)
}

export interface ConversionProgress {
  percent: number
  message?: string
}

// Singleton FFmpeg instance for reuse
let ffmpegInstance: any = null
let ffmpegLoading: Promise<any> | null = null

/**
 * Get or initialize FFmpeg instance (singleton pattern)
 * Using FFmpeg 0.11.x which is more stable
 */
async function getFFmpeg(): Promise<any> {
  if (ffmpegInstance) {
    return ffmpegInstance
  }

  if (ffmpegLoading) {
    return ffmpegLoading
  }

  ffmpegLoading = (async () => {
    console.log('[FFmpeg 0.11] Starting initialization...')

    const ffmpeg = createFFmpeg({
      log: true,
      corePath: '/ffmpeg-core.js',
      workerPath: '/ffmpeg-core.worker.js',
    })

    console.log('[FFmpeg 0.11] Loading core...')
    await ffmpeg.load()
    console.log('[FFmpeg 0.11] Successfully loaded!')

    ffmpegInstance = ffmpeg
    ffmpegLoading = null
    return ffmpeg
  })()

  return ffmpegLoading
}

/**
 * Convert audio using the appropriate method based on target format
 */
export async function convertAudio(
  file: File,
  targetFormat: FormatId,
  options: AudioProcessingOptions = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  // For MP3 and WAV, use worker-based encoding (already fast)
  if (targetFormat === 'mp3' || targetFormat === 'wav') {
    return convertAudioWithWorker(file, targetFormat, options, onProgress)
  }

  // For OGG, FLAC, AAC, M4A, use FFmpeg 0.11 WASM
  return convertAudioWithFFmpeg(file, targetFormat, options, onProgress)
}

/**
 * Convert audio using worker (for MP3 and WAV)
 */
async function convertAudioWithWorker(
  file: File,
  targetFormat: FormatId,
  options: AudioProcessingOptions = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  // Decode audio in main thread (AudioContext only works here, not in workers)
  // Start at 0% since we only want to show encoding progress
  onProgress?.({ percent: 0, message: 'Preparing audio...' })

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const fileData = await file.arrayBuffer()

  let audioBuffer: AudioBuffer
  try {
    audioBuffer = await audioContext.decodeAudioData(fileData)
  } catch (error) {
    await audioContext.close()
    throw new Error(
      `Failed to decode audio: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  // Extract channel data (PCM)
  const channelData: Float32Array[] = []
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i))
  }

  onProgress?.({ percent: 0, message: 'Encoding audio...' })

  // Send to worker for encoding
  return new Promise((resolve, reject) => {
    const worker = new AudioProcessingWorker()

    worker.onmessage = (event: MessageEvent<AudioConversionResponse>) => {
      const { type, data, error, progress } = event.data

      if (type === 'progress' && progress !== undefined) {
        // Map worker progress (0-100) directly to UI progress (0-100)
        onProgress?.({ percent: progress, message: 'Encoding audio...' })
      } else if (type === 'success' && data) {
        const mimeType = getMimeType(targetFormat)
        const blob = new Blob([data], { type: mimeType })
        worker.terminate()
        audioContext.close()
        onProgress?.({ percent: 100, message: 'Complete!' })
        resolve(blob)
      } else if (type === 'error') {
        worker.terminate()
        audioContext.close()
        reject(new Error(error || 'Audio conversion failed'))
      }
    }

    worker.onerror = error => {
      worker.terminate()
      audioContext.close()
      reject(new Error(`Worker error: ${error.message}`))
    }

    // Send encoding request with PCM data
    const message: AudioConversionMessage = {
      type: 'convert',
      channelData,
      sampleRate: audioBuffer.sampleRate,
      targetFormat,
      options,
    }
    worker.postMessage(
      message,
      channelData.map(c => c.buffer)
    )
  })
}

/**
 * Convert audio using FFmpeg 0.11 WASM (for OGG, FLAC, AAC, M4A)
 */
async function convertAudioWithFFmpeg(
  file: File,
  targetFormat: FormatId,
  options: AudioProcessingOptions = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  console.log('[convertAudioWithFFmpeg] Starting conversion:', file.name, 'to', targetFormat)
  onProgress?.({ percent: 0, message: 'Loading FFmpeg...' })

  const inputFileName = `input.${file.name.split('.').pop() || 'audio'}`
  const outputFileName = `output.${targetFormat}`

  try {
    const ffmpeg = await getFFmpeg()
    console.log('[convertAudioWithFFmpeg] FFmpeg 0.11 loaded')

    onProgress?.({ percent: 10, message: 'Preparing audio...' })

    // Write input file to FFmpeg's virtual filesystem (0.11 API)
    ffmpeg.FS('writeFile', inputFileName, await fetchFile(file))
    console.log('[convertAudioWithFFmpeg] Input file written')

    onProgress?.({ percent: 20, message: 'Encoding audio...' })

    // Build FFmpeg command
    const ffmpegArgs = buildFFmpegArgs(targetFormat, inputFileName, outputFileName, options)
    console.log('[convertAudioWithFFmpeg] Running:', ffmpegArgs.join(' '))

    // Run FFmpeg (0.11 API)
    await ffmpeg.run(...ffmpegArgs)
    console.log('[convertAudioWithFFmpeg] Conversion complete')

    onProgress?.({ percent: 90, message: 'Reading output...' })

    // Read output file (0.11 API)
    const data = ffmpeg.FS('readFile', outputFileName)

    // Clean up
    try {
      ffmpeg.FS('unlink', inputFileName)
      ffmpeg.FS('unlink', outputFileName)
    } catch (e) {
      // Ignore cleanup errors
    }

    // Convert to Blob
    const mimeType = getMimeType(targetFormat)
    const blob = new Blob([data.buffer], { type: mimeType })

    onProgress?.({ percent: 100, message: 'Complete!' })
    console.log('[convertAudioWithFFmpeg] Success! Size:', blob.size)
    return blob
  } catch (error) {
    console.error('[convertAudioWithFFmpeg] Error:', error)
    throw new Error(
      `FFmpeg conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Build FFmpeg command arguments based on target format
 */
function buildFFmpegArgs(
  targetFormat: FormatId,
  inputFile: string,
  outputFile: string,
  options: AudioProcessingOptions
): string[] {
  const bitrate = options.bitrate || 192
  const args = ['-i', inputFile]

  switch (targetFormat) {
    case 'ogg':
      // OGG Vorbis
      args.push('-c:a', 'libvorbis', '-q:a', '5') // Quality 5 ≈ 160 kbps
      break

    case 'flac':
      // FLAC (lossless)
      args.push('-c:a', 'flac', '-compression_level', '5')
      break

    case 'aac':
    case 'm4a':
      // AAC
      args.push('-c:a', 'aac', '-b:a', `${bitrate}k`)
      break

    default:
      // Generic encoding
      args.push('-b:a', `${bitrate}k`)
  }

  args.push(outputFile)
  return args
}

/**
 * Get MIME type for audio format
 */
function getMimeType(format: FormatId): string {
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
  }

  return mimeMap[format] || 'audio/mpeg'
}

/**
 * Check if browser supports audio processing
 */
export function isAudioProcessingSupported(): boolean {
  try {
    return (
      typeof AudioContext !== 'undefined' ||
      typeof (window as any).webkitAudioContext !== 'undefined'
    )
  } catch {
    return false
  }
}
