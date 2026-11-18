import type { BattleLog } from '../api/types'

/**
 * Одна строка журнала боя.
 *
 * Сервер отдаёт `targetHealthBeforeAttack`/`targetHealthAfterAttack` пустыми
 * только в одном случае — удар по обычному сундуку, где здоровья у цели нет.
 * Тогда переход показывать нечего.
 */
export function battleLogLine(log: BattleLog): string {
  const damage = `${log.attacker} → ${log.target}: ${log.damageToTarget}`

  const before = log.targetHealthBeforeAttack
  const after = log.targetHealthAfterAttack
  const transition = before !== null && after !== null ? ` (${before} → ${after})` : ''

  const counter = log.damageToAttacker > 0 ? ` · в ответ ${log.damageToAttacker}` : ''

  return `${damage}${transition}${counter}`
}
