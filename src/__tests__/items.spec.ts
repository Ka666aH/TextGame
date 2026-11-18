import { describe, expect, it } from 'vitest'

import {
  armorSlot,
  canEquip,
  canSell,
  canUse,
  classifyItem,
  itemId,
  plainRole,
  structuralKind,
  type ItemKind,
} from '../api/items'
import { ITEM_NAMES } from '../api/labels'
import type { InventoryItem } from '../api/types'

function makeItem(overrides: Partial<InventoryItem> & { name: string }): InventoryItem {
  return { description: 'описание', ...overrides }
}

interface CatalogEntry {
  name: string
  item: InventoryItem
  kind: ItemKind
}

/**
 * Все 21 имя предмета из `ItemsLabels.cs`. Если сервер переименует предмет,
 * этот тест обязан упасть первым — иначе предмет молча станет «неизвестным».
 */
const catalog: CatalogEntry[] = [
  {
    name: ITEM_NAMES.chest,
    item: makeItem({ id: 1, name: ITEM_NAMES.chest, isClosed: true }),
    kind: 'chest',
  },
  {
    name: ITEM_NAMES.deadMimic,
    item: makeItem({ id: 2, name: ITEM_NAMES.deadMimic, isClosed: false }),
    kind: 'chest',
  },
  { name: ITEM_NAMES.key, item: makeItem({ id: 3, name: ITEM_NAMES.key, cost: 5 }), kind: 'plain' },
  { name: ITEM_NAMES.map, item: makeItem({ id: 4, name: ITEM_NAMES.map, cost: 5 }), kind: 'plain' },
  {
    name: ITEM_NAMES.coins,
    item: makeItem({ id: 5, name: ITEM_NAMES.coins, cost: 5 }),
    kind: 'plain',
  },
  {
    name: ITEM_NAMES.unknownPotion,
    item: makeItem({ id: 6, name: ITEM_NAMES.unknownPotion, cost: 5 }),
    kind: 'plain',
  },
  {
    name: ITEM_NAMES.bandage,
    item: makeItem({ id: 7, name: ITEM_NAMES.bandage, cost: 5, maxHealthBoost: 5, currentHealthBoost: 5 }),
    kind: 'heal',
  },
  {
    name: ITEM_NAMES.powerPotion,
    item: makeItem({ id: 8, name: ITEM_NAMES.powerPotion, cost: 5, maxHealthBoost: 10, currentHealthBoost: 3 }),
    kind: 'heal',
  },
  {
    name: ITEM_NAMES.regenPotion,
    item: makeItem({ id: 9, name: ITEM_NAMES.regenPotion, cost: 5, maxHealthBoost: 0, currentHealthBoost: 8 }),
    kind: 'heal',
  },
  {
    name: ITEM_NAMES.fists,
    item: makeItem({ name: ITEM_NAMES.fists, damage: 3 }),
    kind: 'fists',
  },
  {
    name: ITEM_NAMES.magicWand,
    item: makeItem({ id: 10, name: ITEM_NAMES.magicWand, cost: 20, damage: 7 }),
    kind: 'wand',
  },
  {
    name: ITEM_NAMES.randomWand,
    item: makeItem({ id: 11, name: ITEM_NAMES.randomWand, cost: 20, damage: 9 }),
    kind: 'wand',
  },
  {
    name: ITEM_NAMES.rustSword,
    item: makeItem({ id: 12, name: ITEM_NAMES.rustSword, cost: 5, durability: 4, damage: 4 }),
    kind: 'weapon',
  },
  {
    name: ITEM_NAMES.ironSword,
    item: makeItem({ id: 13, name: ITEM_NAMES.ironSword, cost: 15, durability: 10, damage: 7 }),
    kind: 'weapon',
  },
  {
    name: ITEM_NAMES.silverSword,
    item: makeItem({ id: 14, name: ITEM_NAMES.silverSword, cost: 30, durability: 6, damage: 9 }),
    kind: 'weapon',
  },
  {
    name: ITEM_NAMES.glassSword,
    item: makeItem({ id: 15, name: ITEM_NAMES.glassSword, cost: 40, durability: 1, damage: 14 }),
    kind: 'weapon',
  },
  {
    name: ITEM_NAMES.woodenBucket,
    item: makeItem({ id: 16, name: ITEM_NAMES.woodenBucket, cost: 3, durability: 3, damageBlock: 1 }),
    kind: 'armor',
  },
  {
    name: ITEM_NAMES.leatherHelm,
    item: makeItem({ id: 17, name: ITEM_NAMES.leatherHelm, cost: 10, durability: 6, damageBlock: 2 }),
    kind: 'armor',
  },
  {
    name: ITEM_NAMES.ironHelm,
    item: makeItem({ id: 18, name: ITEM_NAMES.ironHelm, cost: 25, durability: 10, damageBlock: 4 }),
    kind: 'armor',
  },
  {
    name: ITEM_NAMES.leatherVest,
    item: makeItem({ id: 19, name: ITEM_NAMES.leatherVest, cost: 15, durability: 8, damageBlock: 3 }),
    kind: 'armor',
  },
  {
    name: ITEM_NAMES.ironCuirass,
    item: makeItem({ id: 20, name: ITEM_NAMES.ironCuirass, cost: 35, durability: 12, damageBlock: 6 }),
    kind: 'armor',
  },
]

function entry(name: string): InventoryItem {
  const found = catalog.find((candidate) => candidate.name === name)
  if (!found) throw new Error(`Нет предмета «${name}» в каталоге`)
  return found.item
}

