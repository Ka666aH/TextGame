import { HttpError } from './errors'
import { api } from './http'
import type { Me } from './types'

export interface Credentials {
  login: string
  password: string
}

/**
 * Bootstrap-запрос: ровно один на загрузку страницы, его результат решает,
 * какой экран показать.
 *
 * `null` означает «не вошёл». И `401` (куки нет), и `404` (пользователь
 * удалён) — не ошибки, а штатные состояния, поэтому `allowUnauthorized`:
 * глобальный обработчик разлогина здесь не нужен, мы и так на входе.
 */
export async function fetchMe(): Promise<Me | null> {
  try {
    return await api<Me>('/auth/me', { allowUnauthorized: true })
  } catch (error) {
    if (error instanceof HttpError && (error.status === 401 || error.status === 404)) {
      return null
    }
    throw error
  }
}

/**
 * `401` здесь — неверный пароль, а не потерянная сессия: сервер куки
 * не удаляет. Поэтому `allowUnauthorized`, иначе форма входа разлогинивала бы.
 */
export async function login(credentials: Credentials): Promise<void> {
  await api<void>('/auth/tokens', {
    method: 'POST',
    body: credentials,
    allowUnauthorized: true,
  })
}

/** `201` с пустым телом; куки приходят в ответе и уже стоят. */
export async function register(credentials: Credentials): Promise<void> {
  await api<void>('/users', { method: 'POST', body: credentials })
}

/** `401 REFRESH_TOKEN_NOT_FOUND` значит «уже вышли», а не ошибку. */
export async function logout(): Promise<void> {
  try {
    await api<void>('/auth/tokens', { method: 'DELETE', allowUnauthorized: true })
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) return
    throw error
  }
}
