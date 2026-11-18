import { CHESTPLATE_NAMES, HELM_NAMES, ITEM_NAMES } from './labels'
import type { InventoryItem } from './types'

/**
 * Вид предмета.
 *
 * Сервер не передаёт дискриминатор, и четыре разных вида — ключ, карта,
 * мешочек с монетами и «НЕИЗВЕСТНОЕ ЗЕЛЬЕ» — приходят побайтово одинаковыми
 * `{id,name,description,cost}`. Поэтому вид определяется в два шага:
 * сначала структурно по набору ключей, затем по точному имени там, где
 * поля не различают (роль простого предмета, слот брони).
 */

export type ItemKind = 'chest' | 'fists' | 'weapon' | 'wand' | 'armor' | 'heal' | 'plain'

export type ArmorSlot = 'helm' | 'chestplate'

export type PlainRole = 'key' | 'map' | 'coins' | 'potion'

export interface ItemView {
  kind: ItemKind
  armorSlot: ArmorSlot | null
  plainRole: PlainRole | null
  canUse: boolean
  canEquip: boolean
  canSell: boolean
  /** `null` у кулаков — у них нет `id`. */
  id: number | null
}

/**
 * Структурный вид. Порядок проверок важен: сундук и лечение не имеют
 * `damage`/`damageBlock`, броня не имеет `damage`.
 */
export function structuralKind(item: InventoryItem): ItemKind {
  if ('isClosed' in item) return 'chest'
  if ('damageBlock' in item) return 'armor'
  if ('damage' in item) {
    if (!('id' in item)) return 'fists'
    // Меч отдаёт `durability` (может быть null), жезл этого ключа не имеет вовсе.
    return 'durability' in item ? 'weapon' : 'wand'
  }
  if ('maxHealthBoost' in item || 'currentHealthBoost' in item) return 'heal'
  return 'plain'
}

/** Слот брони. Только по имени: поля у шлема и нагрудника идентичны. */
export function armorSlot(item: InventoryItem): ArmorSlot | null {
  if (HELM_NAMES.includes(item.name)) return 'helm'
  if (CHESTPLATE_NAMES.includes(item.name)) return 'chestplate'
  return null
}

/** Роль простого предмета. Только по имени. */
export function plainRole(item: InventoryItem): PlainRole | null {
  if (item.name === ITEM_NAMES.key) return 'key'
  if (item.name === ITEM_NAMES.map) return 'map'
  if (item.name === ITEM_NAMES.coins) return 'coins'
  // Лечение без полей лечения: суммы скрыты и разыгрываются при использовании.
  if (item.name === ITEM_NAMES.unknownPotion) return 'potion'
  return null
}

export function isChestItem(item: InventoryItem): boolean {
  return 'isClosed' in item
}

export function isDeadMimic(item: InventoryItem): boolean {
  return item.name === ITEM_NAMES.deadMimic
}

/** Карта нужна, чтобы вообще показывать кнопку карты. */
export function isMapItem(item: InventoryItem): boolean {
  return item.name === ITEM_NAMES.map
}

export function hasMap(inventory: readonly InventoryItem[]): boolean {
  return inventory.some(isMapItem)
}

/**
 * Можно ли позвать `use`.
 *
 * «НЕИЗВЕСТНОЕ ЗЕЛЬЕ» приходит как обычный предмет, поэтому одной проверки
 * на `maxHealthBoost`/`currentHealthBoost` недостаточно.
 */
export function canUse(item: InventoryItem): boolean {
  return structuralKind(item) === 'heal' || item.name === ITEM_NAMES.unknownPotion
}

/** Можно ли позвать `equip`. Кулаки надеть нельзя — они уже надеты. */
export function canEquip(item: InventoryItem): boolean {
  const kind = structuralKind(item)
  return kind === 'weapon' || kind === 'wand' || kind === 'armor'
}

/** Есть ли цена. Без неё `sell` вернёт `403 UNSELLABLE_ERROR`. */
export function canSell(item: InventoryItem): boolean {
  return typeof item.cost === 'number'
}

export function itemId(item: InventoryItem): number | null {
  return typeof item.id === 'number' ? item.id : null
}

/** Числовое поле предмета без `null`/`undefined`. */
export function itemNumber(
  item: InventoryItem,
  key: 'cost' | 'durability' | 'damage' | 'damageBlock' | 'maxHealthBoost' | 'currentHealthBoost',
): number | null {
  const value = item[key]
  return typeof value === 'number' ? value : null
}

export function classifyItem(item: InventoryItem): ItemView {
  const kind = structuralKind(item)
  return {
    kind,
    armorSlot: kind === 'armor' ? armorSlot(item) : null,
    plainRole: kind === 'plain' ? plainRole(item) : null,
    canUse: canUse(item),
    canEquip: canEquip(item),
    canSell: canSell(item),
    id: itemId(item),
  }
}

const KIND_LABELS: Record<ItemKind, string> = {
  chest: 'сундук',
  fists: 'кулаки',
  weapon: 'оружие',
  wand: 'жезл',
  armor: 'броня',
  heal: 'лечение',
  plain: 'предмет',
}

/**
 * Подпись вида предмета для интерфейса.
 *
 * Для брони и простых предметов поля не различают вид, поэтому уточняем
 * по имени — ровно там, где `structuralKind` бессилен.
 */
export function kindLabel(item: InventoryItem): string {
  const kind = structuralKind(item)

  if (kind === 'armor') {
    const slot = armorSlot(item)
    if (slot === 'helm') return 'шлем'
    if (slot === 'chestplate') return 'нагрудник'
    return KIND_LABELS[kind]
  }

  if (kind === 'plain') {
    const role = plainRole(item)
    if (role === 'key') return 'ключ'
    if (role === 'map') return 'карта'
    if (role === 'coins') return 'монеты'
    if (role === 'potion') return 'зелье'
    return KIND_LABELS[kind]
  }

  return KIND_LABELS[kind]
}

export type RoomItemAction = 'take' | 'buy' | 'none'

/**
 * Что можно сделать с предметом, лежащим в комнате.
 *
 * В магазине бесплатно брать нельзя — сервер ответит `403 CAN_NOT_STEAL`,
 * поэтому «Взять» **заменяется** на «Купить», а не показывается рядом.
 * Сундук — не переносимый предмет: у него свой цикл (`ChestCard`), и брать
 * его нельзя, поэтому действий здесь нет.
 */
export function roomItemAction(item: InventoryItem, inShop: boolean): RoomItemAction {
  if (isChestItem(item)) return 'none'
  return inShop ? 'buy' : 'take'
}
