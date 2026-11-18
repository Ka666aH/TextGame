<script setup lang="ts">
import { itemNumber } from '../../api/items'
import type { EquipmentSlot } from '../../api/game'
import type { InventoryItem } from '../../api/types'
import EntityArt from '../common/EntityArt.vue'

defineProps<{
  weapon: InventoryItem
  helm: InventoryItem | null
  chestplate: InventoryItem | null
  disabled: boolean
}>()

const emit = defineEmits<{ unequip: [slot: EquipmentSlot] }>()

function valueOf(item: InventoryItem, key: 'damage' | 'damageBlock'): number | null {
  return itemNumber(item, key)
}
</script>

<!--
  Слот — две строки: подпись и название с характеристикой. Одной строкой
  длинные названия обрезались до многоточия, и характеристика пропадала.
-->
<template>
  <section class="rounded border border-stone-800 bg-stone-900/40 p-3">
    <h2 class="mb-2 text-xs tracking-wide text-stone-500 uppercase">экипировка</h2>

    <div class="space-y-2">
      <div
        class="flex items-start gap-2 rounded border border-stone-800 bg-stone-900/50 px-3 py-2"
      >
        <EntityArt kind="item" :name="weapon.name" size="sm" />

        <div class="min-w-0 flex-1">
          <p class="text-[11px] tracking-wide text-stone-500 uppercase">оружие</p>
          <p class="text-sm break-words text-stone-100">
            {{ weapon.name }}
            <span v-if="valueOf(weapon, 'damage') !== null" class="font-mono text-xs text-stone-400">
              +{{ valueOf(weapon, 'damage') }}
            </span>
          </p>
        </div>

        <button
          type="button"
          class="shrink-0 rounded border border-stone-700 px-2 py-1 text-xs text-stone-300 hover:border-stone-500 hover:text-white disabled:opacity-40"
          :disabled="disabled"
          @click="emit('unequip', 'weapon')"
        >
          Снять
        </button>
      </div>

      <div
        class="flex items-start gap-2 rounded border border-stone-800 bg-stone-900/50 px-3 py-2"
      >
        <EntityArt kind="item" :name="helm?.name ?? ''" size="sm" />

        <div class="min-w-0 flex-1">
          <p class="text-[11px] tracking-wide text-stone-500 uppercase">шлем</p>
          <p class="text-sm break-words" :class="helm ? 'text-stone-100' : 'text-stone-600'">
            <template v-if="helm">
              {{ helm.name }}
              <span v-if="valueOf(helm, 'damageBlock') !== null" class="font-mono text-xs text-stone-400">
                +{{ valueOf(helm, 'damageBlock') }}
              </span>
            </template>
            <template v-else>не надет</template>
          </p>
        </div>

        <button
          type="button"
          class="shrink-0 rounded border border-stone-700 px-2 py-1 text-xs text-stone-300 hover:border-stone-500 hover:text-white disabled:opacity-40"
          :disabled="disabled || helm === null"
          @click="emit('unequip', 'helm')"
        >
          Снять
        </button>
      </div>

      <div
        class="flex items-start gap-2 rounded border border-stone-800 bg-stone-900/50 px-3 py-2"
      >
        <EntityArt kind="item" :name="chestplate?.name ?? ''" size="sm" />

        <div class="min-w-0 flex-1">
          <p class="text-[11px] tracking-wide text-stone-500 uppercase">нагрудник</p>
          <p class="text-sm break-words" :class="chestplate ? 'text-stone-100' : 'text-stone-600'">
            <template v-if="chestplate">
              {{ chestplate.name }}
              <span
                v-if="valueOf(chestplate, 'damageBlock') !== null"
                class="font-mono text-xs text-stone-400"
              >
                +{{ valueOf(chestplate, 'damageBlock') }}
              </span>
            </template>
            <template v-else>не надет</template>
          </p>
        </div>

        <button
          type="button"
          class="shrink-0 rounded border border-stone-700 px-2 py-1 text-xs text-stone-300 hover:border-stone-500 hover:text-white disabled:opacity-40"
          :disabled="disabled || chestplate === null"
          @click="emit('unequip', 'chestplate')"
        >
          Снять
        </button>
      </div>
    </div>
  </section>
</template>
