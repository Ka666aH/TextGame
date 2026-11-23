<script setup lang="ts">
import { useUiStore } from '../../stores/ui'

const ui = useUiStore()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    aria-live="polite"
  >
    <div
      v-for="toast in ui.toasts"
      :key="toast.id"
      class="pointer-events-auto w-full max-w-md rounded border px-4 py-3 text-sm shadow-lg"
      :class="{
        'border-danger-line bg-danger-soft text-danger-ink': toast.kind === 'error',
        'border-ok-line bg-ok-soft text-ok-ink': toast.kind === 'success',
        'border-line-strong bg-panel text-ink': toast.kind === 'info',
      }"
      role="status"
    >
      <div class="flex items-start justify-between gap-3">
        <span>{{ toast.text }}</span>
        <button
          type="button"
          class="shrink-0 text-xs opacity-70 hover:opacity-100"
          @click="ui.dismiss(toast.id)"
        >
          закрыть
        </button>
      </div>
    </div>
  </div>
</template>