describe('каталог предметов', () => {
  it('содержит все 21 имя', () => {
    expect(catalog).toHaveLength(21)
  })

  it('определяет структурный вид каждого предмета', () => {
    // Сравниваем карты целиком: дифф `toEqual` сам назовёт расхождения,
    // а второй аргумент у `expect` не проходит правило vitest/valid-expect.
    const actual: Record<string, ItemKind> = {}
    const expected: Record<string, ItemKind> = {}
    for (const candidate of catalog) {
      actual[candidate.name] = structuralKind(candidate.item)
      expected[candidate.name] = candidate.kind
    }
    expect(actual).toEqual(expected)
  })
})

describe('structuralKind', () => {
  it('считает сундуком и открытый сундук: проверяется ключ, не значение', () => {
    const opened = makeItem({ id: 1, name: ITEM_NAMES.chest, isClosed: false })
    expect(structuralKind(opened)).toBe('chest')
    expect(canUse(opened)).toBe(false)
    expect(canEquip(opened)).toBe(false)
  })

  it('отличает меч от жезла по наличию ключа durability', () => {
    expect(structuralKind(entry(ITEM_NAMES.ironSword))).toBe('weapon')
    expect(structuralKind(entry(ITEM_NAMES.magicWand))).toBe('wand')
  })

  it('отличает кулаки от меча по отсутствию id', () => {
    expect(structuralKind(entry(ITEM_NAMES.fists))).toBe('fists')
    expect(itemId(entry(ITEM_NAMES.fists))).toBeNull()
  })
})

describe('слот брони и роль простого предмета', () => {
  it('определяет шлемы по имени', () => {
    expect(armorSlot(entry(ITEM_NAMES.woodenBucket))).toBe('helm')
    expect(armorSlot(entry(ITEM_NAMES.leatherHelm))).toBe('helm')
    expect(armorSlot(entry(ITEM_NAMES.ironHelm))).toBe('helm')
  })

  it('определяет нагрудники по имени', () => {
    expect(armorSlot(entry(ITEM_NAMES.leatherVest))).toBe('chestplate')
    expect(armorSlot(entry(ITEM_NAMES.ironCuirass))).toBe('chestplate')
  })

  it('определяет роль простых предметов по имени', () => {
    expect(plainRole(entry(ITEM_NAMES.key))).toBe('key')
    expect(plainRole(entry(ITEM_NAMES.map))).toBe('map')
    expect(plainRole(entry(ITEM_NAMES.coins))).toBe('coins')
    expect(plainRole(entry(ITEM_NAMES.unknownPotion))).toBe('potion')
  })

  it('не приписывает роль предметам с полями', () => {
    expect(plainRole(entry(ITEM_NAMES.ironSword))).toBeNull()
    expect(plainRole(entry(ITEM_NAMES.bandage))).toBeNull()
  })
})

describe('действия с предметами', () => {
  it('разрешает использовать оба вида лечения', () => {
    expect(canUse(entry(ITEM_NAMES.bandage))).toBe(true)
    expect(canUse(entry(ITEM_NAMES.regenPotion))).toBe(true)
  })

  it('разрешает использовать «НЕИЗВЕСТНОЕ ЗЕЛЬЕ», хотя полей лечения у него нет', () => {
    const potion = entry(ITEM_NAMES.unknownPotion)
    expect(structuralKind(potion)).toBe('plain')
    expect(canUse(potion)).toBe(true)
    expect(canEquip(potion)).toBe(false)
  })

  it('не разрешает использовать ключ, карту и монеты', () => {
    expect(canUse(entry(ITEM_NAMES.key))).toBe(false)
    expect(canUse(entry(ITEM_NAMES.map))).toBe(false)
    expect(canUse(entry(ITEM_NAMES.coins))).toBe(false)
  })

  it('разрешает надеть оружие и броню, но не кулаки', () => {
    expect(canEquip(entry(ITEM_NAMES.ironSword))).toBe(true)
    expect(canEquip(entry(ITEM_NAMES.magicWand))).toBe(true)
    expect(canEquip(entry(ITEM_NAMES.ironHelm))).toBe(true)
    expect(canEquip(entry(ITEM_NAMES.fists))).toBe(false)
  })

  it('не разрешает продать предмет без цены', () => {
    expect(canSell(entry(ITEM_NAMES.chest))).toBe(false)
    expect(canSell(entry(ITEM_NAMES.key))).toBe(true)
  })
})

describe('незнакомый предмет', () => {
  it('считается простым и не ломает разбор', () => {
    const mystery = makeItem({ id: 99, name: 'ПОДОЗРИТЕЛЬНЫЙ АРТЕФАКТ', cost: 1 })
    expect(structuralKind(mystery)).toBe('plain')
    expect(plainRole(mystery)).toBeNull()
    expect(canUse(mystery)).toBe(false)
    expect(canEquip(mystery)).toBe(false)
    expect(canSell(mystery)).toBe(true)
  })
})

describe('classifyItem', () => {
  it('собирает вид, слот, доступные действия и id', () => {
    const view = classifyItem(entry(ITEM_NAMES.ironHelm))
    expect(view.kind).toBe('armor')
    expect(view.armorSlot).toBe('helm')
    expect(view.plainRole).toBeNull()
    expect(view.canEquip).toBe(true)
    expect(view.canUse).toBe(false)
    expect(view.canSell).toBe(true)
    expect(view.id).toBe(18)
  })
})
