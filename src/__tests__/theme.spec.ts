import { beforeEach, describe, expect, it } from 'vitest'

import { applyTheme, readTheme, toggleTheme, useTheme } from '../lib/theme'

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('light', 'dark')
})

describe('readTheme', () => {
  it('без сохранённого выбора включает тёмную тему', () => {
    expect(readTheme()).toBe('dark')
  })

  it('возвращает светлую, если она была выбрана', () => {
    window.localStorage.setItem('textgame.theme', 'light')
    expect(readTheme()).toBe('light')
  })

  it('не доверяет мусору в хранилище', () => {
    window.localStorage.setItem('textgame.theme', 'инопланетная')
    expect(readTheme()).toBe('dark')
  })
})

describe('applyTheme', () => {
  it('ставит класс на html и запоминает выбор', () => {
    applyTheme('light')

    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem('textgame.theme')).toBe('light')
  })

  it('переключает тему в обе стороны', () => {
    applyTheme('dark')
    toggleTheme()
    expect(useTheme().theme.value).toBe('light')

    toggleTheme()
    expect(useTheme().theme.value).toBe('dark')
  })
})
