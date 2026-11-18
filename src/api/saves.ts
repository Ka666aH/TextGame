import { api } from './http'
import type { CreateSaveResponse, Save } from './types'

export interface CreateSavePayload {
  saveName?: string
}

export async function fetchSaves(): Promise<Save[]> {
  return await api<Save[]>('/saves')
}

/**
 * Сохраняет текущее состояние и сразу загружает его обратно, поэтому
 * состояние игры не меняется — но список сохранений пополняется.
 *
 * Пустой `saveName` не передаём: сервер подставит «РУЧНОЕ СОХРАНЕНИЕ ОТ …».
 * Внутри он читает Redis напрямую, так что после долгого простоя возможен
 * `404 SESSION_NOT_FOUND` — это значит «состояние вытеснено», а не «нет сессии`.
 */
export async function createSave(payload: CreateSavePayload = {}): Promise<CreateSaveResponse> {
  return await api<CreateSaveResponse>('/saves', {
    method: 'POST',
    query: { saveName: payload.saveName },
  })
}

/** Загружает сохранение поверх текущего состояния: после него нужен `GET /state`. */
export async function loadSave(id: string): Promise<CreateSaveResponse> {
  return await api<CreateSaveResponse>('/saves/current', {
    method: 'PUT',
    body: { id },
  })
}

/**
 * Автосохранения и начальное сохранение удалить нельзя: сервер ответит
 * `403 IMPOSSIBLE_DELETE_SAVE`. Тип сохранения клиенту не передаётся,
 * поэтому кнопка удаления показывается у всех — иначе её не отличить.
 */
export async function deleteSave(id: string): Promise<void> {
  await api<void>(`/saves/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
