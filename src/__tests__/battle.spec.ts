import { beforeEach, describe, expect, it } from 'vitest'

import type { BattleLog } from '../api/types'
import { appendBattleLog, clearBattleLog, useBattleLog } from '../composables/game'
import { battleLogLine } from '../lib/battle'

function makeLog(overrides: Partial<BattleLog> = {}): BattleLog {
  return {
    target: 'КРЫСА',
    damageToTarget: 5,
    targetHealthBeforeAttack: 12,
    targetHealthAfterAttack: 7,
    attacker: 'ИГРОК',
    damageToAttacker: 0,
    healthBeforeAttack: 100,
    healthAfterAttack: 100,
    ...overrides,
  }
}

describe('battleLogLine', () => {
  it('показывает переход здоровья цели', () => {
    expect(battleLogLine(makeLog())).toBe('ИГРОК → КРЫСА: 5 (12 → 7)')
  })

  it('опускает переход, когда здоровья у цели нет: удар по сундуку', () => {
    const line = battleLogLine(
      makeLog({ target: 'СУНДУК', targetHealthBeforeAttack: null, targetHealthAfterAttack: null }),
    )
    expect(line).toBe('ИГРОК → СУНДУК: 5')
  })

  it('добавляет ответный урон, если он есть', () => {
    expect(battleLogLine(makeLog({ damageToAttacker: 2 }))).toContain('в ответ 2')
  })
})

describe('журнал боя', () => {
  const { battleLog } = useBattleLog()

  beforeEach(() => {
    clearBattleLog()
  })

  it('накапливает удары в порядке прихода', () => {
    appendBattleLog([makeLog(), makeLog({ target: 'ВТОРОЙ' })])
    expect(battleLog.value.map((log) => log.target)).toEqual(['КРЫСА', 'ВТОРОЙ'])
  })

  it('хранит не больше двадцати последних ударов', () => {
    for (let index = 0; index < 21; index += 1) {
      appendBattleLog([makeLog({ attacker: `удар-${index}` })])
    }

    expect(battleLog.value).toHaveLength(20)
    expect(battleLog.value[0]?.attacker).toBe('удар-1')
    expect(battleLog.value[19]?.attacker).toBe('удар-20')
  })

  it('очищается при смене комнаты', () => {
    appendBattleLog([makeLog()])
    clearBattleLog()
    expect(battleLog.value).toHaveLength(0)
  })
})
