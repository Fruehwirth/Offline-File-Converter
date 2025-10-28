/**
 * Audio Processing Conversion
 * Handles audio decoding and format conversion using multiple strategies:
 * - MP3: lamejs encoder (worker)
 * - WAV: Native PCM encoder (worker)
 * - OGG/FLAC/AAC/M4A: MediaRecorder API (main thread)
 */

import type { FormatId } from './formatRegistry'
import AudioProcessingWorker from '../workers/audioProcessing.worker?worker'
import type {
  AudioConversionMessage,
  AudioConversionResponse,
} from '../workers/audioProcessing.worker'

export interface AudioProcessingOptions {
  bitrate?: number // kbps for lossy formats (default: 192)
  sampleRate?: number // Hz (default: original)
  channels?: number // 1 = mono, 2 = stereo (default: original)
}

export interface ConversionProgress {
  percent: number
  message?: string
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
  // For MP3 and WAV, use worker-based encoding
  if (targetFormat === 'mp3' || targetFormat === 'wav') {
    return convertAudioWithWorker(file, targetFormat, options, onProgress)
  }

  // For OGG, FLAC, AAC, M4A, use MediaRecorder API
  return convertAudioWithMediaRecorder(file, targetFormat, options, onProgress)
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
  onProgress?.({ percent: 10, message: 'Decoding audio...' })

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

  onProgress?.({ percent: 30, message: 'Extracting audio data...' })

  // Extract channel data (PCM)
  const channelData: Float32Array[] = []
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i))
  }

  onProgress?.({ percent: 40, message: 'Encoding audio...' })

  // Send to worker for encoding
  return new Promise((resolve, reject) => {
    const worker = new AudioProcessingWorker()

    worker.onmessage = (event: MessageEvent<AudioConversionResponse>) => {
      const { type, data, error, progress } = event.data

      if (type === 'progress' && progress !== undefined) {
        // Map worker progress (0-100) to overall progress (40-90)
        const mappedProgress = 40 + Math.floor((progress / 100) * 50)
        onProgress?.({ percent: mappedProgress, message: 'Encoding audio...' })
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
 * Convert audio using MediaRecorder API (for OGG, FLAC, AAC, M4A)
 * This uses the browser's native audio encoding capabilities with intelligent fallback
 */
async function convertAudioWithMediaRecorder(
  file: File,
  targetFormat: FormatId,
  options: AudioProcessingOptions = {},
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  onProgress?.({ percent: 10, message: 'Decoding audio...' })

  // Decode audio
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

  onProgress?.({ percent: 30, message: 'Preparing audio stream...' })

  // Try to find a supported MIME type for the target format
  const mimeTypes = getMediaRecorderMimeTypes(targetFormat)
  let supportedMimeType: string | null = null

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      supportedMimeType = mimeType
      break
    }
  }

  // If no supported MIME type found, fall back to MP3 or WAV
  if (!supportedMimeType) {
    await audioContext.close()

    // Fall back to WAV for FLAC (lossless), MP3 for others (lossy)
    const fallbackFormat = targetFormat === 'flac' ? 'wav' : 'mp3'
    const fallbackLabel = fallbackFormat.toUpperCase()

    console.warn(
      `Format ${targetFormat.toUpperCase()} not supported by browser, using ${fallbackLabel} instead`
    )

    // Show message about fallback
    onProgress?.({
      percent: 35,
      message: `${targetFormat.toUpperCase()} not supported, converting to ${fallbackLabel}...`,
    })

    return convertAudioWithWorker(file, fallbackFormat as FormatId, options, onProgress)
  }

  onProgress?.({ percent: 40, message: 'Encoding audio...' })

  // Create a MediaStream from the decoded audio
  const destination = audioContext.createMediaStreamDestination()
  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(destination)

  // Record the audio stream
  const chunks: Blob[] = []
  const recorder = new MediaRecorder(destination.stream, {
    mimeType: supportedMimeType,
    audioBitsPerSecond: (options.bitrate || 192) * 1000,
  })

  return new Promise((resolve, reject) => {
    let hasResolved = false
    let progressInterval: number | null = null

    recorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    recorder.onstop = async () => {
      if (hasResolved) return
      hasResolved = true

      if (progressInterval) clearInterval(progressInterval)
      await audioContext.close()

      if (chunks.length === 0) {
        reject(new Error('No audio data was recorded'))
        return
      }

      const blob = new Blob(chunks, { type: supportedMimeType })
      onProgress?.({ percent: 100, message: 'Complete!' })
      resolve(blob)
    }

    recorder.onerror = async event => {
      if (hasResolved) return
      hasResolved = true

      if (progressInterval) clearInterval(progressInterval)
      await audioContext.close()
      reject(new Error(`Recording failed: ${(event as any).error?.message || 'Unknown error'}`))
    }

    // Fallback timeout in case something goes wrong
    const duration = audioBuffer.duration
    const safetyTimeout = setTimeout(
      () => {
        if (!hasResolved && recorder.state !== 'inactive') {
          console.warn('MediaRecorder safety timeout reached, forcing stop')
          recorder.stop()
        }
      },
      (duration + 3) * 1000
    ) // Duration + 3 seconds buffer

    // Start recording
    recorder.start()

    // Ensure AudioContext is running
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }

    // Start playback (this feeds data to the recorder)
    source.start(0)

    // Simulate progress based on audio duration
    const startTime = audioContext.currentTime
    progressInterval = setInterval(() => {
      if (!hasResolved) {
        const elapsed = audioContext.currentTime - startTime
        const progress = Math.min(85, 40 + Math.floor((elapsed / duration) * 45))
        onProgress?.({ percent: progress, message: 'Encoding audio...' })
      }
    }, 200)

    // Stop recording when playback ends
    source.onended = () => {
      // Add a small delay to ensure all data is captured
      setTimeout(() => {
        if (!hasResolved) {
          if (progressInterval) clearInterval(progressInterval)
          onProgress?.({ percent: 90, message: 'Finalizing...' })
          if (recorder.state !== 'inactive') {
            recorder.stop()
          }
          clearTimeout(safetyTimeout)
        }
      }, 200)
    }
  })
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
 * Get MediaRecorder-compatible MIME types in order of preference
 * Returns an array of MIME types to try
 */
function getMediaRecorderMimeTypes(format: FormatId): string[] {
  const mimeTypesMap: Record<string, string[]> = {
    ogg: ['audio/ogg; codecs=opus', 'audio/ogg', 'audio/webm; codecs=opus', 'audio/webm'],
    flac: [
      'audio/flac',
      'audio/wav', // Fallback to WAV
    ],
    aac: ['audio/mp4; codecs=mp4a.40.2', 'audio/mp4', 'audio/aac'],
    m4a: ['audio/mp4; codecs=mp4a.40.2', 'audio/mp4', 'audio/aac'],
  }

  return mimeTypesMap[format] || ['audio/webm']
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
