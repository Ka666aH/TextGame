<script setup lang="ts">
import { computed } from 'vue'

import { itemNumber, kindLabel } from '../../api/items'
import type { InventoryItem } from '../../api/types'
import EntityArt from '../common/EntityArt.vue'

const props = defineProps<{ item: InventoryItem }>()

const label = computed(() => kindLabel(props.item))

/** Числовые характеристики, которых у предмета может и не быть. */
const stats = computed<string[]>(() => {
  const rows: string[] = []

  const damage = itemNumber(props.item, 'damage')
  if (damage !== null) rows.push(`урон ${damage}`)

  const block = itemNumber(props.item, 'damageBlock')
  if (block !== null) rows.push(`блок ${block}`)

  const durability = itemNumber(props.item, 'durability')
  if (durability !== null) rows.push(`прочность ${durability}`)

  const maxBoost = itemNumber(props.item, 'maxHealthBoost')
  const currentBoost = itemNumber(props.item, 'currentHealthBoost')
  if (maxBoost !== null || currentBoost !== null) {
    rows.push(`лечение ${maxBoost ?? 0}/${currentBoost ?? 0}`)
  }

  const cost = itemNumber(props.item, 'cost')
  if (cost !== null) rows.push(`цена ${cost}`)

  return rows
})
</script>

<template>
  <div class="flex items-start gap-3 rounded border border-stone-800 bg-stone-900/50 px-3 py-2">
    <EntityArt kind="item" :name="item.name" />

    <div class="min-w-0 flex-1">
      <p class="truncate text-sm text-stone-100">{{ item.name }}</p>
      <p class="text-xs text-stone-500">
        {{ label }}
        <span v-for="row in stats" :key="row"> · {{ row }}</span>
      </p>
    </div>

    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap justify-end gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
