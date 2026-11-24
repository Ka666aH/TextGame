import type {
  BattleLog,
  BattleWin,
  GameInfo,
  GameOver,
  InventoryItem,
  MapRoom,
  Room,
} from './types'

/**
 * Гарды ответов.
 *
 * Шесть эндпоинтов возвращают разные тела с одним и тем же `200`, а
 * дискриминатора в них нет. Различаем по **наличию ключа**, а не по истинности
 * значения: `'gameInfo' in body`, а не `body.gameInfo !== undefined`.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Конец игры. Это **и победа, и поражение** — см. `outcomeOf`.
 *
 * `battleLog` обязателен в исключении: с 1.2.0 победа в бою тоже несёт
 * `gameInfo` и `message`, поэтому без этой проверки каждая победа уходила бы
 * на экран исхода.
 */
export function isGameOver(value: unknown): value is GameOver {
  return isRecord(value) && 'gameInfo' in value && 'message' in value && !('battleLog' in value)
}

/** Победа в бою: `message`, один `battleLog` и (с 1.2.0) свежее состояние. */
export function isBattleWin(value: unknown): value is BattleWin {
  return isRecord(value) && 'battleLog' in value && 'message' in value
}

/**
 * Один обмен ударами. Отличается от `BattleWin` отсутствием `message`:
 * у победы в теле есть и `message`, и `battleLog`.
 */
export function isBattleLog(value: unknown): value is BattleLog {
  return isRecord(value) && 'target' in value && 'attacker' in value && !('message' in value)
}

/** Ответ `attack`: ровно два удара, `[0]` — игрок, `[1]` — враг. */
export function isBattleLogArray(value: unknown): value is BattleLog[] {
  return Array.isArray(value) && value.every((entry) => isBattleLog(entry))
}

export function isGameInfo(value: unknown): value is GameInfo {
  return (
    isRecord(value) &&
    'room' in value &&
    'weapon' in value &&
    'maxHealth' in value &&
    'currentHealth' in value &&
    'inventory' in value
  )
}

export function isRoom(value: unknown): value is Room {
  return isRecord(value) && 'number' in value && 'name' in value && 'description' in value
}

export function isInventoryItemArray(value: unknown): value is InventoryItem[] {
  return Array.isArray(value) && value.every((entry) => isRecord(entry) && 'name' in entry)
}

export function isMapRoomArray(value: unknown): value is MapRoom[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => isRecord(entry) && 'number' in entry && 'name' in entry)
  )
}

/** `GET /state/coins` и `/state/keys` отдают голое число. */
export function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
