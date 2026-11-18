<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { CODE } from '../../api/codes'
import { isApiError } from '../../api/errors'
import { isBattleWin, isGameOver } from '../../api/guards'
import { isDeadMimic, itemId } from '../../api/items'
import type { InventoryItem } from '../../api/types'
import { reportGameError, runGameAction, useGameBusy } from '../../composables/game'
import { battleLogLine } from '../../lib/battle'
import { isPlainChestHit } from '../../lib/chests'
import {
  chestItemsQueryOptions,
  useHitChestMutation,
  useOpenChestMutation,
  useTakeAllChestItemsMutation,
  useTakeChestItemMutation,
  useUnlockChestMutation,
} from '../../queries/game'
import { useUiStore } from '../../stores/ui'

const props = defineProps<{ chest: InventoryItem }>()

const router = useRouter()
const ui = useUiStore()
const { busy } = useGameBusy()

const openMutation = useOpenChestMutation()
const unlockMutation = useUnlockChestMutation()
const hitMutation = useHitChestMutation()
const takeMutation = useTakeChestItemMutation()
const takeAllMutation = useTakeAllChestItemsMutation()

/**
 * У сундука из комнаты `id` есть всегда: он приходит из обыска. Без него
 * действиям некуда адресоваться, а ключ запроса с заведомо неверным числом
 * безвреден — запрос выключен.
 */
const chestId = computed(() => itemId(props.chest))

const chestItems = useQuery(chestItemsQueryOptions(chestId.value ?? -1))

const loot = computed<InventoryItem[] | undefined>(() => chestItems.data.value)
const lootItems = computed<InventoryItem[]>(() => loot.value ?? [])
const hasLoot = computed(() => loot.value !== undefined)

/**
 * `isClosed: false` сервер отдаёт и у открытого сундука, и у мёртвого мимика.
 * Этого хватает, чтобы предложить «Показать лут» вместо «Открыть» после
 * возвращения в комнату, когда локального состояния уже нет.
 */
const alreadyOpen = computed(() => props.chest.isClosed === false)
const deadMimic = computed(() => isDeadMimic(props.chest))

/** Запертость в DTO не передаётся: узнаём из `403 LOCKED` на попытке открыть. */
const locked = ref(false)

async function openChest(): Promise<void> {
  const id = chestId.value
  if (id === null || busy.value) return

  // `LOCKED` — не ошибка для игрока, а следующий шаг, поэтому блокировку
  // держим руками: тост здесь был бы шумом, а `runGameAction` его покажет.
  busy.value = true
  try {
    const result = await openMutation.mutateAsync(id)
    if (isGameOver(result)) {
      // Открыли мимика: игра окончена, кэш уже обновлён мутацией.
      await router.push({ name: 'gameOver' })
      return
    }
    locked.value = false
  } catch (error) {
    if (isApiError(error) && error.code === CODE.locked) {
      locked.value = true
      return
    }
    reportGameError(error, 'Не удалось открыть сундук.')
  } finally {
    busy.value = false
  }
}

/** Отпирание тратит ключ, поэтому сразу открываем: второй раз он не нужен. */
async function unlock(): Promise<void> {
  const id = chestId.value
  if (id === null) return

  const result = await runGameAction(
    () => unlockMutation.mutateAsync(id),
    'Не удалось отпереть сундук.',
  )
  if (!result.ok) return

  locked.value = false
  await openChest()
}

/** Удар по сундуку: мимик начнёт бой, обычный сундук только попортит оружие. */
async function hit(): Promise<void> {
  const id = chestId.value
  if (id === null) return

  const result = await runGameAction(
    () => hitMutation.mutateAsync(id),
    'Не удалось ударить сундук.',
  )
  if (!result.ok) return

  if (isGameOver(result.data)) {
    await router.push({ name: 'gameOver' })
    return
  }

  // По мимику начинается бой, и удар попадёт в журнал панели боя. По обычному
  // сундуку боя нет, журнала тоже — результат показываем тостом.
  const log = isBattleWin(result.data) ? result.data.battleLog : result.data
  if (isPlainChestHit(log)) ui.notify(battleLogLine(log))
}

