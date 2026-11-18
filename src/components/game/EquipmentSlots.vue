<script setup lang="ts">
import { itemNumber } from '../../api/items'
import type { InventoryItem } from '../../api/types'
import EntityArt from '../common/EntityArt.vue'

defineProps<{
  weapon: InventoryItem
  helm: InventoryItem | null
  chestplate: InventoryItem | null
}>()

function describe(item: InventoryItem, key: 'damage' | 'damageBlock'): string {
  const value = itemNumber(item, key)
  return value === null ? item.name : `${item.name} (${value})`
}
</script>

<template>
  <section class="rounded border border-stone-800 bg-stone-900/40 p-3">
    <h2 class="mb-2 text-xs tracking-wide text-stone-500 uppercase">экипировка</h2>

    <div class="space-y-2">
      <div class="flex items-center gap-2 rounded border border-stone-800 bg-stone-900/50 px-3 py-2">
        <EntityArt kind="item" :name="weapon.name" size="sm" />
        <span class="text-xs tracking-wide text-stone-500 uppercase">оружие</span>
        <span class="flex-1 truncate text-sm text-stone-100">{{ describe(weapon, 'damage') }}</span>
        <slot name="weapon-actions" />
      </div>

      <div class="flex items-center gap-2 rounded border border-stone-800 bg-stone-900/50 px-3 py-2">
        <EntityArt kind="item" :name="helm?.name ?? ''" size="sm" />
        <span class="text-xs tracking-wide text-stone-500 uppercase">шлем</span>
        <span class="flex-1 truncate text-sm" :class="helm ? 'text-stone-100' : 'text-stone-600'">
          {{ helm ? describe(helm, 'damageBlock') : 'не надет' }}
        </span>
        <slot name="helm-actions" />
      </div>

      <div class="flex items-center gap-2 rounded border border-stone-800 bg-stone-900/50 px-3 py-2">
        <EntityArt kind="item" :name="chestplate?.name ?? ''" size="sm" />
        <span class="text-xs tracking-wide text-stone-500 uppercase">нагрудник</span>
        <span
          class="flex-1 truncate text-sm"
          :class="chestplate ? 'text-stone-100' : 'text-stone-600'"
        >
          {{ chestplate ? describe(chestplate, 'damageBlock') : 'не надет' }}
        </span>
        <slot name="chestplate-actions" />
      </div>
    </div>
  </section>
</template>
