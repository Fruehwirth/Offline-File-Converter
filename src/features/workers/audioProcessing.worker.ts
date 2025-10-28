/**
 * Audio Processing Worker
 * Handles audio format encoding using real audio libraries
 * Receives PCM data from main thread and encodes to target format
 */

import lamejs from 'lamejs'

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
      postProgress(10)

      // Validate input
      if (!channelData || channelData.length === 0) {
        throw new Error('No audio data provided')
      }

      postProgress(20)

      // Encode audio to target format
      const outputBuffer = await encodeAudio(channelData, sampleRate, targetFormat, options)

      postProgress(90)

      // Send success response
      self.postMessage({
        type: 'success',
        data: outputBuffer,
      } as AudioConversionResponse)

      postProgress(100)
    } catch (error) {
      // Send error response
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Audio conversion failed',
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
      postProgress(40)
      return encodeWAV(channelData, sampleRate)

    case 'mp3':
      postProgress(40)
      return encodeMP3(channelData, sampleRate, options?.bitrate || 192)

    default:
      throw new Error(`Unsupported target format: ${targetFormat}. Currently supported: WAV, MP3`)
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

  // data chunk
  writeString(36, 'data')
  view.setUint32(40, dataSize, true) // Data size

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
  }

  postProgress(80)
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

  postProgress(50)

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

  postProgress(60)

  // Encode in chunks (lamejs processes 1152 samples at a time)
  const mp3Data: Int8Array[] = []
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

    // Update progress
    const progress = 60 + Math.floor((i / numSamples) * 15)
    postProgress(progress)
  }

  // Flush remaining data
  const mp3buf = mp3encoder.flush()
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf)
  }

  postProgress(75)

  // Combine all MP3 chunks into a single ArrayBuffer
  const totalLength = mp3Data.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of mp3Data) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  postProgress(85)
  return result.buffer
}
