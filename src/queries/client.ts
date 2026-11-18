import { QueryClient } from '@tanstack/vue-query'

import { queryKeys } from './keys'

/**
 * Единственный кэш серверного состояния.
 *
 * `retry: false` — мутации и часть запросов неидемпотентны, повтор запрещён.
 * `refetchOnWindowFocus: false` — фоновое перечитывание посреди боя даёт
 * мигание, а состояние меняется только нашими же действиями.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

/**
 * Смена личности: игрок вышел сам или сервер ответил `401`.
 *
 * Порядок принципиален. `setQueryData(me, null)` обновляет **существующий**
 * запрос и будит его наблюдателей, поэтому шапка исчезает сразу.
 * `clear()` так не работает: он выбрасывает запрос из кэша, а наблюдатели
 * остаются со старым значением — и шапка висит, пока запрос не пересоздадут.
 *
 * Остальные запросы удаляем, а не инвалидируем: данные прошлой сессии
 * не должны пережить её саму. `me` из-под удаления исключён — он только что
 * выставлен в `null`.
 */
export function resetClientState(): void {
  queryClient.setQueryData(queryKeys.me, null)
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== queryKeys.me[0],
  })
}
