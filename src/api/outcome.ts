import { ROOM_NAMES } from './labels'
import type { GameInfo } from './types'

/**
 * Исход партии.
 *
 * С 1.2.0 сервер отдаёт его прямо в снимке состояния: `result: 'win' | 'lose'`
 * у оконченной партии и `null` у идущей. До этого исход выводился эвристикой,
 * поэтому она остаётся фолбэком — но только как третий шаг.
 *
 * - `result` — прямой ответ, ему верим первым;
 * - `isGameStarted === false` — тоже «окончено»: флаг живёт в состоянии давно,
 *   `EndGame()` снимал его всегда, просто в DTO он не попадал. Поэтому мимик,
 *   съевший игрока после F5, больше не выглядит живой партией — но только у
 *   тех состояний, что пришли из 1.2.0 (или из старого сохранения, у которого
 *   `IsGameStarted` уже был записан);
 * - эвристика по комнате и здоровью — последний фолбэк для ответов без обоих
 *   полей (старые фикстуры, кэш прошлой версии).
 *
 * Текст `message` не разбираем: правка формулировки на сервере тихо сломала бы
 * экран.
 */
export type GameOutcome = 'playing' | 'won' | 'lost'

/** Выход из подземелья — единственная комната, где партия считается выигранной. */
function isExitRoom(info: GameInfo): boolean {
  return info.room.name === ROOM_NAMES.exit
}

export function outcomeOf(info: GameInfo): GameOutcome {
  if (info.result === 'win') return 'won'
  if (info.result === 'lose') return 'lost'

  if (info.isGameStarted === false) return isExitRoom(info) ? 'won' : 'lost'

  if (isExitRoom(info)) return 'won'
  // Сервер не ограничивает здоровье снизу: значение бывает отрицательным.
  if (info.currentHealth <= 0) return 'lost'
  return 'playing'
}

export function isGameFinished(info: GameInfo): boolean {
  return outcomeOf(info) !== 'playing'
}

/**
 * Исход с поправкой на то, что `200 GameOver` уже пришёл в ответе на действие.
 *
 * Нужен только для ответов, где нет ни `result`, ни `isGameStarted` (старые
 * фикстуры и кэш): там эвристика может сказать «играем», хотя игра кончена —
 * мимик съедает игрока, не меняя здоровье (ADR 0004, заменён на 0007).
 * Продолжать нечего:
 * любое действие получит `403 NOT_STARTED`, поэтому «играем» превращаем
 * в поражение.
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
