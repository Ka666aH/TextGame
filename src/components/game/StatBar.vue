<script setup lang="ts">
import { computed } from 'vue'

import { itemNumber } from '../../api/items'
import type { GameInfo } from '../../api/types'
import EntityArt from '../common/EntityArt.vue'

const props = defineProps<{ info: GameInfo }>()

const healthPercent = computed(() => {
  if (props.info.maxHealth <= 0) return 0
  const ratio = props.info.currentHealth / props.info.maxHealth
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100)
})

const healthTone = computed(() => {
  if (healthPercent.value <= 25) return 'bg-red-600'
  if (healthPercent.value <= 60) return 'bg-amber-500'
  return 'bg-emerald-600'
})

interface EquipmentSlot {
  label: string
  name: string
  value: number | null
}

const equipment = computed<EquipmentSlot[]>(() => {
  const rows: EquipmentSlot[] = [
    {
      label: 'оружие',
      name: props.info.weapon.name,
      value: itemNumber(props.info.weapon, 'damage'),
    },
  ]

  const helm = props.info.helm
  if (helm !== null) {
    rows.push({ label: 'шлем', name: helm.name, value: itemNumber(helm, 'damageBlock') })
  }

  const chestplate = props.info.chestplate
  if (chestplate !== null) {
    rows.push({
      label: 'нагрудник',
      name: chestplate.name,
      value: itemNumber(chestplate, 'damageBlock'),
    })
  }

  return rows
})
</script>

<template>
  <div class="rounded border border-stone-800 bg-stone-900/60 px-4 py-3">
    <div class="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-xs tracking-wide text-stone-500 uppercase">здоровье</span>
        <span class="font-mono text-stone-100">{{ info.currentHealth }}/{{ info.maxHealth }}</span>
        <span class="h-2 w-32 overflow-hidden rounded bg-stone-800">
          <span
            class="block h-full transition-all"
            :class="healthTone"
            :style="{ width: healthPercent + '%' }"
          />
        </span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs tracking-wide text-stone-500 uppercase">монеты</span>
        <span class="font-mono text-stone-100">{{ info.coins }}</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs tracking-wide text-stone-500 uppercase">ключи</span>
        <span class="font-mono text-stone-100">{{ info.keys }}</span>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      <div v-for="slot in equipment" :key="slot.label" class="flex items-center gap-2">
        <EntityArt kind="item" :name="slot.name" size="sm" />
        <span class="text-xs tracking-wide text-stone-500 uppercase">{{ slot.label }}</span>
        <span class="text-sm text-stone-200">{{ slot.name }}</span>
        <span v-if="slot.value !== null" class="font-mono text-xs text-stone-400">
          {{ slot.value }}
        </span>
      </div>
    </div>
  </div>
</template>
