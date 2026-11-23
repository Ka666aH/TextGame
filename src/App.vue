<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import AppHeader from './components/common/AppHeader.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import ToastHost from './components/common/ToastHost.vue'
import { useMeQuery } from './queries/auth'

const { data: me } = useMeQuery()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface text-ink">
    <AppHeader v-if="me" />

    <main class="mx-auto w-full max-w-7xl px-4 py-6">
      <RouterView />
    </main>

    <!--
      Подвал со служебными страницами. Авторы иконок должны быть доступны
      с любого экрана — и до входа тоже, поэтому подвал не зависит от `me`,
      в отличие от шапки.
    -->
    <footer
      class="mx-auto mt-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-6 text-xs text-muted-dim"
    >
      <span>Подземелье</span>

      <nav class="ml-auto flex gap-4">
        <RouterLink to="/credits" class="underline hover:text-ink">Иконки</RouterLink>
      </nav>
    </footer>

    <ToastHost />
    <ConfirmDialog />
  </div>
</template>
