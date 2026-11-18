import { api } from './http'
import type { GameInfo, MapRoom } from './types'

/** Основной снимок состояния. Дешёвый: сервер держит его в Redis. */
export async function fetchState(): Promise<GameInfo> {
  return await api<GameInfo>('/state')
}

/**
 * Карта подземелья. Доступна только пока в инвентаре есть предмет «КАРТА»,
 * иначе `403 NO_MAP_ERROR` — это не поломка, а нормальный отказ.
 */
export async function fetchMap(): Promise<MapRoom[]> {
  return await api<MapRoom[]>('/state/map')
}
