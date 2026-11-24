import { describe, expect, it } from 'vitest'

import {
  isBattleLog,
  isBattleLogArray,
  isBattleWin,
  isCount,
  isGameInfo,
  isGameOver,
  isInventoryItemArray,
  isMapRoomArray,
  isRecord,
  isRoom,
} from '../api/guards'

const gameInfo = {
  room: { number: 0, name: 'СТАРТОВАЯ КОМНАТА', description: 'В потолке дыра.' },
  weapon: { name: 'КУЛАКИ', description: 'Базовое оружие.', damage: 3 },
  helm: null,
  chestplate: null,
  maxHealth: 100,
  currentHealth: 100,
  coins: 0,
  keys: 0,
  inventory: [],
  isGameStarted: true,
  result: null,
}

const battleLog = {
  target: 'КРЫСА',
  damageToTarget: 5,
  targetHealthBeforeAttack: 10,
  targetHealthAfterAttack: 5,
  attacker: 'ИГРОК',
  damageToAttacker: 2,
  healthBeforeAttack: 100,
  healthAfterAttack: 98,
}

const gameOver = { message: 'Вы нашли выход и выбрались наружу.', gameInfo }
/** Форма 1.1.0: победы в бою ещё без состояния. */
const battleWin = { message: 'КРЫСА повержен.', battleLog }
/** Форма 1.2.0: у победы в бою есть и `gameInfo`, поэтому гарды легко спутать. */
const battleWinWithInfo = { message: 'КРЫСА повержен.', battleLog, gameInfo }

describe('isRecord', () => {
  it('принимает обычный объект', () => {
    expect(isRecord({ a: 1 })).toBe(true)
  })

  it('отвергает массив, null и примитивы', () => {
    expect(isRecord([])).toBe(false)
    expect(isRecord(null)).toBe(false)
    expect(isRecord('строка')).toBe(false)
    expect(isRecord(42)).toBe(false)
    expect(isRecord(undefined)).toBe(false)
  })
})

describe('различение конца игры и победы в бою', () => {
  it('GameOver узнаётся по gameInfo', () => {
    expect(isGameOver(gameOver)).toBe(true)
  })

  it('GameOver не считается победой в бою', () => {
    expect(isBattleWin(gameOver)).toBe(false)
  })

  it('BattleWin узнаётся по battleLog — в обеих формах', () => {
    expect(isBattleWin(battleWin)).toBe(true)
    expect(isBattleWin(battleWinWithInfo)).toBe(true)
  })

  it('BattleWin не считается концом игры', () => {
    expect(isGameOver(battleWin)).toBe(false)
  })

  it('BattleWin с gameInfo — всё ещё не конец игры: его выдаёт battleLog', () => {
    // Без этой проверки каждая победа в бою уходит на экран исхода.
    expect(isGameOver(battleWinWithInfo)).toBe(false)
  })
})

describe('журнал боя', () => {
  it('одиночный удар узнаётся по target и attacker', () => {
    expect(isBattleLog(battleLog)).toBe(true)
  })

  it('победа в бою не считается одиночным ударом: у неё есть message', () => {
    expect(isBattleLog(battleWin)).toBe(false)
    expect(isBattleLog(battleWinWithInfo)).toBe(false)
  })

  it('конец игры не считается ударом', () => {
    expect(isBattleLog(gameOver)).toBe(false)
  })

  it('массив из двух ударов распознаётся', () => {
    expect(isBattleLogArray([battleLog, battleLog])).toBe(true)
  })

  it('объект вместо массива не считается массивом ударов', () => {
    expect(isBattleLogArray(battleWin)).toBe(false)
    expect(isBattleLogArray(battleLog)).toBe(false)
  })
})

describe('состояние и комната', () => {
  it('GameInfo узнаётся по room/weapon/maxHealth/inventory', () => {
    expect(isGameInfo(gameInfo)).toBe(true)
  })

  it('сам GameOver не является GameInfo', () => {
    expect(isGameInfo(gameOver)).toBe(false)
  })

  it('вложенный gameInfo остаётся GameInfo', () => {
    expect(isGameInfo(gameOver.gameInfo)).toBe(true)
  })

  it('комната узнаётся по number/name/description', () => {
    expect(isRoom(gameInfo.room)).toBe(true)
    expect(isRoom(gameOver)).toBe(false)
  })
})

describe('массивы и примитивы', () => {
  it('список комнат карты', () => {
    expect(isMapRoomArray([{ number: 0, name: 'СТАРТОВАЯ КОМНАТА', isDiscovered: true }])).toBe(
      true,
    )
    expect(isMapRoomArray(gameInfo)).toBe(false)
  })

  it('список предметов', () => {
    expect(isInventoryItemArray([{ name: 'КЛЮЧ', description: '' }])).toBe(true)
    expect(isInventoryItemArray([])).toBe(true)
    expect(isInventoryItemArray({})).toBe(false)
  })

  it('голое число для coins и keys', () => {
    expect(isCount(0)).toBe(true)
    expect(isCount(42)).toBe(true)
    expect(isCount(Number.NaN)).toBe(false)
    expect(isCount('42')).toBe(false)
  })
})
