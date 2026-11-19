<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { isApiError, messageForError } from '../../api/errors'
import { fetchMap } from '../../api/game'
import { isGameOver } from '../../api/guards'
import type { MapRoom } from '../../api/types'
import { runGameAction, useGameBusy } from '../../composables/game'
import { useGoToRoomMutation } from '../../queries/game'
import { queryKeys } from '../../queries/keys'

const props = defineProps<{ open: boolean; currentNumber: number; inBattle: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const router = useRouter()
const { busy } = useGameBusy()
const goToRoomMutation = useGoToRoomMutation()

// Карта запрашивается только когда модалка открыта: без предмета «КАРТА»
// сервер ответит `403 NO_MAP_ERROR`, и дёргать его заранее незачем.
const enabled = computed(() => props.open)
const mapQuery = useQuery({
  queryKey: queryKeys.map,
  queryFn: fetchMap,
  enabled,
})

const rooms = computed<MapRoom[]>(() => mapQuery.data.value ?? [])

const errorText = computed(() => {
  const cause = mapQuery.error.value
  return isApiError(cause) ? messageForError(cause) : null
})

function close(): void {
  emit('update:open', false)
}

/**
 * Модалка должна быть управляемой с клавиатуры: `Esc` закрывает, фокус
 * уходит внутрь при открытии и возвращается на кнопку, которая её открыла,
 * а `Tab` не выходит за пределы диалога.
 */
const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function focusableItems(): HTMLElement[] {
  if (dialog.value === null) return []
  return [...dialog.value.querySelectorAll<HTMLElement>('button:not(:disabled)')]
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return

  const items = focusableItems()
  const first = items[0]
  const last = items[items.length - 1]
  if (first === undefined || last === undefined) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
    return
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      window.removeEventListener('keydown', onKeydown)
      previouslyFocused?.focus()
      previouslyFocused = null
      return
    }

    const active = document.activeElement
    previouslyFocused = active instanceof HTMLElement ? active : null
    window.addEventListener('keydown', onKeydown)

    await nextTick()
    closeButton.value?.focus()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

async function travel(room: MapRoom): Promise<void> {
  // В бою сервер отвечает `403 IN_BATTLE`: и `POST /state/rooms`, и `PUT
  // /state/rooms/current` закрыты, пока жив враг. Смотреть карту при этом
  // можно, поэтому недоступны только сами переходы.
  if (room.number === props.currentNumber || props.inBattle) return

  // Неоткрытая комната вернёт `403 UNDISCOVERED_ROOM_ERROR`: карта показывает
  // и такие, но пометить их нечем — сервер флага не передаёт.
  const result = await runGameAction(
    () => goToRoomMutation.mutateAsync(room.number),
    'Не удалось перейти в комнату.',
  )
  if (!result.ok) return

  close()
  if (isGameOver(result.data)) await router.push({ name: 'gameOver' })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-4"
    @click.self="close"
  >
    <div
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-title"
      class="mt-12 w-full max-w-md rounded border border-stone-700 bg-stone-900 p-4"
    >
      <div class="flex items-center justify-between gap-2">
        <h2 id="map-title" class="text-lg font-semibold">Карта</h2>
        <button
          ref="closeButton"
          type="button"
          class="text-xs text-stone-400 hover:text-white"
          @click="close"
        >
          закрыть
        </button>
      </div>

      <p v-if="errorText" class="mt-3 text-sm text-red-300">{{ errorText }}</p>
      <p v-else-if="mapQuery.isPending.value" class="mt-3 text-sm text-stone-400">
        Загружаю карту…
      </p>

      <ul v-else class="mt-3 max-h-96 space-y-1 overflow-y-auto">
        <li v-for="room in rooms" :key="room.number">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-stone-800 disabled:opacity-60"
            :disabled="busy || inBattle || room.number === currentNumber"
            @click="travel(room)"
          >
            <span class="w-8 shrink-0 font-mono text-xs text-stone-500">{{ room.number }}</span>
            <span
              class="flex-1 truncate"
              :class="room.number === currentNumber ? 'text-emerald-300' : 'text-stone-200'"
            >
              {{ room.name }}
            </span>
            <span v-if="room.number === currentNumber" class="text-xs text-emerald-400">
              здесь
            </span>
          </button>
        </li>
      </ul>

      <p v-if="inBattle" class="mt-3 text-xs text-amber-300">
        Идёт бой: перейти в другую комнату нельзя, пока враг жив.
      </p>

      <p class="mt-3 text-xs text-stone-500">
        Не все комнаты на карте уже исхожены: в незнакомую войти не выйдет. Стартовый зал тоже
        закрыт — вернуться в него нельзя.
      </p>
    </div>
  </div>
</template>
