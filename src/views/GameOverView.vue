<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { isApiError, messageForError } from '../api/errors'
import { outcomeOf } from '../api/outcome'
import type { GameOver } from '../api/types'
import { queryClient } from '../queries/client'
import { useStateQuery } from '../queries/game'
import { queryKeys } from '../queries/keys'

const router = useRouter()

const { data: info, isPending, isError, error } = useStateQuery()

/**
 * Текст исхода приходит только в ответе на действие: сервер его нигде не
 * хранит и после перезагрузки не отдаёт. Поэтому читаем разово из кэша —
 * значение не меняется, пока экран открыт.
 */
const snapshot = queryClient.getQueryData<GameOver>(queryKeys.gameOver) ?? null

const outcome = computed(() => (info.value !== undefined ? outcomeOf(info.value) : 'playing'))

// Если партия ещё идёт, экран исхода бессмысленен.
watchEffect(() => {
  if (info.value !== undefined && outcomeOf(info.value) === 'playing') {
    void router.replace({ name: 'game' })
  }
})

const heading = computed(() => {
  if (outcome.value === 'won') return 'Выход найден'
  if (outcome.value === 'lost') return 'Вы погибли'
  return 'Партия окончена'
})

const message = computed(() => {
  if (snapshot !== null) return snapshot.message
  if (outcome.value === 'won') return 'Вы выбрались из подземелья.'
  if (outcome.value === 'lost') return 'Подземелье оказалось сильнее.'
  return 'Партия завершена.'
})

const tone = computed(() =>
  outcome.value === 'won'
    ? 'border-emerald-900 bg-emerald-950/30 text-emerald-100'
    : 'border-red-900 bg-red-950/30 text-red-100',
)

const errorText = computed(() => {
  const cause = error.value
  return isApiError(cause) ? messageForError(cause) : 'Повтори попытку позже.'
})

async function goTo(name: 'sessions' | 'saves'): Promise<void> {
  await router.push({ name })
}
</script>

<template>
  <p v-if="isPending" class="text-sm text-stone-400">Загружаю итог партии…</p>

  <section
    v-else-if="isError"
    class="rounded border border-red-900 bg-red-950/40 p-4 text-sm text-red-200"
  >
    <p>Не удалось загрузить итог партии.</p>
    <p class="mt-2 text-xs opacity-80">{{ errorText }}</p>
  </section>

  <section v-else class="space-y-4">
    <div class="rounded border p-6" :class="tone">
      <h1 class="text-2xl font-semibold">{{ heading }}</h1>
      <p class="mt-2 text-sm opacity-90">{{ message }}</p>
    </div>

    <div v-if="info" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded border border-stone-800 bg-stone-900/60 px-4 py-3">
        <p class="text-xs tracking-wide text-stone-500 uppercase">комната</p>
        <p class="mt-1 font-mono text-stone-100">{{ info.room.number }}</p>
      </div>
      <div class="rounded border border-stone-800 bg-stone-900/60 px-4 py-3">
        <p class="text-xs tracking-wide text-stone-500 uppercase">здоровье</p>
        <p class="mt-1 font-mono text-stone-100">
          {{ info.currentHealth }}/{{ info.maxHealth }}
        </p>
      </div>
      <div class="rounded border border-stone-800 bg-stone-900/60 px-4 py-3">
        <p class="text-xs tracking-wide text-stone-500 uppercase">монеты</p>
        <p class="mt-1 font-mono text-stone-100">{{ info.coins }}</p>
      </div>
      <div class="rounded border border-stone-800 bg-stone-900/60 px-4 py-3">
        <p class="text-xs tracking-wide text-stone-500 uppercase">ключи</p>
        <p class="mt-1 font-mono text-stone-100">{{ info.keys }}</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      <button
        type="button"
        class="rounded bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-white"
        @click="goTo('sessions')"
      >
        Новая игра
      </button>

      <button
        type="button"
        class="rounded border border-stone-700 px-4 py-2 text-sm text-stone-200 hover:border-stone-500 hover:text-white"
        @click="goTo('saves')"
      >
        Загрузить сохранение
      </button>
    </div>

    <p class="text-xs text-stone-500">
      Начать заново можно двумя способами: новая игра создаёт другое подземелье, а загрузка
      начального сохранения возвращает в то же самое.
    </p>
  </section>
</template>
