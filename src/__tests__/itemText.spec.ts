import { describe, expect, it } from 'vitest'

import { ITEM_NAMES } from '../api/labels'
import type { InventoryItem } from '../api/types'
import { describeStats, priceSuffix } from '../lib/itemText'

function makeItem(overrides: Partial<InventoryItem> & { name: string }): InventoryItem {
  return { description: 'описание', ...overrides }
}

describe('describeStats', () => {
  it('перечисляет боевые свойства в фиксированном порядке', () => {
    const sword = makeItem({ name: ITEM_NAMES.ironSword, damage: 6, durability: 4, cost: 12 })
    expect(describeStats(sword)).toEqual(['урон 6', 'прочность 4', 'цена 12'])
  })

  it('различает предел здоровья и лечение', () => {
    const bandage = makeItem({
      name: ITEM_NAMES.bandage,
      maxHealthBoost: 10,
      currentHealthBoost: 3,
    })
    expect(describeStats(bandage)).toEqual(['предел здоровья +10', 'здоровье +3'])
  })

  it('не показывает нулевые бонусы лечения', () => {
    const bandage = makeItem({
      name: ITEM_NAMES.bandage,
      maxHealthBoost: 0,
      currentHealthBoost: 8,
    })
    expect(describeStats(bandage)).toEqual(['здоровье +8'])
  })

  it('у предмета без чисел характеристик нет', () => {
    expect(describeStats(makeItem({ name: ITEM_NAMES.key }))).toEqual([])
  })

  it('кулаки показывают урон и не показывают цену', () => {
    expect(describeStats(makeItem({ name: ITEM_NAMES.fists, damage: 3 }))).toEqual(['урон 3'])
  })
})

describe('priceSuffix', () => {
  it('приписывает цену к кнопке', () => {
    expect(priceSuffix(makeItem({ name: ITEM_NAMES.key, cost: 5 }))).toBe(' · 5')
  })

  it('без цены не добавляет ничего', () => {
    expect(priceSuffix(makeItem({ name: ITEM_NAMES.key }))).toBe('')
  })
})
