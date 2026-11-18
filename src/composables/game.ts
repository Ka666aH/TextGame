import { ref } from 'vue'

import { isApiError, messageForError } from '../api/errors'
import type { BattleLog } from '../api/types'
import { useUiStore } from '../stores/ui'

/**
 * Общая блокировка действий на игровом экране.
 *
 * Сервер не отдаёт версий и ETag, поэтому два одновременных действия дают
 * гонку, в которой «побеждает последняя запись»: игрок нажал «Бить» и «Идти
 * дальше», а состояние соответствует только одному из ответов. Пока запрос
 * в полёте, блокируем все действия, а не только нажатую кнопку.
 */
const busy = ref(false)

export function useGameBusy() {
  return { busy }
}

/** Показывает ошибку игрока тостом. Общая точка для действий и запросов. */
export function reportGameError(error: unknown, fallback: string): void {
  const ui = useUiStore()
  ui.notify(isApiError(error) ? messageForError(error) : fallback)
}

export type GameActionResult<T> = { ok: true; data: T } | { ok: false }

/**
 * Выполняет действие, держит блокировку и показывает ошибку тостом.
 * Ошибка не пробрасывается: вызывающему важно только «получилось или нет».
 */
export async function runGameAction<T>(
  action: () => Promise<T>,
  fallback: string,
): Promise<GameActionResult<T>> {
  if (busy.value) return { ok: false }

  busy.value = true
  try {
    return { ok: true, data: await action() }
  } catch (error) {
    reportGameError(error, fallback)
    return { ok: false }
  } finally {
    busy.value = false
  }
}

const BATTLE_LOG_LIMIT = 20

/**
 * Журнал боя. Сервер историю не хранит: каждый удар отдаёт только текущий
 * обмен, поэтому накопление — целиком клиентское и теряется при перезагрузке.
 */
const battleLog = ref<BattleLog[]>([])

export function useBattleLog() {
  return { battleLog }
}

export function appendBattleLog(logs: readonly BattleLog[]): void {
  battleLog.value = [...battleLog.value, ...logs].slice(-BATTLE_LOG_LIMIT)
}

/** Журнал относится к текущему бою: при смене комнаты он больше не актуален. */
export function clearBattleLog(): void {
  battleLog.value = []
}
