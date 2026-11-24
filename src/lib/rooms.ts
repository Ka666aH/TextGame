import { ROOM_KINDS } from '../api/labels'
import type { RoomKind } from '../api/types'

/**
 * Есть ли в комнате что искать.
 *
 * Стартовая и пустая комнаты не наполняются никогда: генератор даёт предметы
 * только малым, большим комнатам и магазину (`RoomContentGenerator`).
 * Врага в пустой комнате встретить можно, предметов — нет, поэтому обыск там
 * бессмысленен и кнопку мы не показываем.
 *
 * С 1.2.0 вид комнаты приходит полем `kind`, а не выводится из названия.
 * `unknown` считаем обыскиваемой: лишний POST безвреден, а спрятать лут хуже.
 */
export function canSearchRoom(kind: RoomKind): boolean {
  return kind !== ROOM_KINDS.start && kind !== ROOM_KINDS.empty
}
