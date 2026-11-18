/**
 * DTO ровно в том виде, в каком их отдаёт бэкенд (camelCase, null-ы приходят явно).
 *
 * Правило: `?` означает «ключа может не быть вовсе», а `| null` — «ключ есть,
 * значение null». Это различие осмысленно: у жезла нет ключа `durability`,
 * у комнаты без врага нет ключа `enemy`. Поэтому проверка везде через
 * `'ключ' in obj`, а не через сравнение с null/undefined.
 */

export interface Me {
  userId: string
  login: string
  sessionId: string | null
  sessionName: string | null
}

/**
 * `seed` — 64-битное число, приходящее обычным JSON-числом.
 * Выше 2^53 точность уже потеряна, а воспроизводимости seed всё равно
 * не даёт (бой идёт на `Random.Shared`). Поэтому значение не читается
 * и не показывается. Seed передаётся только на вход, строкой.
 */
export interface Session {
  id: string
  name: string
  seed: number
  createdAt: string
}

export interface CreateSessionResponse {
  sessionId: string
  sessionName: string
  seed: number
}

export interface SessionCurrentResponse {
  sessionId: string
}

export interface Save {
  id: string
  name: string
  room: number
  createdAt: string
}

export interface CreateSaveResponse {
  saveId: string
}

export interface MapRoom {
  number: number
  name: string
}

export interface Enemy {
  id: number
  name: string
  description: string
  health: number
  damage: number
  damageBlock: number
}

/** Ключа `enemy` нет, если врага нет. */
export interface Room {
  number: number
  name: string
  description: string
  enemy?: Enemy
}

/**
 * Полиморфный предмет. Дискриминатора типа нет — вид выводится
 * в `items.ts` по набору ключей и точному имени.
 */
export interface InventoryItem {
  id?: number | null
  name: string
  description: string
  cost?: number | null
  durability?: number | null
  damage?: number | null
  damageBlock?: number | null
  maxHealthBoost?: number | null
  currentHealthBoost?: number | null
  isClosed?: boolean
}

/** Сундук после `unlock`: без `cost`, поэтому это не `InventoryItem`. */
export interface ChestDto {
  id: number
  name: string
  description: string
  isClosed: boolean
}

export interface GameInfo {
  room: Room
  /** Всегда объект: «кулаки», если оружия нет. */
  weapon: InventoryItem
  helm: InventoryItem | null
  chestplate: InventoryItem | null
  maxHealth: number
  currentHealth: number
  coins: number
  keys: number
  inventory: InventoryItem[]
}

export interface BattleLog {
  target: string
  damageToTarget: number
  targetHealthBeforeAttack: number | null
  targetHealthAfterAttack: number | null
  attacker: string
  damageToAttacker: number
  healthBeforeAttack: number | null
  healthAfterAttack: number | null
}

/**
 * Конец игры — и победа, и поражение одновременно.
 * Машинного признака исхода в теле нет, см. `outcome.ts`.
 */
export interface GameOver {
  message: string
  gameInfo: GameInfo
}

/** Победа в бою. `gameInfo` в теле НЕТ — нужен повторный `GET /state`. */
export interface BattleWin {
  message: string
  battleLog: BattleLog
}
