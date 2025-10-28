/**
 * Animated format label component
 * Shows a falling animation when format label changes after conversion
 */

import { useState, useEffect } from 'react'
import { getFormatLabel, type FormatId } from '../features/conversion/formatRegistry'

interface AnimatedFormatLabelProps {
  sourceFormat: FormatId | null
  targetFormat: FormatId | null
  isConverted: boolean
}

export function AnimatedFormatLabel({
  sourceFormat,
  targetFormat,
  isConverted,
}: AnimatedFormatLabelProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Trigger animation when conversion completes
  useEffect(() => {
    if (
      isConverted &&
      !hasAnimated &&
      sourceFormat &&
      targetFormat &&
      sourceFormat !== targetFormat
    ) {
      setIsAnimating(true)
      setHasAnimated(true)

      // Animation completes after 200ms
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [isConverted, hasAnimated, sourceFormat, targetFormat])

  if (!sourceFormat) return null

  const displayFormat = isConverted && targetFormat ? targetFormat : sourceFormat
  const displayLabel = getFormatLabel(displayFormat)

  return (
    <span className="inline-block relative">
      {isAnimating && sourceFormat && targetFormat ? (
        <>
          {/* Old label falling down */}
          <span
            className="px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent inline-block whitespace-nowrap"
            style={{
              animation: 'fallDown 0.2s ease-in forwards',
              minWidth: '150px',
            }}
          >
            {getFormatLabel(sourceFormat)}
          </span>

          {/* New label falling in from above */}
          <span
            className="absolute left-0 top-0 px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent inline-block whitespace-nowrap"
            style={{
              animation: 'fallIn 0.2s ease-out forwards',
              opacity: 0,
              minWidth: '150px',
            }}
          >
            {getFormatLabel(targetFormat)}
          </span>
        </>
      ) : (
        <span
          className="px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent whitespace-nowrap"
          style={{ minWidth: '150px' }}
        >
          {displayLabel}
        </span>
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
    </span>
  )
}
