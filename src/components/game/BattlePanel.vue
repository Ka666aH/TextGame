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
  <section class="rounded border border-danger-line/60 bg-danger-soft/20 p-4">
    <div class="flex items-start gap-3">
      <EntityArt kind="enemy" :name="enemy.name" size="lg" />

      <div class="min-w-0 flex-1">
        <h2 class="text-lg font-semibold text-danger-ink">{{ enemy.name }}</h2>
        <p class="mt-1 text-sm text-ink-soft">{{ enemy.description }}</p>

        <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>
            здоровье <span class="font-mono text-ink">{{ enemy.health }}</span>
          </span>
          <span>
            урон <span class="font-mono text-ink">{{ enemy.damage }}</span>
          </span>
          <span>
            блок <span class="font-mono text-ink">{{ enemy.damageBlock }}</span>
          </span>
        </p>
      </div>
    </div>

    <div class="mt-4">
      <button
        type="button"
        class="rounded bg-danger px-4 py-2 text-sm font-medium text-on-danger hover:bg-danger-strong disabled:opacity-40"
        :disabled="disabled"
        @click="emit('attack')"
      >
        Бить
      </button>
    </div>

    <ol
      v-if="log.length > 0"
      class="mt-4 space-y-1 border-t border-danger-line/40 pt-3 font-mono text-xs text-ink-soft"
      aria-live="polite"
    >
      <li v-for="(entry, index) in log" :key="index">{{ battleLogLine(entry) }}</li>
    </ol>
  </section>
</template>
