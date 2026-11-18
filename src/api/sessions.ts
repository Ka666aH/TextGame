import { HttpError } from './errors'
import { api } from './http'
import type { CreateSessionResponse, Session, SessionCurrentResponse } from './types'

export interface CreateSessionPayload {
  sessionName?: string
  /**
   * Строкой и без `Number()`: seed — 64-битное число, а JSON-число теряет
   * точность выше 2^53. Сервер принимает его как `long` из query.
   */
  seed?: string
}

export async function fetchSessions(): Promise<Session[]> {
  return await api<Session[]>('/sessions')
}

/**
 * Пустые `sessionName` и `seed` не передаются вовсе — их отбрасывает
 * `buildQuery`. Иначе сервер сохранил бы пустое имя вместо «НОВАЯ ИГРА»,
 * потому что использует `??`, а не проверку на пустоту.
 */
export async function createSession(
  payload: CreateSessionPayload = {},
): Promise<CreateSessionResponse> {
  return await api<CreateSessionResponse>('/sessions', {
    method: 'POST',
    query: { sessionName: payload.sessionName, seed: payload.seed },
  })
}

export async function selectSession(id: string): Promise<SessionCurrentResponse> {
  return await api<SessionCurrentResponse>('/sessions/current', {
    method: 'PUT',
    body: { id },
  })
}

/** Удаление активной сессии — штатный путь: сервер сам снимает claim. */
export async function deleteSession(id: string): Promise<void> {
  try {
    await api<void>(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch (error) {
    // Сессию уже удалили в другой вкладке — цель всё равно достигнута.
    if (error instanceof HttpError && error.status === 404) return
    throw error
  }
}
