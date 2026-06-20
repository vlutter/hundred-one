import type { Answer } from '../../types/game'
import './AnswerBoard.scss'

interface AnswerBoardProps {
  answers: Answer[]
  revealedAnswers: number[]
  canToggle: boolean
  onToggle: (index: number) => void
}

export function AnswerBoard({ answers, revealedAnswers, canToggle, onToggle }: AnswerBoardProps) {
  return (
    <div className="answer-board">
      {answers.map((answer, index) => {
        const isRevealed = revealedAnswers.includes(index)

        return (
          <button
            key={index}
            type="button"
            className={`answer-board__slot ${isRevealed ? 'answer-board__slot--revealed' : ''}`}
            onClick={() => canToggle && onToggle(index)}
            disabled={!canToggle}
            title={isRevealed ? 'Нажмите, чтобы скрыть ответ' : 'Нажмите, чтобы открыть ответ'}
          >
            <span className="answer-board__number">{index + 1}</span>
            {isRevealed ? (
              <>
                <span className="answer-board__text">{answer.text}</span>
                <span className="answer-board__points">{answer.points}</span>
              </>
            ) : (
              <span className="answer-board__hidden">?</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
