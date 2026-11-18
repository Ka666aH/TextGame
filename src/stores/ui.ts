import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * То, что живёт только в браузере: тосты и подтверждения.
 * Серверных данных здесь нет — они в кэше запросов (ADR 0002).
 */

export type ToastKind = 'error' | 'info' | 'success'

export interface Toast {
  id: number
  text: string
  kind: ToastKind
}

const TOAST_LIFETIME_MS = 5000

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function notify(text: string, kind: ToastKind = 'error'): void {
    const id = nextId
    nextId += 1
    toasts.value.push({ id, text, kind })
    window.setTimeout(() => dismiss(id), TOAST_LIFETIME_MS)
  }

  // Резолвер подтверждения держим вне reactive-состояния: функция внутри
  // реактивного прокси ведёт себя непредсказуемо.
  let pending: ((value: boolean) => void) | null = null
  const confirmVisible = ref(false)
  const confirmTitle = ref('')
  const confirmText = ref('')

  function confirm(title: string, text = ''): Promise<boolean> {
    confirmTitle.value = title
    confirmText.value = text
    confirmVisible.value = true
    return new Promise<boolean>((resolve) => {
      pending = resolve
    })
  }

  function answerConfirm(value: boolean): void {
    confirmVisible.value = false
    const resolve = pending
    pending = null
    resolve?.(value)
  }

  return {
    toasts,
    notify,
    dismiss,
    confirmVisible,
    confirmTitle,
    confirmText,
    confirm,
    answerConfirm,
  }
})
