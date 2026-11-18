<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { fieldError, isApiError, messageForError } from '../api/errors'
import {
  validateLoginForm,
  validateRegisterForm,
  type RegisterFormErrors,
} from '../lib/validation'
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
  // правила придуманы для регистрации.
  const errors =
    mode.value === 'login'
      ? validateLoginForm(form.login, form.password)
      : validateRegisterForm(form.login, form.password, form.confirmation)

  formErrors.login = errors.login
  formErrors.password = errors.password
  formErrors.confirmation = 'confirmation' in errors ? errors.confirmation : null

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
    <p class="mt-1 text-sm text-stone-400">
      Вход и регистрация. Сервер узнаёт тебя по httpOnly-куке, пароль нигде не хранится.
    </p>

    <div class="mt-6 flex gap-2 text-sm">
      <button
        type="button"
        class="rounded px-3 py-1"
        :class="mode === 'login' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white'"
        @click="switchMode('login')"
      >
        Вход
      </button>
      <button
        type="button"
        class="rounded px-3 py-1"
        :class="mode === 'register' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white'"
        @click="switchMode('register')"
      >
        Регистрация
      </button>
    </div>

    <form class="mt-4 space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm text-stone-300" for="login">Логин</label>
        <input
          id="login"
          v-model="form.login"
          type="text"
          autocomplete="username"
          class="mt-1 w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm outline-none focus:border-stone-500"
        />
        <p v-if="formErrors.login" class="mt-1 text-xs text-red-400">{{ formErrors.login }}</p>
      </div>

      <div>
        <label class="block text-sm text-stone-300" for="password">Пароль</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          class="mt-1 w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm outline-none focus:border-stone-500"
        />
        <p v-if="formErrors.password" class="mt-1 text-xs text-red-400">
          {{ formErrors.password }}
        </p>
        <p v-else-if="mode === 'register'" class="mt-1 text-xs text-stone-500">
          Нужна заглавная латинская буква и цифра.
        </p>
      </div>

      <div v-if="mode === 'register'">
        <label class="block text-sm text-stone-300" for="confirmation">Пароль ещё раз</label>
        <input
          id="confirmation"
          v-model="form.confirmation"
          type="password"
          autocomplete="new-password"
          class="mt-1 w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm outline-none focus:border-stone-500"
        />
        <p v-if="formErrors.confirmation" class="mt-1 text-xs text-red-400">
          {{ formErrors.confirmation }}
        </p>
      </div>

      <p v-if="serverError" class="text-sm text-red-400" role="alert">{{ serverError }}</p>

      <button
        type="submit"
        class="w-full rounded bg-stone-200 px-3 py-2 text-sm font-medium text-stone-900 hover:bg-white disabled:opacity-50"
        :disabled="pending"
      >
        {{ pending ? 'Отправляю…' : submitLabel }}
      </button>
    </form>
  </section>
</template>
