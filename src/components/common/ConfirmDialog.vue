<script setup lang="ts">
import { useUiStore } from '../../stores/ui'

const ui = useUiStore()
</script>

<template>
  <div
    v-if="ui.confirmVisible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-sm rounded border border-stone-700 bg-stone-900 p-5">
      <h2 class="text-lg font-semibold">{{ ui.confirmTitle }}</h2>
      <p v-if="ui.confirmText" class="mt-2 text-sm text-stone-300">{{ ui.confirmText }}</p>

      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          class="rounded border border-stone-700 px-3 py-1 text-sm text-stone-300 hover:border-stone-500 hover:text-white"
          @click="ui.answerConfirm(false)"
        >
          Отмена
        </button>
        <button
          type="button"
          class="rounded border border-red-800 bg-red-900/60 px-3 py-1 text-sm text-red-50 hover:bg-red-900"
          @click="ui.answerConfirm(true)"
        >
          Да
        </button>
      </div>
    </div>
  </div>
</template>
