/**
 * Коды ошибок бэкенда. Код — это `title` из ProblemDetails.
 *
 * Список выверен по коду `Ka666aH/TextGameAPI` (v1.2.0). С этой версии `401`
 * от challenge и `403` от policy тоже приходят с телом, поэтому префикс
 * `HTTP_` остаётся фолбэком для старых ответов и для чужих прокси, а не
 * основным путём.
 */

export const CODE = {
  validationError: 'VALIDATION_ERROR',
  incorrectPassword: 'INCORRECT_PASSWORD',

  missingUserIdClaim: 'MISSING_USER_ID_CLAIM',
  /** С 1.2.0 — `title` у `401` от `[Authorize]` (вместе с `WWW-Authenticate`). */
  accessTokenNotFound: 'ACCESS_TOKEN_NOT_FOUND',
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

  /** Лимит авторизации. С 1.2.0 приходит с телом и `Retry-After`. */
  rateLimited: 'RATE_LIMITED',

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

export function isHttpFallbackCode(code: string): boolean {
  return code.startsWith(HTTP_CODE_PREFIX)
}
