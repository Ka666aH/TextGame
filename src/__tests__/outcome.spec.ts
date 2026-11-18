import { describe, expect, it } from 'vitest'

import { isGameFinished, isInBattle, outcomeOf } from '../api/outcome'
import { ROOM_NAMES } from '../api/labels'
import type { GameInfo, Room } from '../api/types'

function makeInfo(room: Room, currentHealth: number): GameInfo {
  return {
    room,
    weapon: { name: 'КУЛАКИ', description: '', damage: 3 },
    helm: null,
    chestplate: null,
    maxHealth: 100,
    currentHealth,
    coins: 0,
    keys: 0,
    inventory: [],
  }
}

const normalRoom: Room = { number: 3, name: ROOM_NAMES.small, description: 'Тесная комната.' }
const exitRoom: Room = { number: 9, name: ROOM_NAMES.exit, description: 'Выход наружу.' }
const battleRoom: Room = {
  number: 4,
  name: ROOM_NAMES.big,
  description: 'Просторная комната.',
  enemy: { id: 1, name: 'КРЫСА', description: '', health: 10, damage: 2, damageBlock: 0 },
}

describe('outcomeOf', () => {
  it('партия идёт, пока игрок жив и не на выходе', () => {
    expect(outcomeOf(makeInfo(normalRoom, 50))).toBe('playing')
  })

  it('нулевое здоровье — поражение', () => {
    expect(outcomeOf(makeInfo(normalRoom, 0))).toBe('lost')
  })

  it('отрицательное здоровье тоже поражение: сервер его не ограничивает', () => {
    expect(outcomeOf(makeInfo(normalRoom, -5))).toBe('lost')
  })

  it('комната «ВЫХОД» — победа', () => {
    expect(outcomeOf(makeInfo(exitRoom, 50))).toBe('won')
  })

  it('победа важнее здоровья: в комнате выхода партия выиграна', () => {
    expect(outcomeOf(makeInfo(exitRoom, 0))).toBe('won')
  })

  it('обычная комната не считается концом игры', () => {
    expect(isGameFinished(makeInfo(normalRoom, 50))).toBe(false)
    expect(isGameFinished(makeInfo(normalRoom, 0))).toBe(true)
    expect(isGameFinished(makeInfo(exitRoom, 50))).toBe(true)
  })
})

describe('isInBattle', () => {
  it('враг в комнате означает бой', () => {
    expect(isInBattle(makeInfo(battleRoom, 50))).toBe(true)
  })

  it('без врага боя нет', () => {
    expect(isInBattle(makeInfo(normalRoom, 50))).toBe(false)
  })
})
