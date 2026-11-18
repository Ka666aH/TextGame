import { describe, expect, it } from 'vitest'

import { monogram } from '../lib/art'

describe('monogram', () => {
  it('берёт первую букву и поднимает регистр', () => {
    expect(monogram('СУНДУК')).toBe('С')
    expect(monogram('меч')).toBe('М')
  })

  it('пропускает ведущие пробелы', () => {
    expect(monogram('  ЖЕЗЛ')).toBe('Ж')
  })

  it('возвращает вопросительный знак для пустого имени', () => {
    expect(monogram('')).toBe('?')
    expect(monogram('   ')).toBe('?')
  })

  it('не обрезает многобуквенные названия до одного символа', () => {
    expect(monogram('КРЫСА')).toHaveLength(1)
  })
})
