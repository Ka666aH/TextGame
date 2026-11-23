<script setup lang="ts">
import { useUiStore } from '../../stores/ui'

const ui = useUiStore()
</script>

<template>
  <div
    v-if="ui.confirmVisible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 px-4"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-sm rounded border border-line-strong bg-panel p-5">
      <h2 class="text-lg font-semibold">{{ ui.confirmTitle }}</h2>
      <p v-if="ui.confirmText" class="mt-2 text-sm text-ink-soft">{{ ui.confirmText }}</p>

      <!-- Подтверждение слева, отмена справа — как в системных диалогах. -->
      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          class="rounded border border-danger-line bg-danger px-3 py-1 text-sm text-on-danger hover:bg-danger-strong"
          @click="ui.answerConfirm(true)"
        >
          Да
        </button>
        <button
          type="button"
          class="rounded border border-line-strong px-3 py-1 text-sm text-ink-soft hover:border-line-hover hover:text-strong"
          @click="ui.answerConfirm(false)"
        >
          Отмена
        </button>
      </div>
    </div>
  </div>
</template>
