<script setup lang="ts">
import type { EquipmentSlot } from '../../api/game'
import type { InventoryItem } from '../../api/types'
import { describeStats } from '../../lib/itemText'
import EntityArt from '../common/EntityArt.vue'

defineProps<{
  weapon: InventoryItem
  helm: InventoryItem | null
  chestplate: InventoryItem | null
  disabled: boolean
}>()

const emit = defineEmits<{ unequip: [slot: EquipmentSlot] }>()

function statsOf(item: InventoryItem): string {
  return describeStats(item).join(' · ')
}
</script>

<!--
  Слот — три строки: подпись, название, характеристики. Одной строкой длинные
  названия обрезались до многоточия, и характеристика пропадала; набор
  характеристик тот же, что в инвентаре (`describeStats`).
-->
<template>
  <section class="rounded border border-line bg-panel/40 p-3">
    <h2 class="mb-2 text-xs tracking-wide text-muted-dim uppercase">экипировка</h2>

    <div class="space-y-2">
      <div class="flex items-start gap-2 rounded border border-line bg-panel/50 px-3 py-2">
        <EntityArt kind="item" :name="weapon.name" size="sm" />

        <div class="min-w-0 flex-1">
          <p class="text-[11px] tracking-wide text-muted-dim uppercase">оружие</p>
          <p class="text-sm break-words text-ink">{{ weapon.name }}</p>
          <p v-if="statsOf(weapon)" class="text-xs text-muted-dim">{{ statsOf(weapon) }}</p>
        </div>

        <button
          type="button"
          class="shrink-0 rounded border border-line-strong px-2 py-1 text-xs text-ink-soft hover:border-line-hover hover:text-strong disabled:opacity-40"
          :disabled="disabled"
          @click="emit('unequip', 'weapon')"
        >
          Снять
        </button>
      </div>

      <div class="flex items-start gap-2 rounded border border-line bg-panel/50 px-3 py-2">
        <EntityArt kind="item" :name="helm?.name ?? ''" size="sm" />

        <div class="min-w-0 flex-1">
          <p class="text-[11px] tracking-wide text-muted-dim uppercase">шлем</p>
          <p class="text-sm break-words" :class="helm ? 'text-ink' : 'text-faint'">
            {{ helm?.name ?? 'не надет' }}
          </p>
          <p v-if="helm && statsOf(helm)" class="text-xs text-muted-dim">{{ statsOf(helm) }}</p>
        </div>

        <button
          type="button"
          class="shrink-0 rounded border border-line-strong px-2 py-1 text-xs text-ink-soft hover:border-line-hover hover:text-strong disabled:opacity-40"
          :disabled="disabled || helm === null"
          @click="emit('unequip', 'helm')"
        >
          Снять
        </button>
      </div>

      <div class="flex items-start gap-2 rounded border border-line bg-panel/50 px-3 py-2">
        <EntityArt kind="item" :name="chestplate?.name ?? ''" size="sm" />

        <div class="min-w-0 flex-1">
          <p class="text-[11px] tracking-wide text-muted-dim uppercase">нагрудник</p>
          <p class="text-sm break-words" :class="chestplate ? 'text-ink' : 'text-faint'">
            {{ chestplate?.name ?? 'не надет' }}
          </p>
          <p v-if="chestplate && statsOf(chestplate)" class="text-xs text-muted-dim">
            {{ statsOf(chestplate) }}
          </p>
        </div>

        <button
          type="button"
          class="shrink-0 rounded border border-line-strong px-2 py-1 text-xs text-ink-soft hover:border-line-hover hover:text-strong disabled:opacity-40"
          :disabled="disabled || chestplate === null"
          @click="emit('unequip', 'chestplate')"
        >
          Снять
        </button>
      </div>
    </div>
  </section>
</template>
