/**
 * Сервер отдаёт даты в ISO 8601 UTC. Показываем в локальной зоне —
 * это единственное место, где дата превращается в строку.
 */
const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return dateTimeFormatter.format(date)
}

/**
 * Порядок списков сервер не гарантирует ни для сессий, ни для сохранений,
 * поэтому сортируем на клиенте. ISO-строки в UTC сравниваются лексикографически
 * корректно — парсить даты ради сортировки не нужно.
 */
export function newestFirst<T extends { createdAt: string }>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

/**
 * Seed для показа. Это 64-битное число, и в JSON оно уже пришло обычным
 * `number`, то есть выше 2^53 точность потеряна. Как подпись подземелья
 * значение годится, как средство воспроизведения — нет; поэтому показываем
 * как есть и не используем ни в запросах, ни для проверок.
 */
export function formatSeed(seed: number): string {
  if (!Number.isFinite(seed)) return String(seed)
  return String(Math.trunc(seed))
}
