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
    <span className="animated-format-label">
      {isAnimating && sourceFormat && targetFormat ? (
        <>
          {/* Old label falling down */}
          <span className="animated-format-label__badge animated-format-label__badge--old">
            {getFormatLabel(sourceFormat)}
          </span>

          {/* New label falling in from above */}
          <span className="animated-format-label__badge animated-format-label__badge--new">
            {getFormatLabel(targetFormat)}
          </span>
        </>
      ) : (
        <span className="animated-format-label__badge">{displayLabel}</span>
      )}
    </span>
  )
}
