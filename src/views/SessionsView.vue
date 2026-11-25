<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { isApiError, messageForError } from '../api/errors'
import type { CreateSessionPayload } from '../api/sessions'
import type { Session } from '../api/types'
import { MAX_NAME_LENGTH } from '../api/labels'
import { formatDateTime, newestFirst } from '../lib/format'
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
    </header>

    <form
      class="flex flex-wrap items-end gap-3 rounded border border-line bg-panel/60 p-4"
      @submit.prevent="handleCreate"
    >
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-ink-soft">
          Название <span class="text-muted-dim">(необязательно)</span>
        </span>
        <input
          v-model="form.name"
          type="text"
          :maxlength="MAX_NAME_LENGTH"
          placeholder="НОВАЯ ИГРА"
          class="w-56 rounded border border-line-strong bg-panel px-3 py-2 text-sm outline-none focus:border-line-hover"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm">
        <span class="text-ink-soft">
          Seed <span class="text-muted-dim">(необязательно)</span>
        </span>
        <input
          v-model="form.seed"
          type="text"
          inputmode="numeric"
          placeholder="случайный"
          class="w-48 rounded border border-line-strong bg-panel px-3 py-2 font-mono text-sm outline-none focus:border-line-hover"
        />
      </label>

      <button
        type="submit"
        class="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
        :disabled="creating"
      >
        {{ creating ? 'Создаю…' : 'Создать игру' }}
      </button>

      <p v-if="errors.name" class="w-full text-xs text-danger-ink">{{ errors.name }}</p>
      <p v-if="errors.seed" class="w-full text-xs text-danger-ink">{{ errors.seed }}</p>
    </form>

    <p v-if="sessionsPending" class="text-sm text-muted">Загружаю сессии…</p>
    <p v-else-if="sessionsFailed" class="text-sm text-danger-ink">Не удалось загрузить сессии.</p>
    <p v-else-if="isEmpty" class="text-sm text-muted">Игр пока нет. Создай первую.</p>

    <ul v-else class="space-y-2">
      <li
        v-for="session in sessions"
        :key="session.id"
        class="flex flex-wrap items-center gap-3 rounded border border-line bg-panel/60 px-4 py-3"
      >
        <div class="min-w-0 grow basis-40">
          <p class="text-sm break-words text-ink">{{ session.name || 'Без названия' }}</p>
          <p class="text-xs text-muted-dim">
            создана {{ formatDateTime(session.createdAt) }} ·
            <span class="font-mono">сид {{ session.seed }}</span>
          </p>
        </div>

        <span
          v-if="session.id === activeId"
          class="rounded bg-ok-soft-strong/60 px-2 py-0.5 text-xs text-ok-ink"
        >
          активная
        </span>

        <!-- Действия: на телефоне отдельной строкой на всю ширину, на десктопе — справа. -->
        <div class="flex w-full shrink-0 gap-2 sm:ml-auto sm:w-auto">
          <button
            type="button"
            class="flex-1 rounded border border-line-strong px-3 py-1 text-sm text-ink-soft hover:border-line-hover hover:text-strong disabled:opacity-50 sm:flex-none"
            :disabled="busyId === session.id"
            @click="handleSelect(session)"
          >
            Играть
          </button>

          <button
            type="button"
            class="flex-1 rounded border border-danger-line px-3 py-1 text-sm text-danger-ink hover:bg-danger-soft-strong disabled:opacity-50 sm:flex-none"
            :disabled="busyId === session.id"
            @click="handleDelete(session)"
          >
            Удалить
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
