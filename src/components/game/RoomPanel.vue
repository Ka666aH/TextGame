<script setup lang="ts">
import { computed } from 'vue'

import { ROOM_KINDS } from '../../api/labels'
import type { Room } from '../../api/types'
import EntityArt from '../common/EntityArt.vue'

const props = defineProps<{ room: Room }>()

// Вид комнаты сервер отдаёт полем `kind`; имя нужно только для арта и подписи.
const isShop = computed(() => props.room.kind === ROOM_KINDS.shop)
const isExit = computed(() => props.room.kind === ROOM_KINDS.exit)
</script>

<template>
  <article class="rounded border border-line bg-panel/60 p-4">
    <div class="flex items-start gap-3">
      <EntityArt kind="room" :name="room.name" size="lg" />

      <div class="min-w-0 flex-1">
        <h2 class="flex flex-wrap items-center gap-2 text-lg font-semibold">
          {{ room.name }}
          <span
            v-if="isShop"
            class="rounded bg-warn-soft-strong/50 px-2 py-0.5 text-xs text-warn-ink"
          >
            магазин
          </span>
          <span v-if="isExit" class="rounded bg-ok-soft-strong/50 px-2 py-0.5 text-xs text-ok-ink">
            выход
          </span>
        </h2>

        <p class="mt-1 text-sm text-ink-soft">{{ room.description }}</p>
        <p class="mt-2 text-xs text-muted-dim">комната {{ room.number }}</p>
      </div>
    </div>

    <div v-if="$slots.actions" class="mt-4 flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </article>
</template>
