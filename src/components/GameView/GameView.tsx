import { AnswerBoard } from '../AnswerBoard/AnswerBoard'
import { GameControls } from '../GameControls/GameControls'
import { ScoreBoard } from '../ScoreBoard/ScoreBoard'
import { StrikeDisplay } from '../StrikeDisplay/StrikeDisplay'
import { useGameState } from '../../hooks/useGameState'
import type { GameConfig } from '../../types/game'
import '../../App.scss'

interface GameViewProps {
  config: GameConfig
  configName: string
  onChangeConfig: () => void
}

export function GameView({ config, configName, onChangeConfig }: GameViewProps) {
  const {
    state,
    resetGame,
    setActiveTeam,
    setTeamName,
    toggleAnswer,
    addStrike,
    awardPoints,
    nextQuestion,
  } = useGameState(config)

  const round = config.rounds[state.currentRoundIndex]
  const question = round?.questions[state.currentQuestionIndex]

  if (!round || !question) {
    return (
      <div className="app">
        <p>Конфигурация игры пуста. Загрузите другой JSON-файл.</p>
        <button type="button" className="app__change-config" onClick={onChangeConfig}>
          Загрузить конфиг
        </button>
      </div>
    )
  }

  const questionNumber =
    config.rounds
      .slice(0, state.currentRoundIndex)
      .reduce((sum, r) => sum + r.questions.length, 0) +
    state.currentQuestionIndex +
    1

  const totalQuestions = config.rounds.reduce((sum, r) => sum + r.questions.length, 0)

  const handleChangeConfig = () => {
    const hasProgress =
      state.phase !== 'playing' ||
      state.currentRoundIndex > 0 ||
      state.currentQuestionIndex > 0 ||
      state.teamScores.some((score) => score > 0) ||
      state.revealedAnswers.length > 0 ||
      state.strikes > 0 ||
      state.roundPoints > 0

    if (hasProgress && !window.confirm('Загрузить другой конфиг? Текущий прогресс будет сброшен.')) {
      return
    }

    onChangeConfig()
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">100 к 1</h1>
        <div className="app__meta">
          <span className="app__round">{round.name}</span>
          <span className="app__question-num">
            Вопрос {questionNumber} / {totalQuestions}
          </span>
        </div>
        <button type="button" className="app__change-config" onClick={handleChangeConfig}>
          {configName} — сменить конфиг
        </button>
      </header>

      <ScoreBoard
        teamNames={state.teamNames}
        teamScores={state.teamScores}
        activeTeam={state.activeTeam}
        roundPoints={state.roundPoints}
        onTeamNameChange={setTeamName}
        onSelectTeam={setActiveTeam}
      />

      <section className="app__question">
        <p className="app__question-text">{question.text}</p>
      </section>

      <AnswerBoard
        answers={question.answers}
        revealedAnswers={state.revealedAnswers}
        canToggle={state.phase !== 'game-end'}
        onToggle={toggleAnswer}
      />

      <StrikeDisplay strikes={state.strikes} />

      <GameControls
        phase={state.phase}
        activeTeam={state.activeTeam}
        teamNames={state.teamNames}
        roundPoints={state.roundPoints}
        onStrike={addStrike}
        onAward={awardPoints}
        onNextQuestion={nextQuestion}
        onReset={resetGame}
      />
    </div>
  )
}
