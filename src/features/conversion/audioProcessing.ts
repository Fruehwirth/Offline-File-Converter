/**
 * Audio Processing Conversion
 * Handles audio decoding and format conversion using efficient encoders:
 * - MP3: lamejs encoder (worker)
 * - WAV: Native PCM encoder (worker)
 * - OGG: wasm-media-encoders Vorbis encoder (worker)
 * - FLAC/AAC/M4A: FFmpeg WASM (fast, non-realtime encoding)
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
let processQueueScheduled = false // Flag to prevent multiple scheduled process calls

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
      corePath: `${import.meta.env.BASE_URL}ffmpeg-core.js`,
      workerPath: `${import.meta.env.BASE_URL}ffmpeg-core.worker.js`,
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
 * Processes multiple tasks from the queue until all instances are busy or queue is empty
 */
function processFFmpegQueue(): void {
  // Process as many tasks as we have available instances for
  while (ffmpegQueue.length > 0) {
    // Find an available instance
    const available = ffmpegPool.find(item => !item.busy)
    if (!available) {
      // All instances busy, wait for one to free up
      const busyCount = ffmpegPool.filter(item => item.busy).length
      console.log(
        `[FFmpeg Pool] All instances busy (${busyCount}/${FFMPEG_POOL_SIZE}), ${ffmpegQueue.length} tasks waiting`
      )
      return
    }

    // Get next task from queue
    const queuedTask = ffmpegQueue.shift()
    if (!queuedTask) {
      // Queue was empty (race condition)
      return
    }

    // Mark instance as busy BEFORE starting the task to prevent race conditions
    available.busy = true
    const busyCount = ffmpegPool.filter(item => item.busy).length
    console.log(
      `[FFmpeg Pool] Starting task (${busyCount}/${FFMPEG_POOL_SIZE} busy), ${ffmpegQueue.length} tasks remaining in queue`
    )

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
        const busyCountAfter = ffmpegPool.filter(item => item.busy).length
        console.log(
          `[FFmpeg Pool] Task completed (${busyCountAfter}/${FFMPEG_POOL_SIZE} busy), ${ffmpegQueue.length} tasks in queue`
        )

        // Process next task from queue if any are waiting
        processFFmpegQueue()
      })

    // Continue loop to start next task if available
  }
}

/**
 * Schedule queue processing on the next microtask
 * This allows multiple tasks to be queued before processing starts
 */
function scheduleQueueProcessing(): void {
  if (processQueueScheduled) {
    return
  }

  processQueueScheduled = true

  // Use queueMicrotask to defer processing to next microtask
  // This allows all synchronous queueFFmpegTask calls to complete first
  queueMicrotask(() => {
    processQueueScheduled = false
    processFFmpegQueue()
  })
}

/**
 * Add a task to the FFmpeg queue
 */
