/**
 * AudioPreviewIcon component
 * Displays an audio icon that flips on hover and plays the audio file
 * with smooth fade in/out effects
 */

import { useState, useRef, useEffect } from 'react'
import { FileTypeIcon } from './FileTypeIcon'

interface AudioPreviewIconProps {
  file: File
}

export function AudioPreviewIcon({ file }: AudioPreviewIconProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [waveformData, setWaveformData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const isHoveringRef = useRef(false) // Track hover state for fade functions
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeIntervalRef = useRef<number | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Create audio element and URL on mount
  useEffect(() => {
    // Create object URL for audio
    const url = URL.createObjectURL(file)
    audioUrlRef.current = url

    // Create audio element
    const audio = new Audio(url)
    audio.volume = 0 // Start at 0 for fade in
    audio.loop = true // Loop while hovering
    audio.crossOrigin = 'anonymous' // Required for Web Audio API
    audioRef.current = audio

    // Set up Web Audio API for waveform visualization
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256 // Small FFT for performance
      analyser.smoothingTimeConstant = 0.8 // Smooth transitions

      const source = audioContext.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(audioContext.destination)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
    } catch (error) {
      console.warn('Web Audio API not supported, falling back to static visualization', error)
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      if (fadeIntervalRef.current) {
        cancelAnimationFrame(fadeIntervalRef.current)
      }
    }
  }, [file])

  // Update waveform visualization
  const updateWaveform = () => {
    if (!analyserRef.current || !isHoveringRef.current) {
      setWaveformData([0, 0, 0, 0, 0, 0, 0])
      return
    }

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    // Use logarithmic scale for musical frequency distribution
    // Focus on 0 Hz to ~10 kHz where most musical content lives
    const bars = 7
    const maxFreqBin = Math.floor(bufferLength * 0.45) // Use first 45% of spectrum (~10 kHz)
    const newWaveformData: number[] = []

    for (let i = 0; i < bars; i++) {
      // Logarithmic distribution: each bar covers exponentially wider frequency range
      // This matches human hearing and music structure
      const logStart = Math.log(i + 1) / Math.log(bars + 1)
      const logEnd = Math.log(i + 2) / Math.log(bars + 1)

      const start = Math.floor(logStart * maxFreqBin)
      const end = Math.floor(logEnd * maxFreqBin)
      const width = end - start

      if (width === 0) continue

      let sum = 0
      for (let j = start; j < end; j++) {
        sum += dataArray[j]
      }

      // Average the frequency data for this band and normalize to 0-1
      const average = sum / width / 255
      newWaveformData.push(average)
    }

    setWaveformData(newWaveformData)

    // Continue animation if still hovering
    if (isHoveringRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateWaveform)
    }
  }

  // Handle hover state changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Update ref to track current hover state
    isHoveringRef.current = isHovering

    if (isHovering) {
      // Cancel any ongoing fade animations
      if (fadeIntervalRef.current) {
        cancelAnimationFrame(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }

      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }

      // Start playing and fade in
      audio.currentTime = 0 // Start from beginning
      audio.play().catch(() => {
        // Ignore play errors (e.g., user hasn't interacted with page yet)
      })
      fadeIn()

      // Start waveform visualization
      updateWaveform()
    } else {
      // Cancel any ongoing fade animations
      if (fadeIntervalRef.current) {
        cancelAnimationFrame(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }

      // Stop waveform visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Fade out then pause
      fadeOut()

      // Failsafe: ensure audio will stop after fade completes
      setTimeout(() => {
        if (audio && !isHoveringRef.current && !audio.paused) {
          audio.pause()
          audio.volume = 0
          audio.currentTime = 0
        }
      }, 500) // Wait 500ms (longer than 0.4s fade out)
    }

    // Cleanup fade interval on unmount or when hover state changes
    return () => {
      if (fadeIntervalRef.current) {
        cancelAnimationFrame(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isHovering])

  const fadeIn = () => {
    const audio = audioRef.current
    if (!audio) return

    const targetVolume = 0.25
    const fadeStep = 0.004 // Volume increment per frame (0.25 / 62.5 frames = 1 second at 60fps)
    const fadeInterval = 16 // ~60fps

    const fade = () => {
      // Check if still hovering using ref, stop fade-in if not
      if (!audio || !isHoveringRef.current) {
        // Stop fade-in animation but don't pause - let fadeOut handle it
        if (fadeIntervalRef.current) {
          cancelAnimationFrame(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
        return
      }

      if (audio.volume < targetVolume) {
        audio.volume = Math.min(audio.volume + fadeStep, targetVolume)
        fadeIntervalRef.current = window.requestAnimationFrame(() => {
          setTimeout(fade, fadeInterval)
        })
      } else {
        fadeIntervalRef.current = null
      }
    }

    fade()
  }

  const fadeOut = () => {
    const audio = audioRef.current
    if (!audio) return

    const fadeStep = 0.01 // Volume decrement per frame (0.25 / 25 frames = 0.4 seconds at 60fps)
    const fadeInterval = 16 // ~60fps

    const fade = () => {
      if (!audio) return

      if (audio.volume > 0.01) {
        audio.volume = Math.max(audio.volume - fadeStep, 0)
        fadeIntervalRef.current = window.requestAnimationFrame(() => {
          setTimeout(fade, fadeInterval)
        })
      } else {
        // Ensure volume is exactly 0 and pause audio
        audio.volume = 0
        audio.pause()
        audio.currentTime = 0 // Reset to beginning for next play

        // Clear interval ref
        if (fadeIntervalRef.current) {
          cancelAnimationFrame(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
      }
    }

    fade()
  }

  return (
    <div
      className="relative w-full h-full cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovering ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front side - Audio icon */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          <FileTypeIcon file={file} />
        </div>

        {/* Back side - Playing indicator with real-time waveform */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="w-full h-full flex items-center justify-center bg-brand-accent/10 rounded-lg">
            {/* Real-time audio waveform visualization - 7 bars */}
            <div className="flex items-center justify-center gap-0.5">
              {waveformData.map((value, index) => {
                // Min height 4px, max height 28px
                const minHeight = 4
                const maxHeight = 28
                const height = minHeight + value * (maxHeight - minHeight)

                return (
                  <div
                    key={index}
                    className="w-1 bg-brand-accent rounded-full transition-all duration-75 ease-out"
                    style={{
                      height: `${height}px`,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
