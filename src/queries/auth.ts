import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { fetchMe, login, logout, register } from '../api/auth'
import { resetClientState } from './client'
import { queryKeys } from './keys'

/**
 * `me` — серверные данные, поэтому живут в кэше запросов, а не в Pinia.
 *
 * `staleTime: Infinity`: значение меняется только нашими мутациями, и они
 * инвалидируют ключ явно. Без этого каждый переход между экранами дёргал бы
 * `/auth/me`, а документ требует ровно один bootstrap-запрос.
 */
export function meQueryOptions() {
  return {
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    staleTime: Number.POSITIVE_INFINITY,
  }
}

export function useMeQuery() {
  return useQuery(meQueryOptions())
}

export function useLoginMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.me })
    },
  })
}

export function useRegisterMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.me })
    },
  })
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Куки уже недействительны. Сбрасываем личность явно, иначе шапка
      // останется висеть: см. `resetClientState`.
      resetClientState()
    },
  })
}
