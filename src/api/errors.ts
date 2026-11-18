import { CODE, HTTP_CODE_PREFIX, NETWORK_ERROR_CODE, isHttpFallbackCode } from './codes'

export interface ApiError {
  status: number
  code: string
  // `| undefined` явно: при `exactOptionalPropertyTypes` класс с полем
  // `detail: string | undefined` иначе не реализует этот интерфейс.
  detail?: string | undefined
  errors?: Record<string, string[]> | undefined
}

/**
 * Ошибка запроса. Наследуемся от `Error`, чтобы работали стек, `instanceof`
 * и обработка в TanStack Query; при этом форма совпадает с `ApiError`.
 */
export class HttpError extends Error implements ApiError {
  readonly status: number
  readonly code: string
  readonly detail: string | undefined
  readonly errors: Record<string, string[]> | undefined

  constructor(error: ApiError) {
    super(error.detail ?? error.code)
    this.name = 'HttpError'
    this.status = error.status
    this.code = error.code
    this.detail = error.detail
    this.errors = error.errors
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function parseFieldErrors(value: unknown): Record<string, string[]> | undefined {
  const record = asRecord(value)
  if (!record) return undefined

  const result: Record<string, string[]> = {}
  let found = false

  for (const [key, raw] of Object.entries(record)) {
    if (!Array.isArray(raw)) continue
    const messages = raw.filter((entry): entry is string => typeof entry === 'string')
    if (messages.length === 0) continue
    result[key] = messages
    found = true
  }

  return found ? result : undefined
}

/**
 * Собирает `ApiError` из тела ProblemDetails.
 * Пустое тело (401/403 от policy, 429) даёт код `HTTP_<status>`.
 */
export function toApiError(status: number, body: unknown): ApiError {
  const record = asRecord(body)

  const rawTitle = record ? record['title'] : undefined
  const code =
    typeof rawTitle === 'string' && rawTitle.length > 0
      ? rawTitle
      : `${HTTP_CODE_PREFIX}${status}`

  const rawDetail = record ? record['detail'] : undefined
  const detail = typeof rawDetail === 'string' && rawDetail.length > 0 ? rawDetail : undefined

  const errors = parseFieldErrors(record ? record['errors'] : undefined)

  const error: ApiError = { status, code }
  if (detail !== undefined) error.detail = detail
  if (errors !== undefined) error.errors = errors
  return error
}

export function isApiError(value: unknown): value is ApiError {
  const record = asRecord(value)
  if (!record) return false
  return typeof record['status'] === 'number' && typeof record['code'] === 'string'
}

/**
 * Текст для игрока.
 *
 * `detail` сервера подходит не всегда: у `NOT_STARTED` он врёт
 * («Игра ещё не начата!» для оконченной игры), у пустого 403 тела нет вовсе.
 * Поэтому часть кодов переводится здесь.
 */
export function messageForError(error: ApiError): string {
  if (error.code === NETWORK_ERROR_CODE) {
    return 'Нет связи с сервером. Проверь подключение и попробуй ещё раз.'
  }
  if (error.status === 429) {
    return 'Слишком много попыток. Подожди минуту.'
  }
  if (error.code === CODE.notStarted) {
    return 'Игра окончена. Начни новую или загрузи сохранение.'
  }
  if (error.code === CODE.incorrectPassword) {
    return 'Неверный пароль.'
  }
  if (error.code === CODE.userNotFound && error.status === 404) {
    return 'Нет такого логина.'
  }
  if (error.status === 403 && isHttpFallbackCode(error.code)) {
    return 'Нет активной игры. Выбери сессию.'
  }
  if (error.status === 401) {
    return 'Сессия истекла. Войди заново.'
  }
  if (error.status >= 500) {
    return 'Сервер не смог выполнить действие. Попробуй ещё раз.'
  }
  if (error.detail !== undefined) {
    return error.detail
  }
  if (error.status === 404) {
    return 'Не найдено.'
  }
  return 'Не удалось выполнить действие.'
}

/**
 * Сообщение валидации по полю. Ключи приходят от FluentValidation
 * в PascalCase (`Login`, `Password`), поэтому сравнение без регистра.
 */
export function fieldError(error: ApiError, ...names: string[]): string | null {
  const errors = error.errors
  if (!errors) return null

  for (const name of names) {
    const exact = errors[name]
    const first = exact ? exact[0] : undefined
    if (first !== undefined) return first
  }

  const lowered = names.map((name) => name.toLowerCase())
  for (const [key, messages] of Object.entries(errors)) {
    if (lowered.includes(key.toLowerCase())) {
      const first = messages[0]
      if (first !== undefined) return first
    }
  }

  return null
}
