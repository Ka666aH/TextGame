import { describe, expect, it } from 'vitest'

import {
  validateLogin,
  validateLoginForm,
  validateOptionalName,
  validatePassword,
  validatePasswordConfirmation,
  validateRegisterForm,
  validateSeed,
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
  it('на входе сложность пароля не проверяется', () => {
    // Пароль уже существует: диктовать игроку его состав нельзя.
    expect(validateLoginForm('player', 'weakpass')).toEqual({ login: null, password: null })
  })

  it('пустой пароль — ошибка', () => {
    expect(validateLoginForm('player', '').password).not.toBeNull()
  })

  it('логин проверяется как обычно', () => {
    expect(validateLoginForm('ab', 'x').login).not.toBeNull()
  })
})

describe('validatePasswordConfirmation', () => {
  it('требует повторить пароль', () => {
    expect(validatePasswordConfirmation('Pass1', '')).not.toBeNull()
  })

  it('ловит несовпадение', () => {
    expect(validatePasswordConfirmation('Pass1', 'Pass2')).not.toBeNull()
  })

  it('совпадающие пароли проходят', () => {
    expect(validatePasswordConfirmation('Pass1', 'Pass1')).toBeNull()
  })
})

describe('validateRegisterForm', () => {
  it('на регистрации требования к паролю действуют', () => {
    const errors = validateRegisterForm('player', 'weak', 'weak')
    expect(errors.password).not.toBeNull()
    expect(errors.confirmation).toBeNull()
  })

  it('несовпадение подтверждения видно сразу', () => {
    const errors = validateRegisterForm('player', 'Pass1', 'Pass2')
    expect(errors.password).toBeNull()
    expect(errors.confirmation).not.toBeNull()
  })

  it('корректная форма ошибок не даёт', () => {
    expect(validateRegisterForm('player', 'Pass1', 'Pass1')).toEqual({
      login: null,
      password: null,
      confirmation: null,
    })
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

describe('validateSeed', () => {
  it('пустой seed допустим: сервер сгенерирует сам', () => {
    expect(validateSeed('')).toBeNull()
    expect(validateSeed('   ')).toBeNull()
  })

  it('принимает обычное и отрицательное число', () => {
    expect(validateSeed('123456789012345678')).toBeNull()
    expect(validateSeed('-42')).toBeNull()
  })

  it('не пропускает буквы и дробную часть', () => {
    expect(validateSeed('12a45')).not.toBeNull()
    expect(validateSeed('1.5')).not.toBeNull()
  })

  it('не ограничивает длину: за диапазон `long` отвечает сервер', () => {
    expect(validateSeed('9223372036854775807')).toBeNull()
    expect(validateSeed('92233720368547758070')).toBeNull()
  })
})
