import gameConfig from '../game-config.json'
import { AnswerBoard } from './components/AnswerBoard/AnswerBoard'
import { GameControls } from './components/GameControls/GameControls'
import { ScoreBoard } from './components/ScoreBoard/ScoreBoard'
import { StrikeDisplay } from './components/StrikeDisplay/StrikeDisplay'
import { useGameState } from './hooks/useGameState'
import type { GameConfig } from './types/game'
import './App.scss'

const config = gameConfig as GameConfig

function App() {
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
        <p>Конфигурация игры пуста. Заполните game-config.json</p>
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

export default App
