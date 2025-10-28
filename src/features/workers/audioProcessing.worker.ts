/**
 * Audio Processing Worker
 * Handles audio format encoding using real audio libraries
 * Receives PCM data from main thread and encodes to target format
 */

// Import the ES module version of lamejs
import { Mp3Encoder } from '@breezystack/lamejs'
// Import OGG Vorbis encoder from wasm-media-encoders
import { createOggEncoder } from 'wasm-media-encoders'

// Create a lamejs object that matches our existing interface
const lamejs = { Mp3Encoder }

export interface AudioConversionMessage {
  type: 'convert'
  channelData: Float32Array[] // PCM audio data (decoded in main thread)
  sampleRate: number
  targetFormat: string
  options?: {
    bitrate?: number // kbps for MP3 (default: 192)
    sampleRate?: number // target sample rate (default: original)
    channels?: number // 1 = mono, 2 = stereo (default: original)
  }
}

export interface AudioConversionResponse {
  type: 'success' | 'error' | 'progress'
  data?: ArrayBuffer
  error?: string
  progress?: number
}

/**
 * Handle incoming messages
 */
self.onmessage = async (event: MessageEvent<AudioConversionMessage>) => {
  const { type, channelData, sampleRate, targetFormat, options } = event.data

  if (type === 'convert') {
    try {
      // Validate input
      if (!channelData || channelData.length === 0) {
        throw new Error('No audio data provided')
      }

      postProgress(0)

      // Encode audio to target format (this will report its own progress 0-100)
      const outputBuffer = await encodeAudio(channelData, sampleRate, targetFormat, options)

      // Send success response
      self.postMessage({
        type: 'success',
        data: outputBuffer,
      } as AudioConversionResponse)

      postProgress(100)
    } catch (error) {
      // Send detailed error response
      console.error('[Worker] Audio conversion error:', error)
      const errorMessage =
        error instanceof Error ? `${error.message}\nStack: ${error.stack}` : String(error)
      self.postMessage({
        type: 'error',
        error: errorMessage || 'Audio conversion failed',
      } as AudioConversionResponse)
    }
  }
}

/**
 * Post progress update
 */
function postProgress(progress: number) {
  self.postMessage({
    type: 'progress',
    progress,
  } as AudioConversionResponse)
}

/**
 * Encode audio data to target format
 */
async function encodeAudio(
  channelData: Float32Array[],
  sampleRate: number,
  targetFormat: string,
  options?: AudioConversionMessage['options']
): Promise<ArrayBuffer> {
  switch (targetFormat.toLowerCase()) {
    case 'wav':
      return encodeWAV(channelData, sampleRate)

    case 'mp3':
      return encodeMP3(channelData, sampleRate, options?.bitrate || 192)

    case 'ogg':
      return await encodeOGG(channelData, sampleRate, options?.bitrate || 192)

    default:
      throw new Error(
        `Unsupported target format: ${targetFormat}. Currently supported: WAV, MP3, OGG`
      )
  }
}

/**
 * Encode audio to WAV format (PCM)
 */
function encodeWAV(channelData: Float32Array[], sampleRate: number): ArrayBuffer {
  const numChannels = channelData.length
  const numSamples = channelData[0].length
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8

  postProgress(10)

  // WAV file structure:
  // - RIFF header (12 bytes)
  // - fmt chunk (24 bytes)
  // - data chunk (8 bytes + audio data)
  const dataSize = numSamples * numChannels * bytesPerSample
  const fileSize = 44 + dataSize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  // Helper to write string
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  postProgress(20)

  // RIFF header
  writeString(0, 'RIFF')
  view.setUint32(4, fileSize - 8, true) // File size - 8
  writeString(8, 'WAVE')

  // fmt chunk
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true) // Number of channels
  view.setUint32(24, sampleRate, true) // Sample rate
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true) // Byte rate
  view.setUint16(32, numChannels * bytesPerSample, true) // Block align
  view.setUint16(34, bitsPerSample, true) // Bits per sample

  postProgress(40)

  // data chunk
  writeString(36, 'data')
  view.setUint32(40, dataSize, true) // Data size

  postProgress(50)

  // Write audio data (interleaved)
  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]))
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, int16, true)
      offset += 2
    }

    // Report progress periodically
    if (i % 10000 === 0) {
      const progress = 50 + Math.floor((i / numSamples) * 45)
      postProgress(progress)
    }
  }

  postProgress(95)
  return buffer
}

