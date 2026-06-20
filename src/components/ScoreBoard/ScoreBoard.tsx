import type { TeamIndex } from '../../types/game'
import './ScoreBoard.scss'

interface ScoreBoardProps {
  teamNames: [string, string]
  teamScores: [number, number]
  activeTeam: TeamIndex
  roundPoints: number
  onTeamNameChange: (team: TeamIndex, name: string) => void
  onSelectTeam: (team: TeamIndex) => void
}

export function ScoreBoard({
  teamNames,
  teamScores,
  activeTeam,
  roundPoints,
  onTeamNameChange,
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
          <span className="score-board__score">{teamScores[team]}</span>
          {activeTeam === team && roundPoints > 0 && (
            <span className="score-board__round-points">+{roundPoints}</span>
          )}
        </button>
      ))}
    </div>
  )
}