function queueFFmpegTask<T>(task: (ffmpeg: any) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const queueLengthBefore = ffmpegQueue.length

    ffmpegQueue.push({
      task,
      resolve,
      reject,
    })

    const busyCount = ffmpegPool.filter(item => item.busy).length
    console.log(
      `[FFmpeg Pool] Task queued (queue: ${queueLengthBefore} -> ${ffmpegQueue.length}, busy: ${busyCount}/${FFMPEG_POOL_SIZE})`
    )

    // Schedule processing (will be deferred to allow batching)
    if (poolInitialized) {
      scheduleQueueProcessing()
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
  onProgress?: (progress: ConversionProgress) => void,
  abortSignal?: AbortSignal
): Promise<Blob> {
  // Check if already aborted
  if (abortSignal?.aborted) {
    throw new Error('User manually cancelled')
  }

  // For MP3, WAV, and OGG, use worker-based encoding (already fast)
  if (targetFormat === 'mp3' || targetFormat === 'wav' || targetFormat === 'ogg') {
    return convertAudioWithWorker(file, targetFormat, options, onProgress, abortSignal)
  }

  // For FLAC, AAC, M4A, use FFmpeg 0.11 WASM
  return convertAudioWithFFmpeg(file, targetFormat, options, onProgress, abortSignal)
}

/**
 * Convert audio using worker (for MP3, WAV, and OGG)
 */
async function convertAudioWithWorker(
  file: File,
  targetFormat: FormatId,
  options: AudioProcessingOptions = {},
  onProgress?: (progress: ConversionProgress) => void,
  abortSignal?: AbortSignal
): Promise<Blob> {
  // Check if already aborted
  if (abortSignal?.aborted) {
    throw new Error('User manually cancelled')
  }

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

  // Check again after async operation
  if (abortSignal?.aborted) {
    await audioContext.close()
    throw new Error('User manually cancelled')
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

    // Handle abort signal
    const onAbort = () => {
      worker.terminate()
      audioContext.close()
      reject(new Error('User manually cancelled'))
    }

    if (abortSignal) {
      if (abortSignal.aborted) {
        onAbort()
        return
      }
      abortSignal.addEventListener('abort', onAbort)
    }

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
        abortSignal?.removeEventListener('abort', onAbort)
        onProgress?.({ percent: 100, message: 'Complete!' })
        resolve(blob)
      } else if (type === 'error') {
        worker.terminate()
        audioContext.close()
        abortSignal?.removeEventListener('abort', onAbort)
        reject(new Error(error || 'Audio conversion failed'))
      }
    }

    worker.onerror = (error: ErrorEvent) => {
      console.error('[Worker Error Event]', {
        message: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        error: error.error,
        fullEvent: error,
      })
      worker.terminate()
      audioContext.close()
      abortSignal?.removeEventListener('abort', onAbort)
      const errorMsg = error.message || error.error?.message || 'Unknown worker error'
      reject(
        new Error(`Worker error: ${errorMsg} (at ${error.filename}:${error.lineno}:${error.colno})`)
      )
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
 * Convert audio using FFmpeg 0.11 WASM (for FLAC, AAC, M4A)
 */
async function convertAudioWithFFmpeg(
  file: File,
  targetFormat: FormatId,
  options: AudioProcessingOptions = {},
  onProgress?: (progress: ConversionProgress) => void,
  abortSignal?: AbortSignal
): Promise<Blob> {
  // Check if already aborted
  if (abortSignal?.aborted) {
    throw new Error('User manually cancelled')
  }

  console.log('[convertAudioWithFFmpeg] Starting conversion:', file.name, 'to', targetFormat)
  onProgress?.({ percent: 0, message: 'Queued...' })

  // Use unique file names to avoid conflicts between concurrent conversions
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  const inputFileName = `input_${timestamp}_${random}.${file.name.split('.').pop() || 'audio'}`
  const outputFileName = `output_${timestamp}_${random}.${targetFormat}`

  // Queue the conversion - will run when an FFmpeg instance is available
  return queueFFmpegTask(async ffmpeg => {
    // Check if cancelled before FFmpeg task starts
    if (abortSignal?.aborted) {
      throw new Error('User manually cancelled')
    }
    // Generate unique conversion ID to prevent cross-contamination
    const conversionId = `${timestamp}_${random}`

    try {
      // Clear any previous progress handler first and set the new conversion ID
      ffmpeg.setProgress(() => {})
      const previousId = ffmpeg._currentConversionId
      ffmpeg._currentConversionId = conversionId
      console.log(`[FFmpeg Worker] Starting conversion for ${file.name}`, {
        conversionId,
        previousId,
        changed: previousId !== conversionId,
      })

      onProgress?.({ percent: 0, message: 'Starting...' })

      // Write input file to FFmpeg's virtual filesystem (0.11 API)
      ffmpeg.FS('writeFile', inputFileName, await fetchFile(file))
      console.log('[convertAudioWithFFmpeg] Input file written:', inputFileName)

      // Check again after async operation
      if (abortSignal?.aborted) {
        try {
          ffmpeg.FS('unlink', inputFileName)
        } catch (e) {
          // Ignore cleanup errors
        }
        throw new Error('User manually cancelled')
      }

      onProgress?.({ percent: 5, message: 'Encoding...' })

      // Build FFmpeg command
      const ffmpegArgs = buildFFmpegArgs(targetFormat, inputFileName, outputFileName, options)
      console.log('[convertAudioWithFFmpeg] Running:', ffmpegArgs.join(' '))

      // Track if encoding has truly started (not just file analysis)
      let encodingStarted = false

      // Set up progress monitoring with ID verification
      ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
        // Check if conversion was cancelled
        if (abortSignal?.aborted) {
          return
        }
        // Only process callbacks for the current conversion
        if (ffmpeg._currentConversionId !== conversionId) {
          console.warn('[FFmpeg Progress] Ignoring callback for wrong conversion:', {
            expected: conversionId,
            actual: ffmpeg._currentConversionId,
            file: file.name,
          })
          return
        }

        // FFmpeg fires spurious callbacks with HIGH ratios (~0.99) during file analysis
        // Ignore these and only start reporting once we see a reasonable ratio
        if (!encodingStarted) {
          // If first callback has abnormally high ratio (>90%), it's during file analysis - ignore it
          if (ratio > 0.9) {
            return
          }
          // Once we see a reasonable ratio, consider encoding started
          encodingStarted = true
        }

        // ratio is 0-1, map to 5-95%
        const percent = Math.min(95, Math.max(5, Math.floor(5 + ratio * 90)))
        console.log(`[FFmpeg Progress] ${file.name}: ${percent}% (conversionId: ${conversionId})`)
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

      // Clear progress handler immediately
      ffmpeg.setProgress(() => {})

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

      // Clear progress handler even on error
      ffmpeg.setProgress(() => {})

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
