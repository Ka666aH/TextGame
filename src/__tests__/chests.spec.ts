import { describe, expect, it } from 'vitest'

import type { BattleLog } from '../api/types'
import { isPlainChestHit } from '../lib/chests'

function makeLog(overrides: Partial<BattleLog> = {}): BattleLog {
  return {
    target: 'СУНДУК',
    damageToTarget: 4,
    targetHealthBeforeAttack: null,
    targetHealthAfterAttack: null,
    attacker: 'ИГРОК',
    damageToAttacker: 0,
    healthBeforeAttack: 10,
    healthAfterAttack: 10,
    ...overrides,
  }
}

describe('isPlainChestHit', () => {
  it('считает обычным сундуком удар без здоровья цели', () => {
    expect(isPlainChestHit(makeLog())).toBe(true)
  })

  it('не считает обычным сундуком удар по мимику: у него здоровье есть', () => {
    const log = makeLog({
      target: 'МИМИК',
      targetHealthBeforeAttack: 8,
      targetHealthAfterAttack: 4,
    })

    expect(isPlainChestHit(log)).toBe(false)
  })

  it('не полагается на имя цели', () => {
    // Имя не должно влиять на решение: сундук переименуют — удар останется ударом.
    expect(isPlainChestHit(makeLog({ target: 'МИМИК' }))).toBe(true)
  })
})
