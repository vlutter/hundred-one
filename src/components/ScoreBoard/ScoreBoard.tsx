import type { TeamIndex } from '../../types/game'
import './ScoreBoard.scss'

interface ScoreBoardProps {
  teamNames: [string, string]
  teamScores: [number, number]
  activeTeam: TeamIndex
  roundPoints: number
  onTeamNameChange: (team: TeamIndex, name: string) => void
  onTeamScoreChange: (team: TeamIndex, score: number) => void
  onRoundPointsChange: (points: number) => void
  onSelectTeam: (team: TeamIndex) => void
}

export function ScoreBoard({
  teamNames,
  teamScores,
  activeTeam,
  roundPoints,
  onTeamNameChange,
  onTeamScoreChange,
  onRoundPointsChange,
  onSelectTeam,
}: ScoreBoardProps) {
  return (
    <div className="score-board">
      {([0, 1] as TeamIndex[]).map((team) => (
        <button
          key={team}
          type="button"
          className={`score-board__team score-board__team--${team} ${activeTeam === team ? 'score-board__team--active' : ''}`}
          onClick={() => onSelectTeam(team)}
        >
          <input
            className="score-board__name"
            value={teamNames[team]}
            onChange={(e) => onTeamNameChange(team, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <input
            type="number"
            min={0}
            className="score-board__score"
            value={teamScores[team]}
            onChange={(e) => onTeamScoreChange(team, Number(e.target.value) || 0)}
            onClick={(e) => e.stopPropagation()}
            title="Нажмите, чтобы исправить счёт"
          />
          {activeTeam === team && (
            <label className="score-board__round-points" onClick={(e) => e.stopPropagation()}>
              +
              <input
                type="number"
                min={0}
                className="score-board__round-points-input"
                value={roundPoints}
                onChange={(e) => onRoundPointsChange(Number(e.target.value) || 0)}
                title="Баллы текущего раунда"
              />
            </label>
          )}
        </button>
      ))}
    </div>
  )
}
