export interface Answer {
  text: string
  points: number
}

export interface Question {
  id: string
  text: string
  answers: Answer[]
}

export interface Round {
  id: string
  name: string
  questions: Question[]
}

export interface GameConfig {
  teams: [string, string]
  rounds: Round[]
}

export type TeamIndex = 0 | 1

export type GamePhase = 'playing' | 'steal' | 'round-end' | 'game-end'

export interface GameState {
  teamNames: [string, string]
  teamScores: [number, number]
  currentRoundIndex: number
  currentQuestionIndex: number
  activeTeam: TeamIndex
  revealedAnswers: number[]
  strikes: number
  roundPoints: number
  awardedTeam: TeamIndex | null
  phase: GamePhase
}

export const STORAGE_KEY = 'hundred-one-game-state'

export const MAX_STRIKES = 3
