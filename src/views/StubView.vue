<script setup lang="ts">
import { useMeQuery } from '../queries/auth'

defineProps<{ title: string }>()

const { data: me } = useMeQuery()
</script>

<template>
  <section class="rounded border border-stone-800 bg-stone-900/60 p-6">
    <h1 class="text-xl font-semibold">{{ title }}</h1>
    <p class="mt-2 text-sm text-stone-400">Экран появится в следующих блоках.</p>

    <p v-if="me" class="mt-4 text-sm text-stone-300">
      Вошёл как <span class="font-mono">{{ me.login }}</span
      >, активная игра: <span class="font-mono">{{ me.sessionName ?? 'нет' }}</span>
    </p>
  </section>
</template>
