import { describe, expect, it } from 'vitest'

import { ROOM_NAMES } from '../api/labels'
import { canSearchRoom } from '../lib/rooms'

describe('canSearchRoom', () => {
  it('в стартовой комнате искать нечего', () => {
    expect(canSearchRoom(ROOM_NAMES.start)).toBe(false)
  })

  it('в пустой комнате искать нечего', () => {
    expect(canSearchRoom(ROOM_NAMES.empty)).toBe(false)
  })

  it('в остальных комнатах предметы бывают', () => {
    expect(canSearchRoom(ROOM_NAMES.small)).toBe(true)
    expect(canSearchRoom(ROOM_NAMES.big)).toBe(true)
    expect(canSearchRoom(ROOM_NAMES.shop)).toBe(true)
  })

  it('комнату «ВЫХОД» считает обыскиваемой: правила про неё нет', () => {
    // Партия там заканчивается, поэтому решение не влияет на игру,
    // но лишняя догадка в коде не нужна.
    expect(canSearchRoom(ROOM_NAMES.exit)).toBe(true)
  })
})
