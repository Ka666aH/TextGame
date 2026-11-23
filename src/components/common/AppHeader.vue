<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { isApiError, messageForError } from '../../api/errors'
import { useTheme } from '../../lib/theme'
import { useLogoutMutation, useMeQuery } from '../../queries/auth'
import { useUiStore } from '../../stores/ui'

const router = useRouter()
const ui = useUiStore()
const { data: me } = useMeQuery()
const { theme, toggleTheme } = useTheme()

const logoutMutation = useLogoutMutation()
const logoutPending = logoutMutation.isPending

const login = computed(() => me.value?.login ?? '')
const sessionName = computed(() => me.value?.sessionName ?? 'Игра не выбрана')
const hasSession = computed(() => Boolean(me.value?.sessionId))

async function handleLogout(): Promise<void> {
  const confirmed = await ui.confirm('Выйти из аккаунта?', 'Придётся войти заново.')
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
  <header class="border-b border-line bg-panel/80">
    <div
      class="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm"
    >
      <span class="font-mono text-ink-soft">{{ login }}</span>
      <span class="text-muted-dim">{{ sessionName }}</span>

      <nav class="ml-auto flex items-center gap-4">
        <RouterLink v-if="hasSession" to="/game" class="text-ink-soft hover:text-strong">
          Игра
        </RouterLink>
        <RouterLink to="/sessions" class="text-ink-soft hover:text-strong">Сессии</RouterLink>
        <RouterLink v-if="hasSession" to="/saves" class="text-ink-soft hover:text-strong">
          Сохранения
        </RouterLink>

        <button
          type="button"
          class="rounded border border-line-strong p-1.5 text-ink-soft hover:border-line-hover hover:text-strong"
          :aria-label="theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
          :title="theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
          @click="toggleTheme"
        >
          <svg
            v-if="theme === 'dark'"
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4" />
            <path d="M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>

          <svg
            v-else
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
          </svg>
        </button>

        <button
          type="button"
          class="rounded border border-line-strong px-3 py-1 text-ink-soft hover:border-line-hover hover:text-strong disabled:opacity-50"
          :disabled="logoutPending"
          @click="handleLogout"
        >
          Выйти
        </button>
      </nav>
    </div>
  </header>
</template>
