<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { CODE } from '../api/codes'
import { isApiError, messageForError } from '../api/errors'
import { MAX_NAME_LENGTH } from '../api/labels'
import type { CreateSavePayload } from '../api/saves'
import type { Save } from '../api/types'
import { formatDateTime, newestFirst } from '../lib/format'
import { validateOptionalName } from '../lib/validation'
import { queryClient } from '../queries/client'
import { stateQueryOptions } from '../queries/game'
import { queryKeys } from '../queries/keys'
import {
  useCreateSaveMutation,
  useDeleteSaveMutation,
  useLoadSaveMutation,
  useSavesQuery,
} from '../queries/saves'
import { useUiStore } from '../stores/ui'

const router = useRouter()
const ui = useUiStore()

const { data: savesData, isPending: savesPending, isError: savesFailed } = useSavesQuery()

const createMutation = useCreateSaveMutation()
const loadMutation = useLoadSaveMutation()
const deleteMutation = useDeleteSaveMutation()

const saving = createMutation.isPending
const busyId = ref<string | null>(null)

const form = reactive({ name: '' })
const nameError = ref<string | null>(null)

const saves = computed<Save[]>(() => newestFirst(savesData.value ?? []))
const isEmpty = computed(() => !savesPending.value && saves.value.length === 0)

onMounted(() => {
  // `POST /saves` берёт состояние из Redis, а `GET /state` как раз кладёт его
  // туда (`SessionProvider.GetAsync`). Без прогрева сохранение сразу после
  // переключения на сессию ответило бы `404 SESSION_NOT_FOUND`, хотя игра
  // на экране есть: Redis пуст, потому что игровой экран ещё не открывали.
  void queryClient.ensureQueryData(stateQueryOptions()).catch(() => undefined)
})

function reportError(error: unknown, fallback: string): void {
  if (!isApiError(error)) {
    ui.notify(fallback)
    return
  }

  // Сохранение читает состояние из Redis напрямую, поэтому после долгого
  // простоя сервер честно сообщает, что состояния больше нет. Это не logout.
  if (error.code === CODE.sessionNotFound) {
    ui.notify('Состояние игры устарело. Открой игру заново и повтори.')
    void queryClient.invalidateQueries({ queryKey: queryKeys.state })
    return
  }

  ui.notify(messageForError(error))
}

async function handleCreate(): Promise<void> {
  nameError.value = validateOptionalName(form.name)
  if (nameError.value !== null) return

  const payload: CreateSavePayload = {}
  const name = form.name.trim()
  if (name.length > 0) payload.saveName = name

  try {
    await createMutation.mutateAsync(payload)
    form.name = ''
    ui.notify('Сохранение создано.', 'success')
  } catch (error) {
    reportError(error, 'Не удалось сохранить игру.')
  }
}

async function handleLoad(save: Save): Promise<void> {
  busyId.value = save.id
  try {
    await loadMutation.mutateAsync(save.id)
  } catch (error) {
    reportError(error, 'Не удалось загрузить сохранение.')
    return
  } finally {
    busyId.value = null
  }

  await router.push({ name: 'game' })
}

async function handleDelete(save: Save): Promise<void> {
  const confirmed = await ui.confirm('Удалить сохранение?', `«${save.name}» будет удалено.`)
  if (!confirmed) return

  busyId.value = save.id
  try {
    await deleteMutation.mutateAsync(save.id)
  } catch (error) {
    // В том числе 403 IMPOSSIBLE_DELETE_SAVE — это нормальный ответ.
    reportError(error, 'Не удалось удалить сохранение.')
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-xl font-semibold">Сохранения</h1>
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
          placeholder="РУЧНОЕ СОХРАНЕНИЕ"
          class="w-64 rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm outline-none focus:border-stone-500"
        />
      </label>

      <button
        type="submit"
        class="rounded bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-white disabled:opacity-50"
        :disabled="saving"
      >
        {{ saving ? 'Сохраняю…' : 'Сохранить игру' }}
      </button>

      <p v-if="nameError" class="w-full text-xs text-red-400">{{ nameError }}</p>
    </form>

    <p v-if="savesPending" class="text-sm text-stone-400">Загружаю сохранения…</p>
    <p v-else-if="savesFailed" class="text-sm text-red-400">Не удалось загрузить сохранения.</p>
    <p v-else-if="isEmpty" class="text-sm text-stone-400">Сохранений пока нет.</p>

    <ul v-else class="space-y-2">
      <li
        v-for="save in saves"
        :key="save.id"
        class="flex flex-wrap items-center gap-3 rounded border border-stone-800 bg-stone-900/60 px-4 py-3"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm text-stone-100">{{ save.name || 'Без названия' }}</p>
          <p class="text-xs text-stone-500">
            комната {{ save.room }} · {{ formatDateTime(save.createdAt) }}
          </p>
        </div>

        <button
          type="button"
          class="rounded border border-stone-700 px-3 py-1 text-sm text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-50"
          :disabled="busyId === save.id"
          @click="handleLoad(save)"
        >
          Загрузить
        </button>

        <button
          type="button"
          class="rounded border border-red-900 px-3 py-1 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
          :disabled="busyId === save.id"
          @click="handleDelete(save)"
        >
          Удалить
        </button>
      </li>
    </ul>
  </section>
</template>
