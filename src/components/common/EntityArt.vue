<script setup lang="ts">
import { computed } from 'vue'

import { monogram, type ArtKind } from '../../lib/art'

const props = withDefaults(
  defineProps<{
    kind: ArtKind
    name: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

/**
 * Единственное место, где сущность рисуется. Сейчас — монограмма в рамке;
 * когда появятся спрайты, заменится только разметка внутри, а `kind` и `name`
 * останутся теми же. Поэтому экраны никогда не передают сюда картинку.
 */
const tone = computed(() => {
  switch (props.kind) {
    case 'enemy':
      return 'border-red-900/70 bg-red-950/40 text-red-200'
    case 'item':
      return 'border-amber-900/70 bg-amber-950/30 text-amber-200'
    case 'player':
      return 'border-emerald-900/70 bg-emerald-950/30 text-emerald-200'
    default:
      return 'border-stone-700 bg-stone-900 text-stone-200'
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8 text-sm'
    case 'lg':
      return 'h-14 w-14 text-xl'
    default:
      return 'h-10 w-10 text-base'
  }
})

const letter = computed(() => monogram(props.name))
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-center rounded border font-mono leading-none"
    :class="[tone, sizeClass]"
    role="img"
    :aria-label="name"
  >
    {{ letter }}
  </span>
</template>
