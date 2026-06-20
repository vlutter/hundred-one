import type { GamePhase, TeamIndex } from '../../types/game'
import './GameControls.scss'

interface GameControlsProps {
  phase: GamePhase
  activeTeam: TeamIndex
  teamNames: [string, string]
  roundPoints: number
  onStrike: () => void
  onAward: (team: TeamIndex) => void
  onNextQuestion: () => void
  onReset: () => void
}

export function GameControls({
  phase,
  activeTeam,
  teamNames,
  roundPoints,
  onStrike,
  onAward,
  onNextQuestion,
  onReset,
}: GameControlsProps) {
  const otherTeam = (activeTeam === 0 ? 1 : 0) as TeamIndex

  return (
    <div className="game-controls">
      {phase === 'playing' && (
        <>
          <button type="button" className="game-controls__btn game-controls__btn--strike" onClick={onStrike}>
            Промах ✕
          </button>
          <button
            type="button"
            className="game-controls__btn game-controls__btn--award"
            onClick={() => onAward(activeTeam)}
            disabled={roundPoints === 0}
          >
            Отдать {teamNames[activeTeam]} ({roundPoints} очк.)
          </button>
        </>
      )}

      {phase === 'steal' && (
        <>
          <p className="game-controls__hint">
            3 промаха! Команда «{teamNames[otherTeam]}» может украсть!
          </p>
          <button
            type="button"
            className="game-controls__btn game-controls__btn--award"
            onClick={() => onAward(otherTeam)}
          >
            Украсть — {teamNames[otherTeam]}
          </button>
          <button
            type="button"
            className="game-controls__btn game-controls__btn--award"
            onClick={() => onAward(activeTeam)}
            disabled={roundPoints === 0}
          >
            Оставить — {teamNames[activeTeam]} ({roundPoints} очк.)
          </button>
        </>
      )}

      {(phase === 'round-end' || phase === 'game-end') && (
        <>
          {phase === 'game-end' ? (
            <p className="game-controls__hint game-controls__hint--final">Игра окончена!</p>
          ) : (
            <button type="button" className="game-controls__btn game-controls__btn--next" onClick={onNextQuestion}>
              Следующий вопрос →
            </button>
          )}
        </>
      )}

      <button type="button" className="game-controls__btn game-controls__btn--reset" onClick={onReset}>
        Сбросить игру
      </button>
    </div>
  )
}
