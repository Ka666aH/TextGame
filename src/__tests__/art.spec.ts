import { describe, expect, it } from 'vitest'

import { ENEMY_NAMES, ITEM_NAMES, ROOM_NAMES } from '../api/labels'
import { artFile, artSlug, monogram } from '../lib/art'

describe('monogram', () => {
  it('берёт первую букву и поднимает регистр', () => {
    expect(monogram('СУНДУК')).toBe('С')
    expect(monogram('меч')).toBe('М')
  })

  it('пропускает ведущие пробелы', () => {
    expect(monogram('  ЖЕЗЛ')).toBe('Ж')
  })

  it('возвращает вопросительный знак для пустого имени', () => {
    expect(monogram('')).toBe('?')
    expect(monogram('   ')).toBe('?')
  })

  it('не обрезает многобуквенные названия до одного символа', () => {
    expect(monogram('КРЫСА')).toHaveLength(1)
  })
})

describe('artSlug', () => {
  it('находит рисунки комнат, предметов и врагов', () => {
    expect(artSlug('room', ROOM_NAMES.exit)).toBe('rooms/end')
    expect(artSlug('room', ROOM_NAMES.shop)).toBe('rooms/shop')
    expect(artSlug('item', ITEM_NAMES.ironSword)).toBe('items/iron-sword')
    expect(artSlug('item', ITEM_NAMES.woodenBucket)).toBe('items/bucket')
    expect(artSlug('enemy', ENEMY_NAMES.skeletorArcher)).toBe('enemies/skeleton-archer')
  })

  it('мёртвый мимик и сундук делят один рисунок', () => {
    expect(artSlug('item', ITEM_NAMES.deadMimic)).toBe(artSlug('item', ITEM_NAMES.chest))
  })

  it('не знает игрока и незнакомые имена', () => {
    expect(artSlug('player', 'ИГРОК')).toBeNull()
    expect(artSlug('item', 'АРТЕФАКТ')).toBeNull()
    expect(artSlug('enemy', 'КРЫСА')).toBeNull()
  })
})

describe('artFile', () => {
  it('берёт светлый и тёмный варианты одного рисунка', () => {
    const light = artFile('item', ITEM_NAMES.key, 'light')
    const dark = artFile('item', ITEM_NAMES.key, 'dark')

    expect(light).toContain('key-black')
    expect(dark).toContain('key-white')
  })

  it('для сущности без рисунка возвращает null', () => {
    expect(artFile('item', 'АРТЕФАКТ', 'dark')).toBeNull()
  })
})
