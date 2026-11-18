/**
 * Коды ошибок бэкенда. Код — это `title` из ProblemDetails.
 *
 * Список выверен по коду `Ka666aH/TextGameAPI`, а не по документации:
 * недостижимые коды сюда не включены (`ACCESS_TOKEN_NOT_FOUND` объявлен,
 * но не бросается никогда).
 */

export const CODE = {
  validationError: 'VALIDATION_ERROR',
  incorrectPassword: 'INCORRECT_PASSWORD',

  missingUserIdClaim: 'MISSING_USER_ID_CLAIM',
  refreshTokenNotFound: 'REFRESH_TOKEN_NOT_FOUND',
  refreshTokenExpired: 'REFRESH_TOKEN_EXPIRED',
  refreshTokenCompromised: 'REFRESH_TOKEN_COMPROMISED',

  missingSessionIdClaim: 'MISSING_SESSION_ID_CLAIM',
  sessionBelongsToAnotherUser: 'SESSION_BELONGS_TO_ANOTHER_USER',
  saveBelongsToAnotherUser: 'SAVE_BELONGS_TO_ANOTHER_USER',
  impossibleDeleteSave: 'IMPOSSIBLE_DELETE_SAVE',

  notStarted: 'NOT_STARTED',
  inBattle: 'IN_BATTLE',
  roomNotSearched: 'ROOM_NOT_SEARCHED',
  undiscoveredRoom: 'UNDISCOVERED_ROOM_ERROR',
  notInShop: 'NOT_IN_SHOP',
  canNotSteal: 'CAN_NOT_STEAL',
  noMoney: 'NO_MONEY',
  noKey: 'NO_KEY_ERROR',
  noMap: 'NO_MAP_ERROR',
  locked: 'LOCKED',
  closed: 'CLOSED',
  uncarryable: 'UNCARRYABLE_ERROR',
  unsellable: 'UNSELLABLE_ERROR',
  notChest: 'NOT_CHEST',
  notHeal: 'NOT_HEAL',
  notEquipment: 'NOT_EQUIPMENT',

  userNotFound: 'USER_NOT_FOUND',
  sessionNotFound: 'SESSION_NOT_FOUND',
  saveNotFound: 'SAVE_NOT_FOUND',
  roomNotFound: 'ROOM_NOT_FOUND',
  itemNotFound: 'ITEM_NOT_FOUND',
  enemyNotFound: 'ENEMY_NOT_FOUND',
  nothingFound: 'NOTHING_FOUND',

  corruptState: 'CORRUPT_STATE',
  internalServerError: 'INTERNAL_SERVER_ERROR',
} as const

export type ErrorCode = (typeof CODE)[keyof typeof CODE]

/** Префикс кода, когда тело ответа пустое (`401`/`403` от policy, `429`). */
export const HTTP_CODE_PREFIX = 'HTTP_'

/** Отсутствие сети: запрос не дошёл до сервера. */
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR'

/**
 * `401`, после которых куки уже удалены сервером.
 * Любой `401`, кроме `INCORRECT_PASSWORD`, — разлогин.
 */
const LOGOUT_CODES: ReadonlySet<string> = new Set<string>([
  CODE.missingUserIdClaim,
  CODE.refreshTokenNotFound,
  CODE.refreshTokenExpired,
  CODE.refreshTokenCompromised,
])

export function isLogoutCode(code: string): boolean {
  return LOGOUT_CODES.has(code)
}

/**
 * Отказ игрового действия. Показываем `detail`, но сессию не трогаем.
 */
const GAME_REFUSAL_CODES: ReadonlySet<string> = new Set<string>([
  CODE.missingSessionIdClaim,
  CODE.sessionBelongsToAnotherUser,
  CODE.saveBelongsToAnotherUser,
  CODE.impossibleDeleteSave,
  CODE.notStarted,
  CODE.inBattle,
  CODE.roomNotSearched,
  CODE.undiscoveredRoom,
  CODE.notInShop,
  CODE.canNotSteal,
  CODE.noMoney,
  CODE.noKey,
  CODE.noMap,
  CODE.locked,
  CODE.closed,
  CODE.uncarryable,
  CODE.unsellable,
  CODE.notChest,
  CODE.notHeal,
  CODE.notEquipment,
])

export function isGameRefusalCode(code: string): boolean {
  return GAME_REFUSAL_CODES.has(code)
}

export function isHttpFallbackCode(code: string): boolean {
  return code.startsWith(HTTP_CODE_PREFIX)
}
