/**
 * Progress bar component
 * Visual indicator of conversion progress
 */

interface ProgressBarProps {
  percent: number
  status?: 'queued' | 'processing' | 'completed' | 'error'
  size?: 'sm' | 'md'
}

const STATUS_COLORS = {
  queued: 'bg-brand-text-secondary/20',
  processing: 'bg-brand-accent',
  completed: 'bg-brand-success',
  error: 'bg-brand-error',
}

export function ProgressBar({ percent, status = 'processing', size = 'md' }: ProgressBarProps) {
  const height = size === 'sm' ? 'h-1' : 'h-2'
  const barColor = STATUS_COLORS[status]

  return (
    <div
      className={`w-full ${height} bg-brand-bg-secondary rounded-full overflow-hidden`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`${height} ${barColor} ease-out rounded-full`}
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          transition: 'width 0.5s ease-out, background-color 0.3s ease-out',
        }}
      />
    </div>
  )
}
