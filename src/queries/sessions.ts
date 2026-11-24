import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { createSession, deleteSession, fetchSessions, selectSession } from '../api/sessions'
import { resetGameCaches } from './game'
import { queryKeys } from './keys'

export function useSessionsQuery() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: fetchSessions,
  })
}

/**
 * Создание сразу делает сессию активной, поэтому меняется и `me`, и всё
 * игровое состояние: подземелье новое, старые комнаты и списки предметов
 * к нему не относятся.
 */
export function useCreateSessionMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createSession,
    onSuccess: async () => {
      resetGameCaches()
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.me }),
        client.invalidateQueries({ queryKey: queryKeys.sessions }),
      ])
    },
  })
}

/**
 * Переключение сессии меняет всё игровое состояние, поэтому кэш игры
 * удаляем целиком: чужие комнаты и предметы не должны протечь в новую игру.
 */
export function useSelectSessionMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: selectSession,
    onSuccess: async () => {
      resetGameCaches()
      await client.invalidateQueries({ queryKey: queryKeys.me })
    },
  })
}

/** Если удалили активную сессию, сервер снимет claim — `me` это покажет. */
export function useDeleteSessionMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.me }),
        client.invalidateQueries({ queryKey: queryKeys.sessions }),
      ])
    },
  })
}
