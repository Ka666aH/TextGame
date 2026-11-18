<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { isApiError, messageForError } from '../api/errors'
import type { CreateSessionPayload } from '../api/sessions'
import type { Session } from '../api/types'
import { MAX_NAME_LENGTH } from '../api/labels'
import { formatDateTime, formatSeed, newestFirst } from '../lib/format'
import { validateOptionalName, validateSeed } from '../lib/validation'
import { useMeQuery } from '../queries/auth'
import {
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useSelectSessionMutation,
  useSessionsQuery,
} from '../queries/sessions'
import { useUiStore } from '../stores/ui'

const router = useRouter()
const ui = useUiStore()

const { data: me } = useMeQuery()
const {
  data: sessionsData,
  isPending: sessionsPending,
  isError: sessionsFailed,
} = useSessionsQuery()

const createMutation = useCreateSessionMutation()
const selectMutation = useSelectSessionMutation()
const deleteMutation = useDeleteSessionMutation()

const creating = createMutation.isPending
const busyId = ref<string | null>(null)

const form = reactive({ name: '', seed: '' })
const errors = reactive<{ name: string | null; seed: string | null }>({ name: null, seed: null })

const activeId = computed(() => me.value?.sessionId ?? null)

/** Порядок сервер не гарантирует — сортируем сами, свежие сверху. */
const sessions = computed<Session[]>(() => newestFirst(sessionsData.value ?? []))

const isEmpty = computed(() => !sessionsPending.value && sessions.value.length === 0)

function reportError(error: unknown, fallback: string): void {
  ui.notify(isApiError(error) ? messageForError(error) : fallback)
}

async function handleCreate(): Promise<void> {
  errors.name = validateOptionalName(form.name)
  errors.seed = validateSeed(form.seed)
  if (errors.name !== null || errors.seed !== null) return

  // Пустые поля не отправляем вовсе: сервер сохранил бы пустое имя
  // вместо «НОВАЯ ИГРА», потому что использует `??`.
  const payload: CreateSessionPayload = {}
  const name = form.name.trim()
  const seed = form.seed.trim()
  if (name.length > 0) payload.sessionName = name
  if (seed.length > 0) payload.seed = seed

  try {
    await createMutation.mutateAsync(payload)
  } catch (error) {
    reportError(error, 'Не удалось создать игру.')
    return
  }

  form.name = ''
  form.seed = ''
  await router.push({ name: 'game' })
}

async function handleSelect(session: Session): Promise<void> {
  busyId.value = session.id
  try {
    await selectMutation.mutateAsync(session.id)
  } catch (error) {
    reportError(error, 'Не удалось выбрать игру.')
    return
  } finally {
    busyId.value = null
  }

  await router.push({ name: 'game' })
}

async function handleDelete(session: Session): Promise<void> {
  const confirmed = await ui.confirm(
    'Удалить игру?',
    `«${session.name}» исчезнет вместе с сохранениями. Отменить это нельзя.`,
  )
  if (!confirmed) return

  busyId.value = session.id
  try {
    await deleteMutation.mutateAsync(session.id)
  } catch (error) {
    reportError(error, 'Не удалось удалить игру.')
  } finally {
    busyId.value = null
  }

  // Удалять активную сессию не запрещено: сервер снимет claim сам,
  // а `me` после инвалидации покажет «игры нет».
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-xl font-semibold">Игровые сессии</h1>
      <p class="mt-1 text-sm text-stone-400">
        Каждая сессия — отдельное подземелье. Активная в каждый момент одна.
      </p>
    </header>

    <form
      class="flex flex-wrap items-end gap-3 rounded border border-stone-800 bg-stone-900/60 p-4"
      @submit.prevent="handleCreate"
    >
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-stone-300">
          Название <span class="text-stone-500">(необязательно)</span>
        </span>
        <input
          v-model="form.name"
          type="text"
          :maxlength="MAX_NAME_LENGTH"
          placeholder="НОВАЯ ИГРА"
          class="w-56 rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm outline-none focus:border-stone-500"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm">
        <span class="text-stone-300">
          Seed <span class="text-stone-500">(необязательно)</span>
        </span>
        <input
          v-model="form.seed"
          type="text"
          inputmode="numeric"
          placeholder="случайный"
          class="w-48 rounded border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-sm outline-none focus:border-stone-500"
        />
      </label>

      <button
        type="submit"
        class="rounded bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-white disabled:opacity-50"
        :disabled="creating"
      >
        {{ creating ? 'Создаю…' : 'Создать игру' }}
      </button>

      <p v-if="errors.name" class="w-full text-xs text-red-400">{{ errors.name }}</p>
      <p v-if="errors.seed" class="w-full text-xs text-red-400">{{ errors.seed }}</p>
    </form>

    <p v-if="sessionsPending" class="text-sm text-stone-400">Загружаю сессии…</p>
    <p v-else-if="sessionsFailed" class="text-sm text-red-400">Не удалось загрузить сессии.</p>
    <p v-else-if="isEmpty" class="text-sm text-stone-400">Игр пока нет. Создай первую.</p>

    <ul v-else class="space-y-2">
      <li
        v-for="session in sessions"
        :key="session.id"
        class="flex flex-wrap items-center gap-3 rounded border border-stone-800 bg-stone-900/60 px-4 py-3"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm text-stone-100">{{ session.name || 'Без названия' }}</p>
          <p class="text-xs text-stone-500">
            создана {{ formatDateTime(session.createdAt) }} · сид
            <span class="font-mono">{{ formatSeed(session.seed) }}</span>
          </p>
        </div>

        <span
          v-if="session.id === activeId"
          class="rounded bg-emerald-900/60 px-2 py-0.5 text-xs text-emerald-200"
        >
          активная
        </span>

        <button
          type="button"
          class="rounded border border-stone-700 px-3 py-1 text-sm text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-50"
          :disabled="busyId === session.id"
          @click="handleSelect(session)"
        >
          Играть
        </button>

        <button
          type="button"
          class="rounded border border-red-900 px-3 py-1 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
          :disabled="busyId === session.id"
          @click="handleDelete(session)"
        >
          Удалить
        </button>
      </li>
    </ul>
  </section>
</template>
