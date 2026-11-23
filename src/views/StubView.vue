<script setup lang="ts">
import { useMeQuery } from '../queries/auth'

defineProps<{ title: string }>()

const { data: me } = useMeQuery()
</script>

<template>
  <section class="rounded border border-line bg-panel/60 p-6">
    <h1 class="text-xl font-semibold">{{ title }}</h1>
    <p class="mt-2 text-sm text-muted">Экран появится в следующих блоках.</p>

    <p v-if="me" class="mt-4 text-sm text-ink-soft">
      Вошёл как <span class="font-mono">{{ me.login }}</span
      >, активная игра: <span class="font-mono">{{ me.sessionName ?? 'нет' }}</span>
    </p>
  </section>
</template>
