import { describe, expect, it } from 'vitest'

import { formatDateTime, formatSeed, newestFirst } from '../lib/format'

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

describe('formatSeed', () => {
  it('показывает число без экспоненты и разделителей', () => {
    expect(formatSeed(1234567890123)).toBe('1234567890123')
  })

  it('отбрасывает дробную часть: seed целый', () => {
    expect(formatSeed(42.9)).toBe('42')
  })

  it('не падает на нечисле', () => {
    expect(formatSeed(Number.NaN)).toBe('NaN')
  })
})

describe('newestFirst', () => {
  it('ставит свежие записи вперёд', () => {
    const sorted = newestFirst([
      { createdAt: '2026-01-01T00:00:00Z', name: 'старое' },
      { createdAt: '2026-05-01T00:00:00Z', name: 'новое' },
      { createdAt: '2026-03-01T00:00:00Z', name: 'среднее' },
    ])
    expect(sorted.map((item) => item.name)).toEqual(['новое', 'среднее', 'старое'])
  })

  it('не меняет исходный массив', () => {
    const source = [{ createdAt: '2026-01-01T00:00:00Z' }, { createdAt: '2026-02-01T00:00:00Z' }]
    newestFirst(source)
    expect(source[0]?.createdAt).toBe('2026-01-01T00:00:00Z')
  })

  it('на пустом списке возвращает пустой список', () => {
    expect(newestFirst([])).toEqual([])
  })
})
