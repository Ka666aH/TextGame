import { describe, expect, it } from 'vitest'

import { buildQuery } from '../api/http'

describe('buildQuery', () => {
  it('без параметров не добавляет ничего', () => {
    expect(buildQuery()).toBe('')
    expect(buildQuery({})).toBe('')
  })

  it('пропускает undefined и null', () => {
    expect(buildQuery({ sessionName: undefined, seed: null })).toBe('')
  })

  it('пропускает пустую строку: бэкенд сохранил бы её вместо дефолта', () => {
    expect(buildQuery({ sessionName: '' })).toBe('')
    expect(buildQuery({ sessionName: '   ' })).toBe('')
  })

  it('оставляет нули: это допустимое значение', () => {
    expect(buildQuery({ seed: 0 })).toBe('?seed=0')
    expect(buildQuery({ seed: '0' })).toBe('?seed=0')
  })

  it('собирает несколько параметров', () => {
    const query = buildQuery({ sessionName: 'Игра', seed: '123456789012345678' })
    expect(query).toContain('sessionName=')
    expect(query).toContain('seed=123456789012345678')
    expect(query.startsWith('?')).toBe(true)
  })

  it('кодирует значение, не ломая длинные seed', () => {
    expect(buildQuery({ seed: '9223372036854775807' })).toBe('?seed=9223372036854775807')
  })

  it('не теряет параметр, если рядом пустой', () => {
    expect(buildQuery({ sessionName: '', seed: '7' })).toBe('?seed=7')
  })
})
