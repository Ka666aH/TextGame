import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { createSave, deleteSave, fetchSaves, loadSave } from '../api/saves'
import { queryKeys } from './keys'

export function useSavesQuery() {
  return useQuery({
    queryKey: queryKeys.saves,
    queryFn: fetchSaves,
  })
}

/** Состояние игры не меняется, но список сохранений — да. */
export function useCreateSaveMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createSave,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.saves })
    },
  })
}

/**
 * Загрузка сохранения заменяет состояние целиком, поэтому игровой кэш
 * удаляем, а не инвалидируем: иначе на экране мелькнёт комната из прошлой
 * линии подземелья.
 */
export function useLoadSaveMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: loadSave,
    onSuccess: async () => {
      client.removeQueries({ queryKey: queryKeys.state })
      client.removeQueries({ queryKey: queryKeys.map })
      client.removeQueries({ queryKey: queryKeys.roomItemsAll })
      client.removeQueries({ queryKey: queryKeys.gameOver })
      await client.invalidateQueries({ queryKey: queryKeys.saves })
    },
  })
}

/** `403 IMPOSSIBLE_DELETE_SAVE` — штатный ответ для несъёмных сохранений. */
export function useDeleteSaveMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: deleteSave,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.saves })
    },
  })
}
