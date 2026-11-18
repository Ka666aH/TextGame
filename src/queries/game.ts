import { useMutation, useQuery } from '@tanstack/vue-query'

import {
  attackEnemy,
  buyRoomItem,
  equipItem,
  fetchState,
  goNextRoom,
  goToRoom,
  searchRoom,
  sellItem,
  takeAllRoomItems,
  takeRoomItem,
  unequipItem,
  useItem,
} from '../api/game'
import { isBattleLogArray, isBattleWin, isGameOver } from '../api/guards'
import type { GameOver } from '../api/types'
import { appendBattleLog } from '../composables/game'
import { queryClient } from './client'
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

/**
 * Обыск — это POST, поэтому он не может быть запросом, срабатывающим при
 * монтировании: сервер меняет флаг «обыскано». Запрос выключен и служит
 * хранилищем; данные кладёт `refetch()` из кнопки, а `queryFn` — это и есть
 * обыск. Комната передаётся числом, а компонент пересоздаётся при переходе.
 */
export function roomItemsQueryOptions(roomNumber: number) {
  return {
    queryKey: queryKeys.roomItems(roomNumber),
    queryFn: searchRoom,
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
  }
}

/** Финальное состояние и текст исхода нужны отдельному экрану. */
export function rememberGameOver(gameOver: GameOver): void {
  queryClient.setQueryData(queryKeys.state, gameOver.gameInfo)
  queryClient.setQueryData(queryKeys.gameOver, gameOver)
}

/** Предметы комнаты забываем: обыск — POST, его нельзя дёргать без игрока. */
function forgetRoomItems(): void {
  queryClient.removeQueries({ queryKey: queryKeys.roomItemsAll })
}

export function useTakeRoomItemMutation() {
  return useMutation({
    mutationFn: takeRoomItem,
    onSuccess: (gameInfo) => {
      queryClient.setQueryData(queryKeys.state, gameInfo)
    },
  })
}

export function useTakeAllRoomItemsMutation() {
  return useMutation({
    mutationFn: takeAllRoomItems,
    onSuccess: (gameInfo) => {
      queryClient.setQueryData(queryKeys.state, gameInfo)
    },
  })
}

export function useBuyRoomItemMutation() {
  return useMutation({
    mutationFn: buyRoomItem,
    onSuccess: (gameInfo) => {
      queryClient.setQueryData(queryKeys.state, gameInfo)
    },
  })
}

export function useSellItemMutation() {
  return useMutation({
    mutationFn: sellItem,
    onSuccess: (gameInfo) => {
      queryClient.setQueryData(queryKeys.state, gameInfo)
      // Проданный предмет возвращается в комнату, поэтому прежний список
      // предметов комнаты больше не соответствует серверу.
      forgetRoomItems()
    },
  })
}

/** Лечение может убить, поэтому исход проверяем до записи в кэш. */
export function useUseItemMutation() {
  return useMutation({
    mutationFn: useItem,
    onSuccess: (result) => {
      if (isGameOver(result)) {
        rememberGameOver(result)
        return
      }
      queryClient.setQueryData(queryKeys.state, result)
    },
  })
}

/** В ответе только экипировка, а инвентарь тоже изменился — перечитываем. */
export function useEquipItemMutation() {
  return useMutation({
    mutationFn: equipItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.state })
    },
  })
}

export function useUnequipItemMutation() {
  return useMutation({
    mutationFn: unequipItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.state })
    },
  })
}

async function afterRoomChange(): Promise<void> {
  forgetRoomItems()
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.state }),
    queryClient.invalidateQueries({ queryKey: queryKeys.map }),
  ])
}

/** Переход вперёд открывает комнату и может начать бой. */
export function useGoNextRoomMutation() {
  return useMutation({
    mutationFn: goNextRoom,
    onSuccess: async (result) => {
      if (isGameOver(result)) {
        rememberGameOver(result)
        return
      }
      await afterRoomChange()
    },
  })
}

/** Переход в уже открытую комнату: открытость не меняет и бой не начинает. */
export function useGoToRoomMutation() {
  return useMutation({
    mutationFn: goToRoom,
    onSuccess: async (result) => {
      if (isGameOver(result)) {
        rememberGameOver(result)
        return
      }
      await afterRoomChange()
    },
  })
}

/** Удар по врагу: три формы ответа, состояние перечитываем всегда. */
export function useAttackMutation() {
  return useMutation({
    mutationFn: attackEnemy,
    onSuccess: async (result) => {
      if (isGameOver(result)) {
        rememberGameOver(result)
        return
      }

      if (isBattleLogArray(result)) {
        appendBattleLog(result)
      } else if (isBattleWin(result)) {
        appendBattleLog([result.battleLog])
      }

      // В ответе нет состояния вообще: прочность могла сломаться, а `BattleWin`
      // не содержит `gameInfo` — перечитывание обязательно.
      await queryClient.invalidateQueries({ queryKey: queryKeys.state })
    },
  })
}
