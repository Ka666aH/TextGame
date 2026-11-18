import { describe, expect, it } from 'vitest'

import {
  validateLogin,
  validateLoginForm,
  validateOptionalName,
  validatePassword,
} from '../lib/validation'

describe('validateLogin', () => {
  it('требует минимум три символа', () => {
    expect(validateLogin('ab')).not.toBeNull()
    expect(validateLogin('abc')).toBeNull()
  })

  it('обрезает пробелы перед проверкой', () => {
    expect(validateLogin('  abc  ')).toBeNull()
    expect(validateLogin('   ')).not.toBeNull()
  })

  it('не пропускает логин длиннее ста символов', () => {
    expect(validateLogin('a'.repeat(100))).toBeNull()
    expect(validateLogin('a'.repeat(101))).not.toBeNull()
  })
})

describe('validatePassword', () => {
  it('требует заглавную латинскую букву', () => {
    expect(validatePassword('pass1')).not.toBeNull()
    expect(validatePassword('Pass1')).toBeNull()
  })

  it('требует цифру', () => {
    expect(validatePassword('Password')).not.toBeNull()
  })

  it('кириллическая заглавная не считается: сервер требует латиницу', () => {
    expect(validatePassword('Пароль1')).not.toBeNull()
  })

  it('минимальной длины не требует: сервер её тоже не проверяет', () => {
    expect(validatePassword('A1')).toBeNull()
  })
})

describe('validateLoginForm', () => {
  it('возвращает обе ошибки сразу', () => {
    const errors = validateLoginForm('ab', 'weak')
    expect(errors.login).not.toBeNull()
    expect(errors.password).not.toBeNull()
  })

  it('корректная форма ошибок не даёт', () => {
    expect(validateLoginForm('player', 'Pass1')).toEqual({ login: null, password: null })
  })
})

describe('validateOptionalName', () => {
  it('пустое имя допустимо: сервер подставит своё', () => {
    expect(validateOptionalName('')).toBeNull()
  })

  it('не пропускает имя длиннее ста символов, иначе сервер ответит 500', () => {
    expect(validateOptionalName('a'.repeat(100))).toBeNull()
    expect(validateOptionalName('a'.repeat(101))).not.toBeNull()
  })
})
