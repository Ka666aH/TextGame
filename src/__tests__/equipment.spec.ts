import { describe, expect, it } from 'vitest'

import { ITEM_NAMES } from '../api/labels'
import type { GameInfo, InventoryItem } from '../api/types'
import { brokenEquipment } from '../lib/equipment'

function item(overrides: Partial<InventoryItem> & { name: string }): InventoryItem {
  return { id: 1, description: 'описание', ...overrides }
}

const fists: InventoryItem = { name: ITEM_NAMES.fists, description: 'кулаки', damage: 3 }
const sword = item({ name: ITEM_NAMES.ironSword, damage: 6, durability: 4 })
const otherSword = item({ id: 2, name: ITEM_NAMES.rustSword, damage: 2, durability: 8 })
const helm = item({ id: 3, name: ITEM_NAMES.ironHelm, damageBlock: 3, durability: 5 })
const vest = item({ id: 4, name: ITEM_NAMES.leatherVest, damageBlock: 2, durability: 9 })

function state(overrides: Partial<GameInfo> = {}): GameInfo {
  return {
    room: {
      number: 2,
      name: 'МАЛЕНЬКАЯ КОМНАТА',
      description: 'Тесная комната без окон.',
      isSearched: false,
      kind: 'small',
    },
    weapon: fists,
    helm: null,
    chestplate: null,
    maxHealth: 100,
    currentHealth: 80,
    coins: 10,
    keys: 1,
    inventory: [],
    ...overrides,
  }
}

describe('brokenEquipment', () => {
  it('замечает сломанное оружие: место занимают кулаки', () => {
    expect(brokenEquipment(state({ weapon: sword }), state({ weapon: fists }))).toEqual([
      ITEM_NAMES.ironSword,
    ])
  })

  it('не считает поломкой смену оружия на другое', () => {
    expect(brokenEquipment(state({ weapon: sword }), state({ weapon: otherSword }))).toEqual([])
  })

  it('замечает сломанный шлем и нагрудник', () => {
    const before = state({ weapon: sword, helm, chestplate: vest })
    const after = state({ weapon: sword })

    expect(brokenEquipment(before, after)).toEqual([ITEM_NAMES.ironHelm, ITEM_NAMES.leatherVest])
  })

  it('надетый шлем поломкой не считается', () => {
    expect(brokenEquipment(state({ helm: null }), state({ helm }))).toEqual([])
  })

  it('кулаки вместо кулаков — не поломка', () => {
    expect(brokenEquipment(state(), state())).toEqual([])
  })
})
