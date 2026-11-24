import { describe, expect, it } from 'vitest'

import { ROOM_KINDS, ROOM_NAMES } from '../api/labels'
import { isGameFinished, isInBattle, outcomeOf, resolveOutcome } from '../api/outcome'
import type { GameInfo, GameResult, Room } from '../api/types'

interface InfoOptions {
  currentHealth?: number
  isGameStarted?: boolean
  result?: GameResult | null
}

function makeInfo(room: Room, options: InfoOptions = {}): GameInfo {
  return {
    room,
    weapon: { name: 'КУЛАКИ', description: '', damage: 3 },
    helm: null,
    chestplate: null,
    maxHealth: 100,
    currentHealth: options.currentHealth ?? 50,
    coins: 0,
    keys: 0,
    inventory: [],
    isGameStarted: options.isGameStarted ?? true,
    result: options.result ?? null,
  }
}

/**
 * Ответ без полей 1.2.0: так выглядит кэш прошлой версии и старые фикстуры.
 * `as GameInfo` здесь честнее, чем выдумывать значения, которых сервер не присылал.
 */
function legacyInfo(room: Room, currentHealth: number): GameInfo {
  const { isGameStarted, result, ...rest } = makeInfo(room, { currentHealth })
  void isGameStarted
  void result
  return rest as GameInfo
}

const normalRoom: Room = {
  number: 3,
  name: ROOM_NAMES.small,
  description: 'Тесная комната.',
  isSearched: false,
  kind: ROOM_KINDS.small,
}

const exitRoom: Room = {
  number: 9,
  name: ROOM_NAMES.exit,
  description: 'Выход наружу.',
  isSearched: false,
  kind: ROOM_KINDS.exit,
}

const battleRoom: Room = {
  number: 4,
  name: ROOM_NAMES.big,
  description: 'Просторная комната.',
  isSearched: true,
  kind: ROOM_KINDS.big,
  enemy: { id: 1, name: 'КРЫСА', description: '', health: 10, damage: 2, damageBlock: 0 },
}

describe('outcomeOf по ответу сервера', () => {
  it('result «win» — победа, даже если комната обычная', () => {
    expect(outcomeOf(makeInfo(normalRoom, { result: 'win' }))).toBe('won')
  })

  it('result «lose» — поражение при целом здоровье: так умирают от мимика', () => {
    expect(outcomeOf(makeInfo(normalRoom, { result: 'lose', currentHealth: 100 }))).toBe('lost')
  })

  it('result «null» у идущей партии', () => {
    expect(outcomeOf(makeInfo(normalRoom, { result: null }))).toBe('playing')
  })
})

describe('outcomeOf по флагу «игра идёт»', () => {
  it('флаг снят без result — партия окончена, исход по комнате', () => {
    expect(outcomeOf(makeInfo(normalRoom, { isGameStarted: false }))).toBe('lost')
    expect(outcomeOf(makeInfo(exitRoom, { isGameStarted: false }))).toBe('won')
  })

  it('result важнее флага', () => {
    expect(outcomeOf(makeInfo(normalRoom, { isGameStarted: false, result: 'win' }))).toBe('won')
  })
})

describe('outcomeOf без полей 1.2.0: эвристика', () => {
  it('партия идёт, пока игрок жив и не на выходе', () => {
    expect(outcomeOf(legacyInfo(normalRoom, 50))).toBe('playing')
  })

  it('нулевое здоровье — поражение', () => {
    expect(outcomeOf(legacyInfo(normalRoom, 0))).toBe('lost')
  })

  it('отрицательное здоровье тоже поражение: сервер его не ограничивает', () => {
    expect(outcomeOf(legacyInfo(normalRoom, -5))).toBe('lost')
  })

  it('комната «ВЫХОД» — победа, и она важнее здоровья', () => {
    expect(outcomeOf(legacyInfo(exitRoom, 50))).toBe('won')
    expect(outcomeOf(legacyInfo(exitRoom, 0))).toBe('won')
  })
})

describe('isGameFinished', () => {
  it('различает игру и исход', () => {
    expect(isGameFinished(makeInfo(normalRoom))).toBe(false)
    expect(isGameFinished(makeInfo(normalRoom, { currentHealth: 0 }))).toBe(true)
    expect(isGameFinished(makeInfo(exitRoom))).toBe(true)
    expect(isGameFinished(makeInfo(normalRoom, { result: 'lose' }))).toBe(true)
  })
})

describe('resolveOutcome', () => {
  it('без ответа сервера повторяет эвристику', () => {
    expect(resolveOutcome(makeInfo(normalRoom), false)).toBe('playing')
    expect(resolveOutcome(makeInfo(normalRoom, { currentHealth: 0 }), false)).toBe('lost')
  })

  it('съедение мимиком в старом ответе: исход в ответе превращает «играем» в поражение', () => {
    // Ни result, ни флага в теле нет, но `200 GameOver` уже пришёл.
    expect(resolveOutcome(legacyInfo(normalRoom, 50), true)).toBe('lost')
  })

  it('победа остаётся победой и при известном исходе', () => {
    expect(resolveOutcome(makeInfo(exitRoom), true)).toBe('won')
  })

  it('result в ответе сильнее подсказки «был GameOver»', () => {
    expect(resolveOutcome(makeInfo(normalRoom, { result: 'win' }), true)).toBe('won')
  })
})

describe('isInBattle', () => {
  it('враг в комнате означает бой', () => {
    expect(isInBattle(makeInfo(battleRoom))).toBe(true)
  })

  it('без врага боя нет', () => {
    expect(isInBattle(makeInfo(normalRoom))).toBe(false)
  })
})
