import { api } from './http'
import type { BattleLog, BattleWin, GameInfo, GameOver, InventoryItem, MapRoom, Room } from './types'

export type EquipmentSlot = 'weapon' | 'helm' | 'chestplate'

/**
 * Часть действий отвечает двумя разными формами с кодом `200`: обычным
 * результатом или концом игры. Различаем гардами, а не истинностью полей.
 */
export type MaybeGameOver<T> = T | GameOver

/**
 * Три формы с одним кодом `200`: два удара, победа в бою и конец игры.
 * Массив всегда означает «бой продолжается», объект — уже исход.
 */
export type AttackResult = BattleLog[] | BattleWin | GameOver

/** Основной снимок состояния. Дешёвый: сервер держит его в Redis. */
export async function fetchState(): Promise<GameInfo> {
  return await api<GameInfo>('/state')
}

/**
 * Карта подземелья. Доступна только пока в инвентаре есть предмет «КАРТА»,
 * иначе `403 NO_MAP_ERROR` — это нормальный отказ, а не поломка.
 */
export async function fetchMap(): Promise<MapRoom[]> {
  return await api<MapRoom[]>('/state/map')
}

/**
 * Обыск комнаты — это POST, а не GET: он меняет флаг «обыскано».
 * Пустая комната возвращает `[]`, а не `404`.
 */
export async function searchRoom(): Promise<InventoryItem[]> {
  return await api<InventoryItem[]>('/state/rooms/current/items', { method: 'POST' })
}

export async function takeRoomItem(itemId: number): Promise<GameInfo> {
  return await api<GameInfo>(`/state/rooms/current/items/${itemId}/take`, { method: 'POST' })
}

/** `404 NOTHING_FOUND`, если брать нечего. */
export async function takeAllRoomItems(): Promise<GameInfo> {
  return await api<GameInfo>('/state/rooms/current/items/takeall', { method: 'POST' })
}

/** Только в магазине и только после обыска: иначе `403 NOT_IN_SHOP` / `ROOM_NOT_SEARCHED`. */
export async function buyRoomItem(itemId: number): Promise<GameInfo> {
  return await api<GameInfo>(`/state/rooms/current/items/${itemId}/buy`, { method: 'POST' })
}

/** Обыск для продажи не нужен, но комната должна быть магазином. */
export async function sellItem(itemId: number): Promise<GameInfo> {
  return await api<GameInfo>(`/state/inventory/${itemId}/sell`, { method: 'POST' })
}

/** Лечение может убить, поэтому кроме `GameInfo` возможен конец игры. */
export async function useItem(itemId: number): Promise<MaybeGameOver<GameInfo>> {
  return await api<MaybeGameOver<GameInfo>>(`/state/inventory/${itemId}/use`, { method: 'POST' })
}

/** В ответе только экипировка: инвентарь изменился, но его там нет — нужен перечитыв. */
export async function equipItem(itemId: number): Promise<InventoryItem[]> {
  return await api<InventoryItem[]>(`/state/inventory/${itemId}/equip`, { method: 'POST' })
}

export async function unequipItem(slot: EquipmentSlot): Promise<InventoryItem[]> {
  return await api<InventoryItem[]>(`/state/equipment/${slot}`, { method: 'DELETE' })
}

/**
 * Переход вперёд: открывает комнату и, если в ней враг, начинает бой.
 * Вход в комнату-выход завершает партию и возвращает конец игры.
 */
export async function goNextRoom(): Promise<MaybeGameOver<Room>> {
  return await api<MaybeGameOver<Room>>('/state/rooms', { method: 'POST' })
}

/**
 * Переход в уже открытую комнату. Бой не начинает и открытость не меняет,
 * а на неоткрытую отвечает `403 UNDISCOVERED_ROOM_ERROR`.
 */
export async function goToRoom(roomId: number): Promise<MaybeGameOver<Room>> {
  return await api<MaybeGameOver<Room>>('/state/rooms/current', {
    method: 'PUT',
    body: { id: roomId },
  })
}

/**
 * Удар по врагу.
 *
 * В ответе нет состояния вообще: ни `GameInfo`, ни прочности экипировки.
 * `BattleLog[]` — ровно два элемента, `[0]` бьёт игрок, `[1]` отвечает враг.
 * `BattleWin` содержит только текст и **один** лог, без `gameInfo`.
 */
export async function attackEnemy(): Promise<AttackResult> {
  return await api<AttackResult>('/state/rooms/current/enemy/attack', { method: 'POST' })
}
