import { describe, expect, it } from 'vitest'

import { ROOM_KINDS } from '../api/labels'
import { canSearchRoom } from '../lib/rooms'

describe('canSearchRoom', () => {
  it('в стартовой комнате искать нечего', () => {
    expect(canSearchRoom(ROOM_KINDS.start)).toBe(false)
  })

  it('в пустой комнате искать нечего', () => {
    expect(canSearchRoom(ROOM_KINDS.empty)).toBe(false)
  })

  it('в остальных комнатах предметы бывают', () => {
    expect(canSearchRoom(ROOM_KINDS.small)).toBe(true)
    expect(canSearchRoom(ROOM_KINDS.big)).toBe(true)
    expect(canSearchRoom(ROOM_KINDS.shop)).toBe(true)
  })

  it('комнату «ВЫХОД» считает обыскиваемой: правила про неё нет', () => {
    // Партия там заканчивается, поэтому решение не влияет на игру,
    // но лишняя догадка в коде не нужна.
    expect(canSearchRoom(ROOM_KINDS.exit)).toBe(true)
  })

  it('незнакомый вид комнаты обыскивает: спрятать лут хуже, чем лишний запрос', () => {
    expect(canSearchRoom(ROOM_KINDS.unknown)).toBe(true)
  })
})
