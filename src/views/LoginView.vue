<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { fieldError, isApiError, messageForError } from '../api/errors'
import { validateLoginForm, validateRegisterForm, type RegisterFormErrors } from '../lib/validation'
import { meQueryOptions, useLoginMutation, useRegisterMutation } from '../queries/auth'
import { queryClient } from '../queries/client'

type Mode = 'login' | 'register'

const router = useRouter()
const loginMutation = useLoginMutation()
const registerMutation = useRegisterMutation()

const mode = ref<Mode>('login')
const form = reactive({ login: '', password: '', confirmation: '' })
const serverError = ref<string | null>(null)
const formErrors = reactive<RegisterFormErrors>({
  login: null,
  password: null,
  confirmation: null,
})

const pending = computed(() => loginMutation.isPending.value || registerMutation.isPending.value)
const submitLabel = computed(() => (mode.value === 'login' ? 'Войти' : 'Зарегистрироваться'))

function switchMode(next: Mode): void {
  mode.value = next
  serverError.value = null
  form.confirmation = ''
  formErrors.login = null
  formErrors.password = null
  formErrors.confirmation = null
}

function applyServerError(error: unknown): void {
  if (!isApiError(error)) {
    serverError.value = 'Не удалось выполнить запрос.'
    return
  }

  // VАЛИДАЦИЯ: ключи приходят в PascalCase (`errors.Login`).
  const loginMessage = fieldError(error, 'Login', 'login')
  const passwordMessage = fieldError(error, 'Password', 'password')

  if (loginMessage !== null) formErrors.login = loginMessage
  if (passwordMessage !== null) formErrors.password = passwordMessage
  if (loginMessage === null && passwordMessage === null) {
    serverError.value = messageForError(error)
  }
}

async function submit(): Promise<void> {
  serverError.value = null

  // На входе пароль не проверяется на сложность, только на непустоту:
  // правила придуманы для регистрации. У форм разные наборы ошибок, поэтому
  // ветвление явное: тернарник даёт объединение типов, в котором
  // `confirmation` выводится как `unknown`.
  if (mode.value === 'login') {
    const errors = validateLoginForm(form.login, form.password)
    formErrors.login = errors.login
    formErrors.password = errors.password
    formErrors.confirmation = null
  } else {
    const errors = validateRegisterForm(form.login, form.password, form.confirmation)
    formErrors.login = errors.login
    formErrors.password = errors.password
    formErrors.confirmation = errors.confirmation
  }

  if (
    formErrors.login !== null ||
    formErrors.password !== null ||
    formErrors.confirmation !== null
  ) {
    return
  }

  const credentials = { login: form.login.trim(), password: form.password }

  try {
    if (mode.value === 'login') {
      await loginMutation.mutateAsync(credentials)
    } else {
      await registerMutation.mutateAsync(credentials)
    }
  } catch (error) {
    applyServerError(error)
    return
  }

  // Дальше экран выбирает `sessionId`, а не режим формы: после регистрации
  // пользователь вошёл, но игры у него ещё нет.
  const me = await queryClient.ensureQueryData(meQueryOptions())
  await router.push(me?.sessionId ? { name: 'game' } : { name: 'sessions' })
}
</script>

<template>
  <section class="mx-auto w-full max-w-sm">
    <h1 class="text-2xl font-semibold">Подземелье</h1>

    <div class="mt-6 flex gap-2 text-sm">
      <button
        type="button"
        class="rounded px-3 py-1"
        :class="mode === 'login' ? 'bg-active text-strong' : 'text-muted hover:text-strong'"
        @click="switchMode('login')"
      >
        Вход
      </button>
      <button
        type="button"
        class="rounded px-3 py-1"
        :class="mode === 'register' ? 'bg-active text-strong' : 'text-muted hover:text-strong'"
        @click="switchMode('register')"
      >
        Регистрация
      </button>
    </div>

    <form class="mt-4 space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm text-ink-soft" for="login">Логин</label>
        <input
          id="login"
          v-model="form.login"
          type="text"
          autocomplete="username"
          class="mt-1 w-full rounded border border-line-strong bg-panel px-3 py-2 text-sm outline-none focus:border-line-hover"
        />
        <p v-if="formErrors.login" class="mt-1 text-xs text-danger-ink">{{ formErrors.login }}</p>
      </div>

      <div>
        <label class="block text-sm text-ink-soft" for="password">Пароль</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          class="mt-1 w-full rounded border border-line-strong bg-panel px-3 py-2 text-sm outline-none focus:border-line-hover"
        />
        <p v-if="formErrors.password" class="mt-1 text-xs text-danger-ink">
          {{ formErrors.password }}
        </p>
        <p v-else-if="mode === 'register'" class="mt-1 text-xs text-muted-dim">
          Нужна заглавная латинская буква и цифра.
        </p>
      </div>

      <div v-if="mode === 'register'">
        <label class="block text-sm text-ink-soft" for="confirmation">Пароль ещё раз</label>
        <input
          id="confirmation"
          v-model="form.confirmation"
          type="password"
          autocomplete="new-password"
          class="mt-1 w-full rounded border border-line-strong bg-panel px-3 py-2 text-sm outline-none focus:border-line-hover"
        />
        <p v-if="formErrors.confirmation" class="mt-1 text-xs text-danger-ink">
          {{ formErrors.confirmation }}
        </p>
      </div>

      <p v-if="serverError" class="text-sm text-danger-ink" role="alert">{{ serverError }}</p>

      <button
        type="submit"
        class="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
        :disabled="pending"
      >
        {{ pending ? 'Отправляю…' : submitLabel }}
      </button>
    </form>
  </section>
</template>
