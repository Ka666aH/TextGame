import { describe, expect, it } from 'vitest'

import { canGoBack } from '../lib/navigation'

describe('canGoBack', () => {
  it('запрещает возврат из стартовой комнаты: предыдущей нет', () => {
    expect(canGoBack(0)).toBe(false)
  })

  it('запрещает возврат в стартовую комнату: сервер не считает её открытой', () => {
    expect(canGoBack(1)).toBe(false)
  })

  it('разрешает возврат из любой комнаты после второй', () => {
    expect(canGoBack(2)).toBe(true)
    expect(canGoBack(12)).toBe(true)
  })
})
