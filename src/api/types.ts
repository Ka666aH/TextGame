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
 * `seed` приходит **строкой**: сервер генерирует 64-битное значение, а
 * JSON-число теряет точность выше 2^53. Строку показываем как есть и
 * возвращаем в `?seed=` без разбора — так круг «увидел → ввёл» замыкается.
 */
export interface Session {
  id: string
  name: string
  seed: string
  createdAt: string
}

export interface CreateSessionResponse {
  sessionId: string
  sessionName: string
  seed: string
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
  isDiscovered: boolean
}

export interface Enemy {
  id: number
  name: string
  description: string
  health: number
  damage: number
  damageBlock: number
}

/** Вид комнаты. Сервер выводит его из CLR-типа, а не из названия. */
export type RoomKind = 'start' | 'empty' | 'small' | 'big' | 'shop' | 'exit' | 'unknown'

/** Ключа `enemy` нет, если врага нет. */
export interface Room {
  number: number
  name: string
  description: string
  /** Обыскана ли комната. Сервер помнит это на своей стороне. */
  isSearched: boolean
  kind: RoomKind
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

/** Исход партии. Сервер отдаёт строку в нижнем регистре, `null` — партия идёт. */
export type GameResult = 'win' | 'lose'

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
  /** `false` у оконченной партии — в том числе у старых сохранений. */
  isGameStarted: boolean
  /** `null` у идущей партии и у состояний, созданных до 1.2.0. */
  result: GameResult | null
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
 * Исход берём из `gameInfo.result`, а не из тела: отдельного кода в нём нет.
 *
 * `battleLog?: never` — не данные, а страховка для типов: без него `BattleWin`
 * структурно подходит под `GameOver` (у него есть и `message`, и `gameInfo`),
 * и исключение «не конец игры» в гардах вырождается в `never`.
 */
export interface GameOver {
  message: string
  gameInfo: GameInfo
  battleLog?: never
}

/**
 * Победа в бою. С 1.2.0 несёт `gameInfo`, поэтому перечитывать `/state` не нужно.
 *
 * По полям это почти `GameOver` (те же `message` и `gameInfo`), поэтому
 * различает их только `battleLog`: у `GameOver` он запрещён типом, а гард
 * `isGameOver` проверяет его отсутствие.
 */
export interface BattleWin {
  message: string
  battleLog: BattleLog
  gameInfo: GameInfo
}
