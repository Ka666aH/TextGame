import { useMutation, useQuery } from '@tanstack/vue-query'

import {
  attackEnemy,
  buyRoomItem,
  equipItem,
  fetchState,
  goNextRoom,
  goToRoom,
  hitChest,
  openChest,
  searchChestItems,
  searchRoom,
  sellItem,
  takeAllChestItems,
  takeAllRoomItems,
  takeChestItem,
  takeRoomItem,
  unequipItem,
  unlockChest,
  useItem,
} from '../api/game'
import { isBattleLogArray, isBattleWin, isGameOver } from '../api/guards'
import type { GameInfo, GameOver } from '../api/types'
import { isPlainChestHit } from '../lib/chests'
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
 * обыск.
 *
 * Ключ содержит номер комнаты, поэтому у каждой комнаты своя запись, и она
 * переживает смену комнаты: `enabled: false` не даёт запросу сходить на сервер
 * сам, так что вернувшись игрок видит уже найденный лут.
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

/**
 * Список предметов комнаты забываем точечно. Сам по себе он не устаревает:
 * содержимое комнаты меняется только нашими же действиями, а каждое из них
 * перечитывает список. Поэтому, вернувшись в комнату, игрок сразу видит то,
 * что уже нашёл, и повторный обыск не нужен — обыск это POST, и дёргать его
 * без действия игрока нельзя.
 */
function forgetRoomItems(roomNumber: number): void {
  queryClient.removeQueries({ queryKey: queryKeys.roomItems(roomNumber) })
}

/**
 * Бой начат ударом по сундуку. Если мимик погиб, сундук возвращается в комнату
 * уже мёртвым и отпертым — и список комнаты надо перечитать, иначе на экране
 * останется прежний запертый сундук, который просит ключ.
 */
let mimicBattle = false

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
      // предметов этой комнаты больше не соответствует серверу.
      forgetRoomItems(gameInfo.room.number)
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

/**
 * Смена комнаты перечитывает состояние и карту; списки предметов комнат
 * при этом остаются в кэше. Это не только экономия на обыске: возврат назад
 * должен показывать уже найденный лут, а не пустую комнату.
 */
async function afterRoomChange(): Promise<void> {
  mimicBattle = false
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
        mimicBattle = false
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

      if (isBattleWin(result) && mimicBattle) {
        mimicBattle = false
        await refreshCurrentRoomItems()
      }
    },
  })
}

/**
 * Лут сундука — то же устройство, что и у предметов комнаты: выключенный
 * запрос служит хранилищем. Данные кладёт `open` (он сразу возвращает лут)
 * либо `refetch` для сундука, который открыли в прошлый визит.
 */
export function chestItemsQueryOptions(chestId: number) {
  return {
    queryKey: queryKeys.chestItems(chestId),
    queryFn: () => searchChestItems(chestId),
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
  }
}

/** Номер текущей комнаты известен только из кэша состояния. */
function currentRoomNumber(): number | null {
  const info = queryClient.getQueryData<GameInfo>(queryKeys.state)
  return info?.room.number ?? null
}

/**
 * Перечитывает список предметов текущей комнаты после боя: мимик возвращается
 * в неё мёртвым, а комната после этого выглядит иначе. Обыск — это POST под
 * `RequireNotInBattle`, поэтому звать его можно только когда бой окончен.
 * Ошибку глотаем: это фоновое обновление, а не действие игрока, и в худшем
 * случае список просто останется прежним.
 */
async function refreshCurrentRoomItems(): Promise<void> {
  const roomNumber = currentRoomNumber()
  if (roomNumber === null) return

  try {
    const items = await searchRoom()
    queryClient.setQueryData(queryKeys.roomItems(roomNumber), items)
  } catch {
    // Список останется прежним до следующего обыска.
  }
}

/** Лут приходит прямо в ответе: обыск после открытия не нужен. */
export function useOpenChestMutation() {
  return useMutation({
    mutationFn: openChest,
    onSuccess: (result, chestId) => {
      if (isGameOver(result)) {
        rememberGameOver(result)
        return
      }
      queryClient.setQueryData(queryKeys.chestItems(chestId), result)
    },
  })
}

/** Отпирание всегда тратит ключ, поэтому счётчик ключей надо перечитать. */
export function useUnlockChestMutation() {
  return useMutation({
    mutationFn: unlockChest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.state })
    },
  })
}

/**
 * Удар по сундуку. Обычный сундук остаётся в комнате, мимик уходит в бой,
 * а если он погиб от первого удара — возвращается в комнату мёртвым.
 */
export function useHitChestMutation() {
  return useMutation({
    mutationFn: hitChest,
    onSuccess: async (result) => {
      if (isGameOver(result)) {
        mimicBattle = false
        rememberGameOver(result)
        return
      }

      const log = isBattleWin(result) ? result.battleLog : result
      appendBattleLog([log])

      // Состояния в ответе нет: хиты и прочность оружия могли измениться.
      await queryClient.invalidateQueries({ queryKey: queryKeys.state })

      if (isBattleWin(result)) {
        // Мимик умер сразу: сундук уже вернулся в комнату мёртвым и открытым.
        await refreshCurrentRoomItems()
        return
      }

      // Обычный сундук никуда не делся, а вот мимик ушёл в бой. Список комнаты
      // сейчас не перечитать: обыск запрещён, пока бой идёт. Запоминаем, чтобы
      // обновить его после победы.
      if (!isPlainChestHit(log)) mimicBattle = true
    },
  })
}

export function useTakeChestItemMutation() {
  return useMutation({
    mutationFn: (vars: { chestId: number; itemId: number }) =>
      takeChestItem(vars.chestId, vars.itemId),
    onSuccess: (gameInfo) => {
      queryClient.setQueryData(queryKeys.state, gameInfo)
    },
  })
}

/** `404 NOTHING_FOUND`, если в сундуке пусто. */
export function useTakeAllChestItemsMutation() {
  return useMutation({
    mutationFn: takeAllChestItems,
    onSuccess: (gameInfo) => {
      queryClient.setQueryData(queryKeys.state, gameInfo)
    },
  })
}
