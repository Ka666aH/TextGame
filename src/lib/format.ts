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
