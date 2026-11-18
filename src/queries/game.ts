import { useQuery } from '@tanstack/vue-query'

import { fetchState } from '../api/game'
import { queryKeys } from './keys'

/**
 * Опции вынесены отдельно: их использует не только экран игры, но и прогрев
 * кэша на экране сохранений. Там состояние не показывается — оно нужно, чтобы
 * `GET /state` положил его в Redis перед `POST /saves`.
 */
export function stateQueryOptions() {
  return {
    queryKey: queryKeys.state,
    queryFn: fetchState,
  }
}

export function useStateQuery() {
  return useQuery(stateQueryOptions())
}
