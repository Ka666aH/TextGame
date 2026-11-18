import { ROOM_NAMES } from '../api/labels'

/**
 * Есть ли в комнате что искать.
 *
 * Стартовая и пустая комнаты не наполняются никогда: генератор даёт предметы
 * только малым, большим комнатам и магазину (`RoomContentGenerator`).
 * Врага в пустой комнате встретить можно, предметов — нет, поэтому обыск там
 * бессмысленен и кнопку мы не показываем.
 */
export function canSearchRoom(roomName: string): boolean {
  return roomName !== ROOM_NAMES.start && roomName !== ROOM_NAMES.empty
}
