<script setup lang="ts">
import type { BattleLog, Enemy } from '../../api/types'
import { battleLogLine } from '../../lib/battle'
import EntityArt from '../common/EntityArt.vue'

defineProps<{
  enemy: Enemy
  log: readonly BattleLog[]
  disabled: boolean
}>()

const emit = defineEmits<{ attack: [] }>()
</script>

<template>
  <section class="rounded border border-red-900/60 bg-red-950/20 p-4">
    <div class="flex items-start gap-3">
      <EntityArt kind="enemy" :name="enemy.name" size="lg" />

      <div class="min-w-0 flex-1">
        <h2 class="text-lg font-semibold text-red-100">{{ enemy.name }}</h2>
        <p class="mt-1 text-sm text-stone-300">{{ enemy.description }}</p>

        <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
          <span>
            здоровье <span class="font-mono text-stone-100">{{ enemy.health }}</span>
          </span>
          <span> урон <span class="font-mono text-stone-100">{{ enemy.damage }}</span> </span>
          <span> блок <span class="font-mono text-stone-100">{{ enemy.damageBlock }}</span> </span>
        </p>
      </div>
    </div>

    <div class="mt-4">
      <button
        type="button"
        class="rounded bg-red-800 px-4 py-2 text-sm font-medium text-red-50 hover:bg-red-700 disabled:opacity-40"
        :disabled="disabled"
        @click="emit('attack')"
      >
        Бить
      </button>
    </div>

    <ol
      v-if="log.length > 0"
      class="mt-4 space-y-1 border-t border-red-900/40 pt-3 font-mono text-xs text-stone-300"
      aria-live="polite"
    >
      <li v-for="(entry, index) in log" :key="index">{{ battleLogLine(entry) }}</li>
    </ol>
  </section>
</template>
