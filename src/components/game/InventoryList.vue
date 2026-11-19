<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { itemCategory, type ItemCategory } from '../../api/items'
import type { InventoryItem } from '../../api/types'
import ItemCard from './ItemCard.vue'

const props = defineProps<{ items: InventoryItem[] }>()

type Filter = ItemCategory | 'all'

const LABELS: Record<Filter, string> = {
  all: 'все',
  weapon: 'оружие',
  armor: 'броня',
  heal: 'лечение',
  other: 'прочее',
}

const filter = ref<Filter>('all')

const filterActive = computed(() => filter.value !== 'all')

/**
 * Группы, которые реально есть в сумке. Пока группа одна, фильтр не нужен:
 * делить нечего, и лишняя строка только отнимает место.
 */
const available = computed<{ key: ItemCategory; count: number }[]>(() => {
  const counts = new Map<ItemCategory, number>()
  for (const item of props.items) {
    const category = itemCategory(item)
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }

  const order: ItemCategory[] = ['weapon', 'armor', 'heal', 'other']
  return order
    .filter((category) => counts.has(category))
    .map((category) => ({ key: category, count: counts.get(category) ?? 0 }))
})

const visible = computed<InventoryItem[]>(() => {
  if (filter.value === 'all') return props.items
  const category = filter.value
  return props.items.filter((item) => itemCategory(item) === category)
})

// Продали последнее оружие — выбранная группа исчезла, возвращаемся к «все».
watch(available, (groups) => {
  if (filter.value === 'all') return
  if (!groups.some((group) => group.key === filter.value)) filter.value = 'all'
})

function chipClass(active: boolean): string {
  return active ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white'
}
</script>

<template>
  <section class="rounded border border-stone-800 bg-stone-900/40 p-3">
    <h2 class="mb-2 text-xs tracking-wide text-stone-500 uppercase">инвентарь</h2>

    <p v-if="items.length === 0" class="text-sm text-stone-500">Пусто.</p>

    <template v-else>
      <div v-if="available.length > 1" class="mb-2 flex flex-wrap gap-1">
        <button
          type="button"
          class="rounded px-2 py-0.5 text-xs"
          :class="chipClass(!filterActive)"
          @click="filter = 'all'"
        >
          все <span class="opacity-60">{{ items.length }}</span>
        </button>

        <button
          v-for="group in available"
          :key="group.key"
          type="button"
          class="rounded px-2 py-0.5 text-xs"
          :class="chipClass(filter === group.key)"
          @click="filter = group.key"
        >
          {{ LABELS[group.key] }} <span class="opacity-60">{{ group.count }}</span>
        </button>
      </div>

      <p v-if="visible.length === 0" class="text-sm text-stone-500">Ничего подходящего.</p>

      <ul v-else class="space-y-2">
        <li v-for="(item, index) in visible" :key="item.id ?? index">
          <ItemCard :item="item">
            <template #actions>
              <slot name="actions" :item="item" :index="index" />
            </template>

            <!-- Правый край карточки: в магазине это продажа. -->
            <template v-if="$slots['actions-end']" #actions-end>
              <slot name="actions-end" :item="item" :index="index" />
            </template>
          </ItemCard>
        </li>
      </ul>
    </template>
  </section>
</template>
