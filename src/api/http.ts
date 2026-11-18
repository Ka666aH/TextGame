import { NETWORK_ERROR_CODE } from './codes'
import { HttpError, toApiError } from './errors'

/** Префикс прокси. Бэкенд живёт на том же origin, своих хостов в коде нет. */
export const API_PREFIX = '/api'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type QueryValue = string | number | null | undefined

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, QueryValue>
  /**
   * Форма входа: `401` здесь значит «неверный пароль», а не «разлогинь».
   * Для всех остальных запросов 401 уводит на экран входа.
   */
  allowUnauthorized?: boolean
}

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

/**
 * Собирает query-строку, **опуская** пустые значения.
 *
 * Это не косметика: `POST /sessions?sessionName=` сохраняет пустое имя вместо
 * дефолтного `НОВАЯ ИГРА` — сервер использует `??`, а не проверку на пустоту.
 * Поэтому пустую строку нельзя отправлять, её надо именно не передавать.
 */
export function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return ''

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'string' && value.trim().length === 0) continue
    params.set(key, String(value))
  }

  const queryString = params.toString()
  return queryString.length > 0 ? `?${queryString}` : ''
}

function parseJson(text: string): unknown {
  if (text.length === 0) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/**
 * Единственная точка выхода в сеть.
 *
 * Всегда `credentials: 'include'` и всегда относительный `/api/...`.
 * Тело читается как текст: `401`/`403` от policy и `429` приходят пустыми,
 * а `201` регистрации пустой по определению — `res.json()` на них падает.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers = new Headers({ Accept: 'application/json' })

  let payload: string | undefined
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    payload = JSON.stringify(options.body)
  }

  const init: RequestInit = { method, headers, credentials: 'include' }
  if (payload !== undefined) init.body = payload

  let response: Response
  try {
    response = await fetch(`${API_PREFIX}${path}${buildQuery(options.query)}`, init)
  } catch {
    throw new HttpError({ status: 0, code: NETWORK_ERROR_CODE })
  }

  if (!response.ok) {
    const text = await response.text()
    const error = toApiError(response.status, parseJson(text))
    if (error.status === 401 && options.allowUnauthorized !== true) {
      unauthorizedHandler?.()
    }
    throw new HttpError(error)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (text.length === 0) return undefined as T

  return parseJson(text) as T
}
