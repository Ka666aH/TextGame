<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { itemId, itemNumber, roomItemAction } from '../../api/items'
import type { InventoryItem } from '../../api/types'
import { reportGameError, runGameAction, useGameBusy } from '../../composables/game'
import {
  roomItemsQueryOptions,
  useBuyRoomItemMutation,
  useTakeAllRoomItemsMutation,
  useTakeRoomItemMutation,
} from '../../queries/game'
import ItemCard from './ItemCard.vue'

const props = defineProps<{ roomNumber: number; inShop: boolean }>()

const { busy } = useGameBusy()

// Родитель пересоздаёт компонент при смене комнаты (`:key`), поэтому номер
// комнаты читается один раз и ключ запроса не меняется за время жизни.
const roomItems = useQuery(roomItemsQueryOptions(props.roomNumber))

const takeMutation = useTakeRoomItemMutation()
const takeAllMutation = useTakeAllRoomItemsMutation()
const buyMutation = useBuyRoomItemMutation()

const items = computed<InventoryItem[]>(() => roomItems.data.value ?? [])
const searched = computed(() => roomItems.data.value !== undefined)

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
          type="button"
          class="rounded border border-stone-700 px-3 py-1 text-xs text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
          :disabled="busy"
          @click="search"
        >
          {{ searched ? 'Обыскать снова' : 'Обыскать' }}
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

    <p v-if="!searched" class="text-sm text-stone-500">Комнату ещё не обыскивали.</p>
    <p v-else-if="items.length === 0" class="text-sm text-stone-500">Пусто.</p>

    <ul v-else class="space-y-2">
      <li v-for="item in items" :key="item.id ?? item.name">
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
      </li>
    </ul>
  </section>
</template>
