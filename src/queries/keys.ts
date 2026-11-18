/**
 * Фабрика ключей кэша. Все ключи собираются здесь, чтобы инвалидация
 * не разъезжалась по компонентам.
 */
export const queryKeys = {
  me: ['me'] as const,
  sessions: ['sessions'] as const,
  saves: ['saves'] as const,
  state: ['state'] as const,
  map: ['map'] as const,

  /** Общий префикс предметов комнаты — для сброса всего списка сразу. */
  roomItemsAll: ['roomItems'] as const,
  /** Предметы комнаты привязаны к номеру: переход в другую комнату — другой ключ. */
  roomItems: (roomNumber: number) => ['roomItems', roomNumber] as const,
}
