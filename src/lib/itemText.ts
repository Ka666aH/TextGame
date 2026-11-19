import { itemNumber } from '../api/items'
import type { InventoryItem } from '../api/types'

/**
 * Числовые характеристики предмета — то, что игрок читает в карточке.
 *
 * У лечения две разные величины, и называть обе «лечением» нельзя:
 * `maxHealthBoost` поднимает предел здоровья, `currentHealthBoost` лечит
 * текущее. Нули не показываем: у повязки один из двух бонусов обычно нулевой,
 * и строка «лечение 0/8» только путала.
 *
 * Порядок фиксирован: сначала боевые свойства, потом лечение, в конце цена.
 * Карточка в инвентаре и слот экипировки читаются одинаково, потому что берут
 * строки отсюда.
 */
export function describeStats(item: InventoryItem): string[] {
  const rows: string[] = []

  const damage = itemNumber(item, 'damage')
  if (damage !== null) rows.push(`урон ${damage}`)

  const block = itemNumber(item, 'damageBlock')
  if (block !== null) rows.push(`блок ${block}`)

  const durability = itemNumber(item, 'durability')
  if (durability !== null) rows.push(`прочность ${durability}`)

  const maxBoost = itemNumber(item, 'maxHealthBoost')
  if (maxBoost !== null && maxBoost > 0) rows.push(`предел здоровья +${maxBoost}`)

  const currentBoost = itemNumber(item, 'currentHealthBoost')
  if (currentBoost !== null && currentBoost > 0) rows.push(`здоровье +${currentBoost}`)

  const cost = itemNumber(item, 'cost')
  if (cost !== null) rows.push(`цена ${cost}`)

  return rows
}

/** « · 12» для кнопки магазина: цена прямо на действии, как у «Купить». */
export function priceSuffix(item: InventoryItem): string {
  const cost = itemNumber(item, 'cost')
  return cost === null ? '' : ` · ${cost}`
}
