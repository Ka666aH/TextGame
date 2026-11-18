import { ROOM_NAMES } from './labels'
import type { GameInfo } from './types'

/**
 * Исход партии.
 *
 * Сервер не передаёт признак победы: `WIN` и `DEFEAT` на его стороне
 * превращаются в один и тот же `GameOver` `{message, gameInfo}`. Признака
 * «игра окончена» тоже нет ни в одном DTO — после перезагрузки страницы
 * `GET /state` отдаёт обычный `GameInfo`. Поэтому исход выводится эвристикой:
 *
 * - победа — игрок дошёл до комнаты «ВЫХОД»;
 * - поражение — здоровье не больше нуля (сервер не ограничивает его снизу,
 *   значение бывает отрицательным);
 * - иначе партия идёт.
 *
 * Текст `message` для классификации не используется: правка формулировки
 * на сервере тихо сломала бы экран.
 */
export type GameOutcome = 'playing' | 'won' | 'lost'

export function outcomeOf(info: GameInfo): GameOutcome {
  if (info.room.name === ROOM_NAMES.exit) return 'won'
  if (info.currentHealth <= 0) return 'lost'
  return 'playing'
}

export function isGameFinished(info: GameInfo): boolean {
  return outcomeOf(info) !== 'playing'
}

/**
 * Исход с поправкой на то, что ответ на действие уже был.
 *
 * Эвристика ошибается ровно в одном случае: открытый мимик съедает игрока,
 * а `EndGame()` на сервере только снимает флаг старта — здоровье остаётся
 * прежним, комната не «ВЫХОД». Если `200 GameOver` уже пришёл в ответе на
 * действие, «играем» означает поражение: продолжать нечего, любое действие
 * получит `403 NOT_STARTED` (ADR 0004).
 */
export function resolveOutcome(info: GameInfo, gameOverSeen: boolean): GameOutcome {
  const derived = outcomeOf(info)
  if (derived === 'playing' && gameOverSeen) return 'lost'
  return derived
}

/** Идёт бой: единственный признак — враг в текущей комнате. */
export function isInBattle(info: GameInfo): boolean {
  return 'enemy' in info.room
}
