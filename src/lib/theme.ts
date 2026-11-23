import { ref } from 'vue'

/**
 * Тема оформления: тёмная по умолчанию, светлая — по выбору игрока.
 *
 * Значения цветов живут в CSS (`assets/styles/main.css`), здесь только класс
 * на `<html>` и сохранение выбора. Токены — не токены доступа, поэтому
 * `localStorage` тут разрешён: паролей и кук в нём нет.
 */

export type ThemeName = 'light' | 'dark'

const STORAGE_KEY = 'textgame.theme'

const theme = ref<ThemeName>('dark')

function remember(value: ThemeName): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Приватный режим: выбор не сохранится, но тема переключится.
  }
}

/** Сохранённый выбор или тёмная тема. */
export function readTheme(): ThemeName {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/**
 * Ставит тему и класс на `<html>`.
 *
 * Класс `light` включает блок переопределений токенов, `dark` остаётся
 * номинальным — на случай, если позже понадобятся `dark:`-варианты.
 */
export function applyTheme(next: ThemeName): void {
  theme.value = next

  const root = document.documentElement
  root.classList.toggle('light', next === 'light')
  root.classList.toggle('dark', next === 'dark')

  remember(next)
}

export function toggleTheme(): void {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

/** Вызывается один раз до монтирования приложения. */
export function initTheme(): void {
  const stored = readTheme()
  theme.value = stored
  document.documentElement.classList.toggle('light', stored === 'light')
  document.documentElement.classList.toggle('dark', stored === 'dark')
}

export function useTheme() {
  return { theme, toggleTheme }
}
