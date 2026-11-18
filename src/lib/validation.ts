import { LOGIN_MAX_LENGTH, LOGIN_MIN_LENGTH, MAX_NAME_LENGTH } from '../api/labels'

/**
 * Клиентская валидация повторяет серверную, но не заменяет её.
 * Правила взяты из `RegisterCommandValidator`: логин 3–100, пароль —
 * хотя бы одна заглавная латинская буква и хотя бы одна цифра.
 */

export interface LoginFormErrors {
  login: string | null
  password: string | null
}

export interface RegisterFormErrors extends LoginFormErrors {
  confirmation: string | null
}

export function validateLogin(value: string): string | null {
  const login = value.trim()
  if (login.length < LOGIN_MIN_LENGTH) {
    return `Логин должен быть не короче ${LOGIN_MIN_LENGTH} символов.`
  }
  if (login.length > LOGIN_MAX_LENGTH) {
    return `Логин должен быть не длиннее ${LOGIN_MAX_LENGTH} символов.`
  }
  return null
}

export function validatePassword(value: string): string | null {
  if (!/[A-Z]/.test(value)) {
    return 'Нужна хотя бы одна заглавная латинская буква.'
  }
  if (!/[0-9]/.test(value)) {
    return 'Нужна хотя бы одна цифра.'
  }
  return null
}

/**
 * Вход: сложность пароля здесь не проверяется.
 *
 * Правила придуманы для регистрации. На входе они дают ложный отказ: пароль
 * уже существует, и требовать от него заглавную букву с цифрой — значит
 * диктовать игроку, каким был его пароль.
 */
export function validateLoginForm(login: string, password: string): LoginFormErrors {
  return {
    login: validateLogin(login),
    password: password.length === 0 ? 'Введи пароль.' : null,
  }
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (confirmation.length === 0) return 'Повтори пароль.'
  if (confirmation !== password) return 'Пароли не совпадают.'
  return null
}

/** Регистрация: правила сервера плюс подтверждение пароля. */
export function validateRegisterForm(
  login: string,
  password: string,
  confirmation: string,
): RegisterFormErrors {
  return {
    login: validateLogin(login),
    password: validatePassword(password),
    confirmation: validatePasswordConfirmation(password, confirmation),
  }
}

/**
 * Имя сессии и сохранения сервер не валидирует: длиннее 100 символов —
 * это `500` из-за ограничения в БД, а не `400`. Поэтому режем здесь.
 */
export function validateOptionalName(value: string): string | null {
  if (value.trim().length > MAX_NAME_LENGTH) {
    return `Название должно быть не длиннее ${MAX_NAME_LENGTH} символов.`
  }
  return null
}

/**
 * Seed уходит на сервер строкой как есть: это 64-битное число, и `Number()`
 * потерял бы точность выше 2^53. Проверяем только форму записи — диапазон
 * `long` пусть проверяет сервер.
 */
export function validateSeed(value: string): string | null {
  const seed = value.trim()
  if (seed.length === 0) return null
  if (!/^-?\d+$/.test(seed)) {
    return 'Seed должен состоять только из цифр (минус — в начале).'
  }
  return null
}