/** Лут уже открытого сундука: запрос выключен, поэтому дёргаем его вручную. */
async function search(): Promise<void> {
  if (busy.value) return

  busy.value = true
  try {
    const result = await chestItems.refetch()
    if (result.error !== null) reportGameError(result.error, 'Не удалось посмотреть лут.')
  } finally {
    busy.value = false
  }
}

async function take(item: InventoryItem): Promise<void> {
  const id = chestId.value
  const itemKey = itemId(item)
  if (id === null || itemKey === null) return

  await runGameAction(async () => {
    await takeMutation.mutateAsync({ chestId: id, itemId: itemKey })
    await chestItems.refetch()
  }, 'Не удалось взять предмет.')
}

async function takeAll(): Promise<void> {
  const id = chestId.value
  if (id === null) return

  // `404 NOTHING_FOUND`, если брать нечего — это нормальный ответ.
  await runGameAction(async () => {
    await takeAllMutation.mutateAsync(id)
    await chestItems.refetch()
  }, 'Не удалось забрать предметы.')
}
</script>

<template>
  <div
    v-if="chestId !== null"
    class="mt-1 rounded border border-stone-800 bg-stone-950/50 px-3 py-2"
  >
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-if="!hasLoot && alreadyOpen"
        type="button"
        class="rounded border border-stone-700 px-3 py-1 text-xs text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
        :disabled="busy"
        @click="search"
      >
        Показать лут
      </button>

      <template v-if="!hasLoot && !alreadyOpen">
        <button
          v-if="locked"
          type="button"
          class="rounded border border-amber-800 px-3 py-1 text-xs text-amber-200 hover:bg-amber-950 disabled:opacity-40"
          :disabled="busy"
          @click="unlock"
        >
          Отпереть ключом
        </button>

        <button
          v-else
          type="button"
          class="rounded bg-stone-200 px-3 py-1 text-xs font-medium text-stone-900 hover:bg-white disabled:opacity-40"
          :disabled="busy"
          @click="openChest"
        >
          Открыть
        </button>

        <button
          type="button"
          class="rounded border border-stone-700 px-3 py-1 text-xs text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
          :disabled="busy"
          @click="hit"
        >
          Ударить
        </button>
      </template>

      <span v-if="locked && !hasLoot" class="text-xs text-amber-300">Заперт: нужен ключ.</span>
    </div>

    <p v-if="!hasLoot" class="mt-2 text-xs text-stone-500">
      Мимик выглядит как сундук. Удар начнёт бой, если он живой, и только
      попортит оружие, если сундук обычный.
    </p>

    <p v-if="deadMimic && !hasLoot" class="mt-1 text-xs text-stone-500">
      Здесь лежит лут мёртвого мимика.
    </p>

    <div v-if="hasLoot" class="mt-2 space-y-1">
      <p v-if="lootItems.length === 0" class="text-sm text-stone-500">Пусто.</p>

      <ul v-else class="space-y-1">
        <li
          v-for="item in lootItems"
          :key="item.id ?? item.name"
          class="flex items-center justify-between gap-2 rounded bg-stone-900/60 px-2 py-1"
        >
          <span class="min-w-0 flex-1 truncate text-sm text-stone-200">{{ item.name }}</span>
          <button
            type="button"
            class="rounded border border-stone-700 px-2 py-0.5 text-xs text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
            :disabled="busy"
            @click="take(item)"
          >
            Забрать
          </button>
        </li>
      </ul>

      <button
        v-if="lootItems.length > 0"
        type="button"
        class="rounded border border-stone-700 px-3 py-1 text-xs text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
        :disabled="busy"
        @click="takeAll"
      >
        Забрать всё
      </button>
    </div>
  </div>
</template>
