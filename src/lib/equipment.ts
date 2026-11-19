import { structuralKind } from '../api/items'
import type { GameInfo, InventoryItem } from '../api/types'

/**
 * Сломанная вещь просто исчезает из экипировки: сервер заменяет оружие на
 * кулаки (`RemoveWeapon` → `Fists.DefaultFists`), а шлем и нагрудник
 * обнуляет. Уведомления о поломке нет ни в одном DTO, поэтому единственный
 * признак — сравнение состояния до и после боя.
 */
function isGone(before: InventoryItem, after: InventoryItem | null): boolean {
  if (after === null) return true
  // Кулаки — это «оружия нет»: у них нет `id`, вид структурный.
  return structuralKind(after) === 'fists' && structuralKind(before) !== 'fists'
}

/**
 * Названия вещей, сломавшихся между снимками.
 *
 * Вызывать только после боевого действия: ручное «Снять» даёт тот же эффект,
 * и объявлять его поломкой нельзя.
 */
export function brokenEquipment(before: GameInfo, after: GameInfo): string[] {
  const broken: string[] = []

  if (isGone(before.weapon, after.weapon)) broken.push(before.weapon.name)
  if (before.helm !== null && isGone(before.helm, after.helm)) broken.push(before.helm.name)
  if (before.chestplate !== null && isGone(before.chestplate, after.chestplate)) {
    broken.push(before.chestplate.name)
  }

  return broken
}
