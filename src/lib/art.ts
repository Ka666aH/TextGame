import { ENEMY_NAMES, ITEM_NAMES, ROOM_NAMES } from '../api/labels'

/**
 * Визуальный слой сущностей.
 *
 * Картинки лежат в `assets/images` в двух вариантах: `-black` — чёрный рисунок
 * для светлой темы, `-white` — белый для тёмной. Выбор варианта — часть ключа,
 * а не CSS-фильтр: фильтр испортил бы полупрозрачные края.
 *
 * Экраны по-прежнему передают только смысловые `kind`/`name`, поэтому замена
 * картинки или добавление новой сущности — правка одного файла.
 */

export type ArtKind = 'room' | 'enemy' | 'item' | 'player'
export type ArtTheme = 'light' | 'dark'

const ROOM_SLUGS: Record<string, string> = {
  [ROOM_NAMES.start]: 'rooms/start',
  [ROOM_NAMES.small]: 'rooms/small',
  [ROOM_NAMES.big]: 'rooms/big',
  [ROOM_NAMES.empty]: 'rooms/empty',
  [ROOM_NAMES.shop]: 'rooms/shop',
  [ROOM_NAMES.exit]: 'rooms/end',
}

/**
 * Привязка по именам предметов. Сундук и мёртвый мимик — один рисунок: это
 * один и тот же предмет комнаты, отличаются они только жизнью внутри.
 */
const ITEM_SLUGS: Record<string, string> = {
  [ITEM_NAMES.chest]: 'items/chest',
  [ITEM_NAMES.deadMimic]: 'items/chest',
  [ITEM_NAMES.key]: 'items/key',
  [ITEM_NAMES.map]: 'items/map',
  [ITEM_NAMES.coins]: 'items/bag',
  [ITEM_NAMES.bandage]: 'items/bandage',
  [ITEM_NAMES.powerPotion]: 'items/strength',
  [ITEM_NAMES.regenPotion]: 'items/regen',
  [ITEM_NAMES.unknownPotion]: 'items/random',
  [ITEM_NAMES.fists]: 'items/fists',
  [ITEM_NAMES.magicWand]: 'items/magic-wand',
  [ITEM_NAMES.randomWand]: 'items/random-wand',
  [ITEM_NAMES.rustSword]: 'items/rust-sword',
  [ITEM_NAMES.ironSword]: 'items/iron-sword',
  [ITEM_NAMES.silverSword]: 'items/silver-sword',
  [ITEM_NAMES.glassSword]: 'items/glass-sword',
  [ITEM_NAMES.woodenBucket]: 'items/bucket',
  [ITEM_NAMES.leatherHelm]: 'items/leather-helm',
  [ITEM_NAMES.ironHelm]: 'items/iron-helm',
  [ITEM_NAMES.leatherVest]: 'items/vest',
  [ITEM_NAMES.ironCuirass]: 'items/cuirass',
}

const ENEMY_SLUGS: Record<string, string> = {
  [ENEMY_NAMES.deadman]: 'enemies/deadman',
  [ENEMY_NAMES.ghost]: 'enemies/ghost',
  [ENEMY_NAMES.lich]: 'enemies/lich',
  [ENEMY_NAMES.mimic]: 'enemies/mimic',
  [ENEMY_NAMES.skeletor]: 'enemies/skeleton',
  [ENEMY_NAMES.skeletorArcher]: 'enemies/skeleton-archer',
}

/** Все картинки сразу: их меньше семидесяти, ленивая загрузка не нужна. */
const FILES = import.meta.glob('../assets/images/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** Первая буква названия в верхнем регистре. Пустое имя — «?». */
export function monogram(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) return '?'

  const first = trimmed.charAt(0)
  return first.toLocaleUpperCase('ru-RU')
}

/**
 * Имя файла без варианта темы. `null` — у сущности нет картинки, и её надо
 * рисовать монограммой.
 */
export function artSlug(kind: ArtKind, name: string): string | null {
  const key = name.trim().toLocaleUpperCase('ru-RU')

  if (kind === 'room') return ROOM_SLUGS[key] ?? null
  if (kind === 'enemy') return ENEMY_SLUGS[key] ?? null
  if (kind === 'item') return ITEM_SLUGS[key] ?? null
  return null
}

/** Адрес картинки для темы: `-black` на светлом фоне, `-white` на тёмном. */
export function artFile(kind: ArtKind, name: string, theme: ArtTheme): string | null {
  const slug = artSlug(kind, name)
  if (slug === null) return null

  const variant = theme === 'dark' ? 'white' : 'black'
  return FILES[`../assets/images/${slug}-${variant}.png`] ?? null
}
