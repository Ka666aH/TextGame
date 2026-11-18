<script setup lang="ts">
import { RouterView } from 'vue-router'

import AppHeader from './components/common/AppHeader.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import ToastHost from './components/common/ToastHost.vue'
import { useMeQuery } from './queries/auth'

const { data: me } = useMeQuery()
</script>

<template>
  <div class="min-h-screen bg-stone-950 text-stone-100">
    <AppHeader v-if="me" />

    <main class="mx-auto w-full max-w-5xl px-4 py-6">
      <RouterView />
    </main>

    <ToastHost />
    <ConfirmDialog />
  </div>
</template>
