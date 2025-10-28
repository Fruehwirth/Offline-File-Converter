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

// FFmpeg instance pool for concurrent conversions
const FFMPEG_POOL_SIZE = 3 // Allow 3 concurrent FFmpeg conversions
interface FFmpegPoolItem {
  instance: any
  busy: boolean
}
let ffmpegPool: FFmpegPoolItem[] = []
let poolInitialized = false

// Queue system for FFmpeg conversions
interface QueuedTask {
  task: (ffmpeg: any) => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
}
let ffmpegQueue: QueuedTask[] = []

/**
 * Initialize FFmpeg pool with multiple instances
 */
async function initializeFFmpegPool(): Promise<void> {
  if (poolInitialized) return

  console.log(`[FFmpeg Pool] Initializing pool with ${FFMPEG_POOL_SIZE} instances...`)
  poolInitialized = true

  // Create all instances in parallel
  const initPromises = Array.from({ length: FFMPEG_POOL_SIZE }, async (_, index) => {
    console.log(`[FFmpeg Pool] Creating instance ${index + 1}/${FFMPEG_POOL_SIZE}...`)

    const ffmpeg = createFFmpeg({
      log: index === 0, // Only log from first instance to avoid spam
      corePath: '/ffmpeg-core.js',
      workerPath: '/ffmpeg-core.worker.js',
    })

    await ffmpeg.load()
    console.log(`[FFmpeg Pool] Instance ${index + 1} loaded`)

    return {
      instance: ffmpeg,
      busy: false,
    }
  })

  ffmpegPool = await Promise.all(initPromises)
  console.log(`[FFmpeg Pool] All ${FFMPEG_POOL_SIZE} instances ready!`)

  // Process any queued tasks
  processFFmpegQueue()
}

/**
 * Process FFmpeg queue (allows multiple concurrent conversions up to pool size)
 */
function processFFmpegQueue(): void {
  while (ffmpegQueue.length > 0) {
    // Find available instance
    const available = ffmpegPool.find(item => !item.busy)
    if (!available) {
      // All instances busy, wait for one to free up
      return
    }

    // Get next task from queue
    const queuedTask = ffmpegQueue.shift()
    if (!queuedTask) return

    // Mark instance as busy
    available.busy = true

    // Run task with this instance
    queuedTask
      .task(available.instance)
      .then(result => {
        queuedTask.resolve(result)
      })
      .catch(error => {
        queuedTask.reject(error)
      })
      .finally(() => {
        // Release instance and process next task
        available.busy = false
        processFFmpegQueue()
      })
  }
}

/**
 * Add a task to the FFmpeg queue
 */
function queueFFmpegTask<T>(task: (ffmpeg: any) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    ffmpegQueue.push({
      task,
      resolve,
      reject,
    })

    // Try to process immediately if pool is ready and has available instances
    if (poolInitialized) {
      processFFmpegQueue()
    } else {
      // Initialize pool if not already done
      initializeFFmpegPool()
    }
  })
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
  onProgress?.({ percent: 0, message: 'Queued...' })

  // Use unique file names to avoid conflicts between concurrent conversions
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  const inputFileName = `input_${timestamp}_${random}.${file.name.split('.').pop() || 'audio'}`
  const outputFileName = `output_${timestamp}_${random}.${targetFormat}`

  // Queue the conversion - will run when an FFmpeg instance is available
  return queueFFmpegTask(async ffmpeg => {
    try {
      onProgress?.({ percent: 0, message: 'Starting...' })

      // Write input file to FFmpeg's virtual filesystem (0.11 API)
      ffmpeg.FS('writeFile', inputFileName, await fetchFile(file))
      console.log('[convertAudioWithFFmpeg] Input file written:', inputFileName)

      onProgress?.({ percent: 5, message: 'Encoding...' })

      // Build FFmpeg command
      const ffmpegArgs = buildFFmpegArgs(targetFormat, inputFileName, outputFileName, options)
      console.log('[convertAudioWithFFmpeg] Running:', ffmpegArgs.join(' '))

      // Set up progress monitoring
      ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
        // ratio is 0-1, map to 5-95%
        const percent = Math.min(95, Math.max(5, Math.floor(5 + ratio * 90)))
        onProgress?.({ percent, message: `Encoding... ${Math.floor(ratio * 100)}%` })
      })

      // Run FFmpeg (0.11 API)
      await ffmpeg.run(...ffmpegArgs)
      console.log('[convertAudioWithFFmpeg] Conversion complete:', outputFileName)

      onProgress?.({ percent: 95, message: 'Reading output...' })

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
      // Clean up on error
      try {
        ffmpeg.FS('unlink', inputFileName)
        ffmpeg.FS('unlink', outputFileName)
      } catch (e) {
        // Ignore cleanup errors
      }

      console.error('[convertAudioWithFFmpeg] Error:', error)
      throw new Error(
        `FFmpeg conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })
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
