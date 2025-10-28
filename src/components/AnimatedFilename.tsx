/**
 * Animated filename component
 * Shows a falling animation when file extension changes after conversion
 */

import { useState, useEffect } from 'react'

interface AnimatedFilenameProps {
  originalName: string
  convertedName?: string
  isConverted: boolean
}

export function AnimatedFilename({
  originalName,
  convertedName,
  isConverted,
}: AnimatedFilenameProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Parse filename and extension
  const parseFilename = (name: string) => {
    const lastDot = name.lastIndexOf('.')
    if (lastDot === -1) return { basename: name, extension: '' }
    return {
      basename: name.substring(0, lastDot),
      extension: name.substring(lastDot + 1),
    }
  }

  const original = parseFilename(originalName)
  const converted = convertedName ? parseFilename(convertedName) : original

  // Trigger animation when conversion completes
  useEffect(() => {
    if (isConverted && !hasAnimated && original.extension !== converted.extension) {
      setIsAnimating(true)
      setHasAnimated(true)

      // Animation completes after 200ms
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [isConverted, hasAnimated, original.extension, converted.extension])

  const displayExtension = isConverted ? converted.extension : original.extension

  return (
    <p className="text-sm font-medium text-brand-text flex items-center min-w-0">
      <span className="truncate flex-shrink min-w-0">
        {isConverted ? converted.basename : original.basename}
      </span>
      {displayExtension && (
        <>
          <span className="flex-shrink-0">.</span>
          <span className="inline-block relative flex-shrink-0">
            {isAnimating ? (
              <>
                {/* Old extension falling down */}
                <span
                  className="inline-block"
                  style={{
                    animation: 'fallDown 0.2s ease-in forwards',
                  }}
                >
                  {original.extension}
                </span>

                {/* New extension falling in from above */}
                <span
                  className="absolute left-0 top-0 inline-block"
                  style={{
                    animation: 'fallIn 0.2s ease-out forwards',
                    opacity: 0,
                  }}
                >
                  {converted.extension}
                </span>
              </>
            ) : (
              <span>{displayExtension}</span>
            )}
          </span>
        </>
      )}

      <style>{`
        @keyframes fallDown {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(20px);
            opacity: 0;
          }
        }

        @keyframes fallIn {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </p>
  )
}
