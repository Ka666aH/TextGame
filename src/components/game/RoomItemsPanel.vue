<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, onMounted } from 'vue'

import { isChestItem, itemId, itemNumber, roomItemAction } from '../../api/items'
import type { InventoryItem } from '../../api/types'
import { reportGameError, runGameAction, useGameBusy } from '../../composables/game'
import { canSearchRoom } from '../../lib/rooms'
import {
  roomItemsQueryOptions,
  useBuyRoomItemMutation,
  useTakeAllRoomItemsMutation,
  useTakeRoomItemMutation,
} from '../../queries/game'
import ChestCard from './ChestCard.vue'
import ItemCard from './ItemCard.vue'

const props = defineProps<{ roomNumber: number; roomName: string; inShop: boolean }>()

const { busy } = useGameBusy()

// Родитель пересоздаёт компонент при смене комнаты (`:key`), поэтому номер
// комнаты читается один раз и ключ запроса не меняется за время жизни.
const roomItems = useQuery(roomItemsQueryOptions(props.roomNumber))

const takeMutation = useTakeRoomItemMutation()
const takeAllMutation = useTakeAllRoomItemsMutation()
const buyMutation = useBuyRoomItemMutation()

const items = computed<InventoryItem[]>(() => roomItems.data.value ?? [])
const searched = computed(() => roomItems.data.value !== undefined)
const failed = computed(() => roomItems.error.value !== null)

// Стартовая и пустая комнаты заведомо без предметов: там даже кнопки нет.
const searchable = computed(() => canSearchRoom(props.roomName))

/**
 * Комната показывает содержимое сразу: отдельный шаг «Обыскать» больше не
 * нужен. Повторно не обыскиваем — если список уже в кэше (возврат в комнату),
 * он актуален, а лишний POST ничего не даёт.
 */
onMounted(() => {
  if (searchable.value && roomItems.data.value === undefined) void search()
})

function priceOf(item: InventoryItem): string {
  const cost = itemNumber(item, 'cost')
  return cost === null ? '' : ` · ${cost}`
}

async function search(): Promise<void> {
  if (busy.value) return

  busy.value = true
  try {
    // `refetch` не бросает: ошибка приходит в результате.
    const result = await roomItems.refetch()
    if (result.error !== null) {
      reportGameError(result.error, 'Не удалось обыскать комнату.')
    }
  } finally {
    busy.value = false
  }
}

async function take(item: InventoryItem): Promise<void> {
  const id = itemId(item)
  if (id === null) return

  await runGameAction(async () => {
    await takeMutation.mutateAsync(id)
    // Список в комнате меняется: сервер помнит, что комната обыскана.
    await roomItems.refetch()
  }, 'Не удалось взять предмет.')
}

async function takeAll(): Promise<void> {
  // `404 NOTHING_FOUND`, если брать нечего — это нормальный ответ.
  await runGameAction(async () => {
    await takeAllMutation.mutateAsync()
    await roomItems.refetch()
  }, 'Не удалось взять предметы.')
}

async function buy(item: InventoryItem): Promise<void> {
  const id = itemId(item)
  if (id === null) return

  await runGameAction(async () => {
    await buyMutation.mutateAsync(id)
    await roomItems.refetch()
  }, 'Не удалось купить предмет.')
}
</script>

<template>
  <section class="rounded border border-stone-800 bg-stone-900/40 p-3">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-xs tracking-wide text-stone-500 uppercase">
        в комнате{{ inShop ? ' (магазин)' : '' }}
      </h2>

      <div class="flex gap-2">
        <button
          v-if="searchable"
          type="button"
          class="rounded border border-stone-700 px-3 py-1 text-xs text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
          :disabled="busy"
          @click="search"
        >
          {{ searched ? 'Обыскать заново' : 'Обыскать' }}
        </button>

        <button
          v-if="searched && items.length > 0 && !inShop"
          type="button"
          class="rounded border border-stone-700 px-3 py-1 text-xs text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
          :disabled="busy"
          @click="takeAll"
        >
          Взять всё
        </button>
      </div>
    </div>

    <p v-if="!searchable" class="text-sm text-stone-500">Здесь искать нечего.</p>
    <p v-else-if="failed" class="text-sm text-red-300">
      Не удалось обыскать комнату. Нажми «Обыскать».
    </p>
    <p v-else-if="!searched" class="text-sm text-stone-500">Обыскиваю комнату…</p>
    <p v-else-if="items.length === 0" class="text-sm text-stone-500">Пусто.</p>

    <ul v-else class="space-y-2">
      <li v-for="item in items" :key="item.id ?? item.name" class="space-y-1">
        <ItemCard :item="item">
          <template #actions>
            <button
              v-if="roomItemAction(item, inShop) === 'take'"
              type="button"
              class="rounded border border-stone-700 px-3 py-1 text-xs text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
              :disabled="busy"
              @click="take(item)"
            >
              Взять
            </button>

            <button
              v-if="roomItemAction(item, inShop) === 'buy'"
              type="button"
              class="rounded border border-amber-800 px-3 py-1 text-xs text-amber-200 hover:bg-amber-950 disabled:opacity-40"
              :disabled="busy"
              @click="buy(item)"
            >
              Купить{{ priceOf(item) }}
            </button>
          </template>
        </ItemCard>

        <ChestCard v-if="isChestItem(item)" :chest="item" />
      </li>
    </ul>
  </section>
</template>
