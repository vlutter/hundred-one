import { MAX_STRIKES } from '../../types/game'
import './StrikeDisplay.scss'

interface StrikeDisplayProps {
  strikes: number
}

export function StrikeDisplay({ strikes }: StrikeDisplayProps) {
  return (
    <div className="strike-display">
      <span className="strike-display__label">Промахи</span>
      <div className="strike-display__strikes">
        {Array.from({ length: MAX_STRIKES }, (_, i) => (
          <span
            key={i}
            className={`strike-display__strike ${i < strikes ? 'strike-display__strike--active' : ''}`}
          >
            ✕
          </span>
        ))}
      </div>
    </div>
  )
}
