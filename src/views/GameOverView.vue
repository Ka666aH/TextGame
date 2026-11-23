<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { isApiError, messageForError } from '../api/errors'
import { resolveOutcome, type GameOutcome } from '../api/outcome'
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

const outcome = computed<GameOutcome>(() => {
  const current = info.value
  if (current === undefined) return 'playing'

  // Второй аргумент — «исход уже пришёл в ответе на действие». Без него
  // съеденный мимиком игрок считался бы живым и улетал обратно в игру.
  return resolveOutcome(current, snapshot !== null)
})

// Если партия ещё идёт, экран исхода бессмысленен. Проверка опирается на
// `outcome`, а не на голую эвристику, иначе «съеденный» игрок улетал бы
// обратно в игру, где каждое действие отвечает `403 NOT_STARTED`.
watchEffect(() => {
  if (info.value !== undefined && outcome.value === 'playing') {
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
    ? 'border-ok-line bg-ok-soft/30 text-ok-ink'
    : 'border-danger-line bg-danger-soft/30 text-danger-ink',
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
  <p v-if="isPending" class="text-sm text-muted">Загружаю итог партии…</p>

  <section
    v-else-if="isError"
    class="rounded border border-danger-line bg-danger-soft/40 p-4 text-sm text-danger-ink"
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
      <div class="rounded border border-line bg-panel/60 px-4 py-3">
        <p class="text-xs tracking-wide text-muted-dim uppercase">комната</p>
        <p class="mt-1 font-mono text-ink">{{ info.room.number }}</p>
      </div>
      <div class="rounded border border-line bg-panel/60 px-4 py-3">
        <p class="text-xs tracking-wide text-muted-dim uppercase">здоровье</p>
        <p class="mt-1 font-mono text-ink">{{ info.currentHealth }}/{{ info.maxHealth }}</p>
      </div>
      <div class="rounded border border-line bg-panel/60 px-4 py-3">
        <p class="text-xs tracking-wide text-muted-dim uppercase">монеты</p>
        <p class="mt-1 font-mono text-ink">{{ info.coins }}</p>
      </div>
      <div class="rounded border border-line bg-panel/60 px-4 py-3">
        <p class="text-xs tracking-wide text-muted-dim uppercase">ключи</p>
        <p class="mt-1 font-mono text-ink">{{ info.keys }}</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      <button
        type="button"
        class="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
        @click="goTo('sessions')"
      >
        Новая игра
      </button>

      <button
        type="button"
        class="rounded border border-line-strong px-4 py-2 text-sm text-ink-soft hover:border-line-hover hover:text-strong"
        @click="goTo('saves')"
      >
        Загрузить сохранение
      </button>
    </div>

    <p class="text-xs text-muted-dim">
      Начать заново можно двумя способами: новая игра создаёт другое подземелье, а загрузка
      начального сохранения возвращает в то же самое.
    </p>
  </section>
</template>
