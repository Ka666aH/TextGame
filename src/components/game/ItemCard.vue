<script setup lang="ts">
import { computed } from 'vue'

import type { InventoryItem } from '../../api/types'
import { describeStats } from '../../lib/itemText'
import EntityArt from '../common/EntityArt.vue'

const props = defineProps<{ item: InventoryItem }>()

// Вид предмета в карточке не пишем: «оружие» и «лечение» уже видны по названию
// и по доступному действию, а строка отнимала место у характеристик.
const stats = computed<string[]>(() => describeStats(props.item))
</script>

<template>
  <div class="rounded border border-stone-800 bg-stone-900/50 px-3 py-2">
    <div class="flex flex-wrap items-start gap-x-3 gap-y-2">
      <EntityArt kind="item" :name="item.name" />

      <div class="min-w-0 grow basis-24">
        <p class="text-sm break-words text-stone-100">{{ item.name }}</p>
        <p v-if="stats.length > 0" class="text-xs text-stone-500">{{ stats.join(' · ') }}</p>
      </div>

      <!-- Действия идут справа от названия. Если карточке есть что разделить
           (в инвентаре справа продажа), слоты встают отдельной строкой на всю
           ширину: обычные действия слева, `actions-end` — у правого края. -->
      <div v-if="$slots['actions-end']" class="flex w-full flex-wrap items-center gap-2">
        <slot name="actions" />

        <div class="ml-auto flex flex-wrap gap-2">
          <slot name="actions-end" />
        </div>
      </div>

      <div v-else-if="$slots.actions" class="ml-auto flex shrink-0 flex-wrap gap-2 empty:hidden">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
