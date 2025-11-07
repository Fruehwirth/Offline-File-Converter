/**
 * Progress bar component
 * Visual indicator of conversion progress
 */

import { memo } from 'react'

interface ProgressBarProps {
  percent: number
  status?: 'queued' | 'processing' | 'completed' | 'error'
  size?: 'sm' | 'md'
}

export const ProgressBar = memo(function ProgressBar({
  percent,
  status = 'processing',
  size = 'md',
}: ProgressBarProps) {
  return (
    <div
      className={`progress-bar progress-bar--${size}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`progress-bar__fill progress-bar__fill--${size} progress-bar__fill--${status}`}
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
        }}
      />
    </div>
  )
})
