<script setup lang="ts">
import { computed } from 'vue'

import { itemNumber, kindLabel } from '../../api/items'
import type { InventoryItem } from '../../api/types'
import EntityArt from '../common/EntityArt.vue'

const props = defineProps<{ item: InventoryItem }>()

const label = computed(() => kindLabel(props.item))

/**
 * Числовые характеристики, которых у предмета может и не быть.
 *
 * У лечения две разные величины, и называть обе «лечением» нельзя:
 * `maxHealthBoost` поднимает предел здоровья, `currentHealthBoost` лечит
 * текущее. Поэтому подписи разные, а нули не показываем.
 */
const stats = computed<string[]>(() => {
  const rows: string[] = []

  const damage = itemNumber(props.item, 'damage')
  if (damage !== null) rows.push(`урон ${damage}`)

  const block = itemNumber(props.item, 'damageBlock')
  if (block !== null) rows.push(`блок ${block}`)

  const durability = itemNumber(props.item, 'durability')
  if (durability !== null) rows.push(`прочность ${durability}`)

  const maxBoost = itemNumber(props.item, 'maxHealthBoost')
  if (maxBoost !== null && maxBoost > 0) rows.push(`предел здоровья +${maxBoost}`)

  const currentBoost = itemNumber(props.item, 'currentHealthBoost')
  if (currentBoost !== null && currentBoost > 0) rows.push(`здоровье +${currentBoost}`)

  const cost = itemNumber(props.item, 'cost')
  if (cost !== null) rows.push(`цена ${cost}`)

  return rows
})
</script>

<template>
  <div class="rounded border border-stone-800 bg-stone-900/50 px-3 py-2">
    <div class="flex items-start gap-3">
      <EntityArt kind="item" :name="item.name" />

      <div class="min-w-0 flex-1">
        <p class="text-sm break-words text-stone-100">{{ item.name }}</p>
        <p class="text-xs text-stone-500">
          {{ label }}
          <span v-for="row in stats" :key="row"> · {{ row }}</span>
        </p>
      </div>
    </div>

    <!-- Действия встают отдельной строкой: в узкой колонке три кнопки
         сжимали название предмета до многоточия. -->
    <div v-if="$slots.actions" class="mt-2 flex flex-wrap gap-2 empty:hidden">
      <slot name="actions" />
    </div>
  </div>
</template>
