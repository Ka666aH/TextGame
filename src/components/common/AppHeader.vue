<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { isApiError, messageForError } from '../../api/errors'
import { useLogoutMutation, useMeQuery } from '../../queries/auth'
import { useUiStore } from '../../stores/ui'

const router = useRouter()
const ui = useUiStore()
const { data: me } = useMeQuery()

const logoutMutation = useLogoutMutation()
const logoutPending = logoutMutation.isPending

const login = computed(() => me.value?.login ?? '')
const sessionName = computed(() => me.value?.sessionName ?? 'Игра не выбрана')
const hasSession = computed(() => Boolean(me.value?.sessionId))

async function handleLogout(): Promise<void> {
  const confirmed = await ui.confirm('Выйти из аккаунта?', 'Куки будут удалены на сервере.')
  if (!confirmed) return

  try {
    await logoutMutation.mutateAsync()
  } catch (error) {
    ui.notify(isApiError(error) ? messageForError(error) : 'Не удалось выйти из аккаунта.')
  }

  // Даже если сервер ответил ошибкой, локальные куки уже бесполезны.
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="border-b border-stone-800 bg-stone-900/80">
    <div
      class="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm"
    >
      <span class="font-mono text-stone-200">{{ login }}</span>
      <span class="text-stone-500">{{ sessionName }}</span>

      <nav class="ml-auto flex items-center gap-4">
        <RouterLink v-if="hasSession" to="/game" class="text-stone-300 hover:text-white">
          Игра
        </RouterLink>
        <RouterLink to="/sessions" class="text-stone-300 hover:text-white">Сессии</RouterLink>
        <RouterLink v-if="hasSession" to="/saves" class="text-stone-300 hover:text-white">
          Сохранения
        </RouterLink>
        <button
          type="button"
          class="rounded border border-stone-700 px-3 py-1 text-stone-300 hover:border-stone-500 hover:text-white disabled:opacity-50"
          :disabled="logoutPending"
          @click="handleLogout"
        >
          Выйти
        </button>
      </nav>
    </div>
  </header>
</template>
