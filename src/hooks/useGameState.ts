import { useCallback, useEffect, useState } from 'react'
import type { GameConfig, GameState, Question, TeamIndex } from '../types/game'
import { MAX_STRIKES, STORAGE_KEY } from '../types/game'

function createInitialState(config: GameConfig): GameState {
  return {
    teamNames: [...config.teams],
    teamScores: [0, 0],
    currentRoundIndex: 0,
    currentQuestionIndex: 0,
    activeTeam: 0,
    revealedAnswers: [],
    strikes: 0,
    roundPoints: 0,
    awardedTeam: null,
    phase: 'playing',
  }
}

function loadState(config: GameConfig): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState(config)

    const parsed = JSON.parse(raw) as GameState
    const maxRound = config.rounds.length - 1
    const round = config.rounds[parsed.currentRoundIndex]
    const maxQuestion = round ? round.questions.length - 1 : 0

    return {
      ...createInitialState(config),
      ...parsed,
      teamNames: parsed.teamNames ?? [...config.teams],
      currentRoundIndex: Math.min(parsed.currentRoundIndex ?? 0, maxRound),
      currentQuestionIndex: Math.min(parsed.currentQuestionIndex ?? 0, maxQuestion),
      awardedTeam: parsed.awardedTeam ?? null,
    }
  } catch {
    return createInitialState(config)
  }
}

function sumRevealedPoints(question: Question, revealedAnswers: number[]): number {
  return revealedAnswers.reduce((sum, i) => sum + (question.answers[i]?.points ?? 0), 0)
}

function resolvePhase(prev: GameState): GameState['phase'] {
  return prev.strikes >= MAX_STRIKES ? 'steal' : 'playing'
}

function applyPendingPoints(
  prev: GameState,
  team: TeamIndex,
): Pick<GameState, 'teamScores' | 'roundPoints'> {
  if (prev.roundPoints === 0) {
    return { teamScores: prev.teamScores, roundPoints: 0 }
  }

  const teamScores = [...prev.teamScores] as [number, number]
  teamScores[team] += prev.roundPoints
  return { teamScores, roundPoints: 0 }
}

export function useGameState(config: GameConfig) {
  const [state, setState] = useState<GameState>(() => loadState(config))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const resetGame = useCallback(() => {
    setState(createInitialState(config))
  }, [config])

  const setActiveTeam = useCallback((team: TeamIndex) => {
    setState((prev) => ({ ...prev, activeTeam: team }))
  }, [])

  const setTeamName = useCallback((team: TeamIndex, name: string) => {
    setState((prev) => {
      const teamNames = [...prev.teamNames] as [string, string]
      teamNames[team] = name
      return { ...prev, teamNames }
    })
  }, [])

  const setTeamScore = useCallback((team: TeamIndex, score: number) => {
    setState((prev) => {
      const teamScores = [...prev.teamScores] as [number, number]
      teamScores[team] = Math.max(0, Math.round(score))
      return { ...prev, teamScores }
    })
  }, [])

  const setRoundPoints = useCallback((points: number) => {
    setState((prev) => ({
      ...prev,
      roundPoints: Math.max(0, Math.round(points)),
    }))
  }, [])

  const toggleAnswer = useCallback((index: number) => {
    setState((prev) => {
      if (prev.phase === 'game-end') return prev

      const round = config.rounds[prev.currentRoundIndex]
      const question = round?.questions[prev.currentQuestionIndex]
      const answer = question?.answers[index]
      if (!question || !answer) return prev

      const isRevealed = prev.revealedAnswers.includes(index)

      if (!isRevealed) {
        const revealedAnswers = [...prev.revealedAnswers, index]
        const roundPoints = prev.roundPoints + answer.points
        const allRevealed = revealedAnswers.length === question.answers.length

        if (allRevealed) {
          const settled = applyPendingPoints({ ...prev, roundPoints }, prev.activeTeam)
          return {
            ...prev,
            revealedAnswers,
            ...settled,
            awardedTeam: prev.activeTeam,
            phase: 'round-end',
          }
        }

        return {
          ...prev,
          revealedAnswers,
          roundPoints,
        }
      }

      const revealedAnswers = prev.revealedAnswers.filter((i) => i !== index)
      const teamScores = [...prev.teamScores] as [number, number]

      if (prev.awardedTeam !== null) {
        teamScores[prev.awardedTeam] -= answer.points
        return {
          ...prev,
          revealedAnswers,
          teamScores,
          roundPoints: sumRevealedPoints(question, revealedAnswers),
          awardedTeam: null,
          phase: resolvePhase(prev),
        }
      }

      return {
        ...prev,
        revealedAnswers,
        roundPoints: Math.max(0, prev.roundPoints - answer.points),
        phase: prev.phase === 'round-end' ? resolvePhase(prev) : prev.phase,
      }
    })
  }, [config])

  const addStrike = useCallback(() => {
    setState((prev) => {
      const strikes = Math.min(prev.strikes + 1, MAX_STRIKES)
      const phase = strikes >= MAX_STRIKES ? 'steal' : prev.phase
      return { ...prev, strikes, phase }
    })
  }, [])

  const awardPoints = useCallback((team: TeamIndex) => {
    setState((prev) => ({
      ...prev,
      ...applyPendingPoints(prev, team),
      awardedTeam: team,
      phase: 'round-end',
    }))
  }, [])

  const nextQuestion = useCallback(() => {
    setState((prev) => {
      const settled = applyPendingPoints(prev, prev.activeTeam)
      const round = config.rounds[prev.currentRoundIndex]
      const isLastQuestion = prev.currentQuestionIndex >= round.questions.length - 1
      const isLastRound = prev.currentRoundIndex >= config.rounds.length - 1

      if (isLastQuestion && isLastRound) {
        return { ...prev, ...settled, phase: 'game-end' }
      }

      if (isLastQuestion) {
        return {
          ...prev,
          ...settled,
          currentRoundIndex: prev.currentRoundIndex + 1,
          currentQuestionIndex: 0,
          revealedAnswers: [],
          strikes: 0,
          awardedTeam: null,
          phase: 'playing',
        }
      }

      return {
        ...prev,
        ...settled,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        revealedAnswers: [],
        strikes: 0,
        awardedTeam: null,
        phase: 'playing',
      }
    })
  }, [config])

  const goToQuestion = useCallback((roundIndex: number, questionIndex: number) => {
    setState((prev) => ({
      ...prev,
      currentRoundIndex: roundIndex,
      currentQuestionIndex: questionIndex,
      revealedAnswers: [],
      strikes: 0,
      roundPoints: 0,
      awardedTeam: null,
      phase: 'playing',
    }))
  }, [])

  return {
    state,
    resetGame,
    setActiveTeam,
    setTeamName,
    setTeamScore,
    setRoundPoints,
    toggleAnswer,
    addStrike,
    awardPoints,
    nextQuestion,
    goToQuestion,
  }
}
