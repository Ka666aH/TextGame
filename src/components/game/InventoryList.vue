<script setup lang="ts">
import type { InventoryItem } from '../../api/types'
import ItemCard from './ItemCard.vue'

defineProps<{ items: InventoryItem[] }>()
</script>

<template>
  <section class="rounded border border-stone-800 bg-stone-900/40 p-3">
    <h2 class="mb-2 text-xs tracking-wide text-stone-500 uppercase">инвентарь</h2>

    <p v-if="items.length === 0" class="text-sm text-stone-500">Пусто.</p>

    <ul v-else class="space-y-2">
      <li v-for="(item, index) in items" :key="item.id ?? index">
        <ItemCard :item="item">
          <template v-if="$slots.actions" #actions>
            <slot name="actions" :item="item" :index="index" />
          </template>
        </ItemCard>
      </li>
    </ul>
  </section>
</template>
