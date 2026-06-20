import type { GameConfig } from '../types/game'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateGameConfig(data: unknown): { ok: true; config: GameConfig } | { ok: false; error: string } {
  if (!isRecord(data)) {
    return { ok: false, error: 'Файл должен содержать JSON-объект' }
  }

  if (!Array.isArray(data.teams) || data.teams.length !== 2) {
    return { ok: false, error: 'Нужно ровно 2 команды в поле teams' }
  }

  if (!data.teams.every((team) => typeof team === 'string' && team.trim().length > 0)) {
    return { ok: false, error: 'Имена команд должны быть непустыми строками' }
  }

  if (!Array.isArray(data.rounds) || data.rounds.length === 0) {
    return { ok: false, error: 'Нужен хотя бы один раунд в поле rounds' }
  }

  for (const [roundIndex, round] of data.rounds.entries()) {
    if (!isRecord(round)) {
      return { ok: false, error: `Раунд ${roundIndex + 1}: неверный формат` }
    }

    if (typeof round.id !== 'string' || round.id.trim().length === 0) {
      return { ok: false, error: `Раунд ${roundIndex + 1}: нужен id` }
    }

    if (typeof round.name !== 'string' || round.name.trim().length === 0) {
      return { ok: false, error: `Раунд ${roundIndex + 1}: нужно имя` }
    }

    if (!Array.isArray(round.questions) || round.questions.length === 0) {
      return { ok: false, error: `Раунд «${round.name}»: нужен хотя бы один вопрос` }
    }

    for (const [questionIndex, question] of round.questions.entries()) {
      if (!isRecord(question)) {
        return { ok: false, error: `Раунд «${round.name}», вопрос ${questionIndex + 1}: неверный формат` }
      }

      if (typeof question.id !== 'string' || question.id.trim().length === 0) {
        return { ok: false, error: `Раунд «${round.name}», вопрос ${questionIndex + 1}: нужен id` }
      }

      if (typeof question.text !== 'string' || question.text.trim().length === 0) {
        return { ok: false, error: `Раунд «${round.name}», вопрос ${questionIndex + 1}: нужен текст` }
      }

      if (!Array.isArray(question.answers) || question.answers.length === 0) {
        return { ok: false, error: `Раунд «${round.name}», вопрос ${questionIndex + 1}: нужен хотя бы один ответ` }
      }

      for (const [answerIndex, answer] of question.answers.entries()) {
        if (!isRecord(answer)) {
          return {
            ok: false,
            error: `Раунд «${round.name}», вопрос ${questionIndex + 1}, ответ ${answerIndex + 1}: неверный формат`,
          }
        }

        if (typeof answer.text !== 'string' || answer.text.trim().length === 0) {
          return {
            ok: false,
            error: `Раунд «${round.name}», вопрос ${questionIndex + 1}, ответ ${answerIndex + 1}: нужен текст`,
          }
        }

        if (typeof answer.points !== 'number' || !Number.isFinite(answer.points) || answer.points < 0) {
          return {
            ok: false,
            error: `Раунд «${round.name}», вопрос ${questionIndex + 1}, ответ ${answerIndex + 1}: нужны очки ≥ 0`,
          }
        }
      }
    }
  }

  return {
    ok: true,
    config: {
      teams: [data.teams[0], data.teams[1]],
      rounds: data.rounds as GameConfig['rounds'],
    },
  }
}
