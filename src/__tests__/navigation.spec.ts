import { describe, expect, it } from 'vitest'

import { canGoBack } from '../lib/navigation'

describe('canGoBack', () => {
  it('запрещает возврат из стартовой комнаты: предыдущей нет', () => {
    expect(canGoBack(0)).toBe(false)
  })

  it('разрешает возврат из первой комнаты в стартовую: она открыта по умолчанию', () => {
    expect(canGoBack(1)).toBe(true)
  })

  it('разрешает возврат из любой комнаты дальше', () => {
    expect(canGoBack(2)).toBe(true)
    expect(canGoBack(12)).toBe(true)
  })
})
