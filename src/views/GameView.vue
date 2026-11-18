<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { isApiError, messageForError } from '../api/errors'
import { outcomeOf } from '../api/outcome'
import EquipmentSlots from '../components/game/EquipmentSlots.vue'
import InventoryList from '../components/game/InventoryList.vue'
import RoomPanel from '../components/game/RoomPanel.vue'
import StatBar from '../components/game/StatBar.vue'
import { useStateQuery } from '../queries/game'

const router = useRouter()

const { data: info, isPending, isError, error } = useStateQuery()

/**
 * Признака «игра окончена» сервер не передаёт: ни в одном DTO его нет.
 * Поэтому исход выводим сами (ADR 0004) и уходим на отдельный экран.
 */
watchEffect(() => {
  const current = info.value
  if (current !== undefined && outcomeOf(current) !== 'playing') {
    void router.replace({ name: 'gameOver' })
  }
})

const errorText = computed(() => {
  const cause = error.value
  return isApiError(cause) ? messageForError(cause) : 'Повтори попытку позже.'
})
</script>

<template>
  <p v-if="isPending" class="text-sm text-stone-400">Загружаю состояние…</p>

  <section
    v-else-if="isError"
    class="rounded border border-red-900 bg-red-950/40 p-4 text-sm text-red-200"
  >
    <p>Не удалось загрузить состояние игры.</p>
    <p class="mt-2 text-xs opacity-80">{{ errorText }}</p>
  </section>

  <div v-else-if="info" class="space-y-4">
    <StatBar :info="info" />

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="space-y-4">
        <RoomPanel :room="info.room" />
      </div>

      <div class="space-y-4">
        <EquipmentSlots :weapon="info.weapon" :helm="info.helm" :chestplate="info.chestplate" />
        <InventoryList :items="info.inventory" />
      </div>
    </div>
  </div>
</template>
