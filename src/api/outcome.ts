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

/** Идёт бой: единственный признак — враг в текущей комнате. */
export function isInBattle(info: GameInfo): boolean {
  return 'enemy' in info.room
}