/**
 * Encode audio to MP3 format using lamejs
 */
function encodeMP3(channelData: Float32Array[], sampleRate: number, bitrate: number): ArrayBuffer {
  const numChannels = channelData.length
  const numSamples = channelData[0].length

  // Initialize MP3 encoder
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate)

  postProgress(5)

  // Convert Float32Array to Int16Array for lamejs
  const left = new Int16Array(numSamples)
  const right = numChannels > 1 ? new Int16Array(numSamples) : null

  for (let i = 0; i < numSamples; i++) {
    // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
    const leftSample = Math.max(-1, Math.min(1, channelData[0][i]))
    left[i] = leftSample < 0 ? leftSample * 0x8000 : leftSample * 0x7fff

    if (right && channelData[1]) {
      const rightSample = Math.max(-1, Math.min(1, channelData[1][i]))
      right[i] = rightSample < 0 ? rightSample * 0x8000 : rightSample * 0x7fff
    }
  }

  postProgress(15)

  // Encode in chunks (lamejs processes 1152 samples at a time)
  const mp3Data: Uint8Array[] = []
  const chunkSize = 1152

  for (let i = 0; i < numSamples; i += chunkSize) {
    const leftChunk = left.subarray(i, i + chunkSize)
    const rightChunk = right ? right.subarray(i, i + chunkSize) : null

    const mp3buf = rightChunk
      ? mp3encoder.encodeBuffer(leftChunk, rightChunk)
      : mp3encoder.encodeBuffer(leftChunk)

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf)
    }

    // Update progress - map encoding to 15-90%
    const progress = 15 + Math.floor((i / numSamples) * 75)
    postProgress(progress)
  }

  // Flush remaining data
  const mp3buf = mp3encoder.flush()
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf)
  }

  postProgress(92)

  // Combine all MP3 chunks into a single ArrayBuffer
  const totalLength = mp3Data.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of mp3Data) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  postProgress(98)
  return result.buffer
}

/**
 * Encode audio to OGG Vorbis format using wasm-media-encoders
 */
async function encodeOGG(
  channelData: Float32Array[],
  sampleRate: number,
  bitrate: number
): Promise<ArrayBuffer> {
  const numChannels = channelData.length

  postProgress(5)

  // Create OGG Vorbis encoder (returns a promise)
  let encoder
  try {
    console.log('[Worker] Creating OGG encoder...')
    encoder = await createOggEncoder()
    console.log('[Worker] OGG encoder created successfully')
  } catch (error) {
    console.error('[Worker] Failed to create OGG encoder:', error)
    throw new Error(
      `Failed to initialize OGG encoder: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  postProgress(10)

  // Configure encoder
  // Map bitrate to quality (rough approximation):
  // 192 kbps ≈ quality 5.0
  // Quality scale is -1.0 (worst) to 10.0 (best)
  const quality = Math.max(-1, Math.min(10, (bitrate / 192) * 5.0))

  encoder.configure({
    sampleRate,
    channels: numChannels,
    vbrQuality: quality,
  })

  postProgress(15)

  // wasm-media-encoders expects separate Float32Array for each channel
  // Process in chunks to show progress
  const chunkSize = 1152 // Same as MP3 chunk size
  const numSamples = channelData[0].length
  const oggChunks: Uint8Array[] = []

  for (let i = 0; i < numSamples; i += chunkSize) {
    const end = Math.min(i + chunkSize, numSamples)
    const chunks = channelData.map(channel => channel.subarray(i, end))

    // encode() returns a Uint8Array that must be copied immediately
    const encodedChunk = encoder.encode(chunks)
    if (encodedChunk.length > 0) {
      // MUST copy the data before next encode() call
      oggChunks.push(new Uint8Array(encodedChunk))
    }

    // Report progress (15% - 90%)
    const progress = 15 + Math.floor(((i + chunkSize) / numSamples) * 75)
    postProgress(Math.min(90, progress))
  }

  postProgress(92)

  // Finalize encoding (get last samples)
  const finalChunk = encoder.finalize()
  if (finalChunk.length > 0) {
    oggChunks.push(new Uint8Array(finalChunk))
  }

  postProgress(95)

  // Combine all OGG chunks into a single ArrayBuffer
  const totalLength = oggChunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of oggChunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  postProgress(98)
  return result.buffer
}
