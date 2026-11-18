import type { BattleLog } from '../api/types'

/**
 * Удар пришёлся по обычному сундуку, а не по мимику.
 *
 * У сундука здоровья нет вовсе, поэтому сервер отдаёт `null` в обоих полях
 * здоровья цели — это единственное место, где они пустые (AGENTS.md §7.5).
 * Проверять по имени цели нельзя: у сундука оно совпадает с константой только
 * пока её не переименуют, а у мимика своё.
 */
export function isPlainChestHit(log: BattleLog): boolean {
  return log.targetHealthBeforeAttack === null && log.targetHealthAfterAttack === null
}
