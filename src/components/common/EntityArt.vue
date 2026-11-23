<script setup lang="ts">
import { computed } from 'vue'

import { artFile, monogram, type ArtKind } from '../../lib/art'
import { useTheme } from '../../lib/theme'

const props = withDefaults(
  defineProps<{
    kind: ArtKind
    name: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const { theme } = useTheme()

/**
 * Единственное место, где сущность рисуется картинкой.
 *
 * Иконка приходит по `kind` + `name` — экраны никогда не передают путь.
 * Если для сущности рисунка нет (например, игрок), остаётся монограмма:
 * интерфейс читаем и без картинок.
 */
const source = computed(() => artFile(props.kind, props.name, theme.value))
const letter = computed(() => monogram(props.name))

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
</script>

<template>
  <span v-if="source" class="flex shrink-0 items-center justify-center" :class="sizeClass">
    <img class="h-full w-full object-contain" :src="source" :alt="name" />
  </span>

  <span
    v-else
    class="flex shrink-0 items-center justify-center rounded border border-line-strong bg-panel font-mono text-ink-soft leading-none"
    :class="sizeClass"
    role="img"
    :aria-label="name"
  >
    {{ letter }}
  </span>
</template>
