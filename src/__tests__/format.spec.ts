import { describe, expect, it } from 'vitest'

import { formatDateTime } from '../lib/format'

describe('formatDateTime', () => {
  it('превращает ISO-строку в читаемую дату', () => {
    const formatted = formatDateTime('2026-07-15T12:00:00Z')
    expect(formatted).toContain('2026')
    expect(formatted).not.toBe('2026-07-15T12:00:00Z')
  })

  it('возвращает исходную строку, если дату разобрать нельзя', () => {
    expect(formatDateTime('не дата')).toBe('не дата')
  })

  it('не падает на пустой строке', () => {
    expect(formatDateTime('')).toBe('')
  })
})
