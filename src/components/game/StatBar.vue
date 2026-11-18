<script setup lang="ts">
import { computed } from 'vue'

import type { GameInfo } from '../../api/types'

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
</script>

<!--
  Только цифры партии: здоровье, монеты, ключи. Экипировка сознательно не
  дублируется — она живёт в колонке справа, где её можно снять.
-->
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
  </div>
</template>
