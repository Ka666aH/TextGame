<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { fetchMe } from '../api/auth'
import { CODE, isHttpFallbackCode } from '../api/codes'
import { isApiError, messageForError, type ApiError } from '../api/errors'
import type { EquipmentSlot } from '../api/game'
import { isBattleWin, isGameOver } from '../api/guards'
import { canEquip, canSell, canUse, hasMap, itemId } from '../api/items'
import { ROOM_NAMES } from '../api/labels'
import { outcomeOf } from '../api/outcome'
import type { Enemy, InventoryItem } from '../api/types'
import { canGoBack } from '../lib/navigation'
import { clearBattleLog, runGameAction, useBattleLog, useGameBusy } from '../composables/game'
import BattlePanel from '../components/game/BattlePanel.vue'
import DungeonMap from '../components/game/DungeonMap.vue'
import EquipmentSlots from '../components/game/EquipmentSlots.vue'
import InventoryList from '../components/game/InventoryList.vue'
import RoomItemsPanel from '../components/game/RoomItemsPanel.vue'
import RoomPanel from '../components/game/RoomPanel.vue'
import StatBar from '../components/game/StatBar.vue'
import { queryClient } from '../queries/client'
import {
  useAttackMutation,
  useEquipItemMutation,
  useGoNextRoomMutation,
  useGoToRoomMutation,
  useSellItemMutation,
  useStateQuery,
  useUnequipItemMutation,
  useUseItemMutation,
} from '../queries/game'
import { queryKeys } from '../queries/keys'
import { useUiStore } from '../stores/ui'

const router = useRouter()
const ui = useUiStore()
const { busy } = useGameBusy()
const { battleLog } = useBattleLog()

const { data: info, isPending, isError, error } = useStateQuery()

const itemUseMutation = useUseItemMutation()
const equipMutation = useEquipItemMutation()
const unequipMutation = useUnequipItemMutation()
const sellMutation = useSellItemMutation()
const nextRoomMutation = useGoNextRoomMutation()
const goToRoomMutation = useGoToRoomMutation()
const attackMutation = useAttackMutation()

const mapOpen = ref(false)

// Вид комнаты сервер не передаёт — узнаём по имени (AGENTS.md §10 п.19).
const isShop = computed(() => info.value?.room.name === ROOM_NAMES.shop)
const mapAvailable = computed(() => hasMap(info.value?.inventory ?? []))
const enemy = computed<Enemy | null>(() => info.value?.room.enemy ?? null)

// Возврат не требует карты: она нужна только для списка комнат (GET /state/map).
const canWalkBack = computed(() => canGoBack(info.value?.room.number ?? 0))

/**
 * В бою двигаться нельзя: сервер отвечает `403 IN_BATTLE` и на переход вперёд,
 * и на возврат. Кнопки держим выключенными, чтобы отказ не был штатным ответом
 * на обычное действие.
 *
 * Список предметов комнаты в бою скрыт по той же причине: обыск и «взять»
 * сервер запрещает, а содержимое могло измениться — вместо сундука в комнате
 * теперь мимик. После победы список перечитывается и возвращается на место.
 */
const inBattle = computed(() => enemy.value !== null)
/**
 * Признака «игра окончена» нет ни в одном DTO, поэтому исход выводим сами
 * (ADR 0004) и уходим на отдельный экран.
 */
watchEffect(() => {
  const current = info.value
  if (current !== undefined && outcomeOf(current) !== 'playing') {
    void router.replace({ name: 'gameOver' })
  }
})

// Журнал боя относится к текущему бою: в другой комнате он уже не актуален.
watch(
  () => info.value?.room.number,
  () => clearBattleLog(),
)

const errorText = computed(() => {
  const cause = error.value
  return isApiError(cause) ? messageForError(cause) : 'Повтори попытку позже.'
})

const failure = computed<ApiError | null>(() => (isApiError(error.value) ? error.value : null))

/**
 * Два отказа `/state`, из которых нужен выход, а не «повтори попытку».
 * Ни один DTO их не сообщает, поэтому различаем по коду ответа (§8).
 */
const sessionGone = computed(() => {
  const cause = failure.value
  if (cause === null) return false
  // Пустой `403` — policy `RequireSession`: активной игры нет.
  if (cause.status === 403 && isHttpFallbackCode(cause.code)) return true
  // `404 SESSION_NOT_FOUND` — сессию удалили, например в другой вкладке.
  return cause.status === 404 && cause.code === CODE.sessionNotFound
})

/**
 * `404 SAVE_NOT_FOUND` — у игры нет сохранений, из которых сервер поднимает
 * состояние после вытеснения из кеша. Восстанавливать нечего.
 */
const stateLost = computed(() => failure.value?.code === CODE.saveNotFound)

/**
 * Переспрашиваем, кто мы: при `401` разлогинит общий обработчик, здесь
 * ничего не делаем. Если сессии действительно нет, экран игры бессмыслен.
 */
watch(sessionGone, async (gone) => {
  if (!gone) return

  const me = await fetchMe()
  if (me === null) return

  queryClient.setQueryData(queryKeys.me, me)
  if (me.sessionId !== null) return

  ui.notify('Игра не найдена: возможно, её удалили в другой вкладке.')
  await router.replace({ name: 'sessions' })
})

async function leaveToGameOver(): Promise<void> {
  await router.push({ name: 'gameOver' })
}

async function goTo(name: 'sessions' | 'saves'): Promise<void> {
  await router.push({ name })
}

async function handleAttack(): Promise<void> {
  const result = await runGameAction(() => attackMutation.mutateAsync(), 'Не удалось ударить.')
  if (!result.ok) return

  if (isGameOver(result.data)) {
    await leaveToGameOver()
    return
  }

  if (isBattleWin(result.data)) {
    ui.notify(result.data.message, 'success')
  }
}

async function handleNextRoom(): Promise<void> {
  const result = await runGameAction(
    () => nextRoomMutation.mutateAsync(),
    'Не удалось перейти в комнату.',
  )
  if (result.ok && isGameOver(result.data)) await leaveToGameOver()
}

/** Возврат в предыдущую комнату. Дальше назад — ещё раз, без карты. */
async function handleGoBack(): Promise<void> {
  const current = info.value
  if (current === undefined) return

  const result = await runGameAction(
    () => goToRoomMutation.mutateAsync(current.room.number - 1),
    'Не удалось вернуться в комнату.',
  )
  if (result.ok && isGameOver(result.data)) await leaveToGameOver()
}

async function handleUse(item: InventoryItem): Promise<void> {
  const id = itemId(item)
  if (id === null) return

  // Лечение может убить: конец игры приходит тем же кодом 200.
  const result = await runGameAction(
    () => itemUseMutation.mutateAsync(id),
    'Не удалось применить предмет.',
  )
  if (result.ok && isGameOver(result.data)) await leaveToGameOver()
}

async function handleEquip(item: InventoryItem): Promise<void> {
  const id = itemId(item)
  if (id === null) return

  await runGameAction(() => equipMutation.mutateAsync(id), 'Не удалось надеть предмет.')
}

async function handleUnequip(slot: EquipmentSlot): Promise<void> {
  await runGameAction(() => unequipMutation.mutateAsync(slot), 'Не удалось снять предмет.')
}

async function handleSell(item: InventoryItem): Promise<void> {
  const id = itemId(item)
  if (id === null) return

  await runGameAction(() => sellMutation.mutateAsync(id), 'Не удалось продать предмет.')
}
</script>

<template>
  <p v-if="isPending" class="text-sm text-stone-400">Загружаю состояние…</p>

  <section
    v-else-if="stateLost"
    class="rounded border border-amber-900 bg-amber-950/30 p-4 text-sm text-amber-100"
  >
    <p>Состояние этой игры не из чего восстановить.</p>
    <p class="mt-2 text-xs opacity-80">
      После вытеснения из кеша сервер поднимает партию из последнего сохранения, но у этой игры
      сохранений не нашлось. Выбери другую игру или создай новую — ход партии уже не вернуть.
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-white"
        @click="goTo('saves')"
      >
        К сохранениям
      </button>

      <button
        type="button"
        class="rounded border border-stone-700 px-4 py-2 text-sm text-stone-200 hover:border-stone-500 hover:text-white"
        @click="goTo('sessions')"
      >
        К списку игр
      </button>
    </div>
  </section>

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
        <RoomPanel :room="info.room">
          <template #actions>
            <button
              v-if="canWalkBack"
              type="button"
              class="rounded border border-stone-700 px-4 py-2 text-sm text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
              :disabled="busy || inBattle"
              @click="handleGoBack"
            >
              ← Назад
            </button>

            <button
              type="button"
              class="rounded bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-white disabled:opacity-40"
              :disabled="busy || inBattle"
              @click="handleNextRoom"
            >
              Идти дальше
            </button>

            <button
              v-if="mapAvailable"
              type="button"
              class="rounded border border-stone-700 px-4 py-2 text-sm text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
              :disabled="busy"
              @click="mapOpen = true"
            >
              Карта
            </button>
          </template>
        </RoomPanel>

        <BattlePanel
          v-if="enemy"
          :enemy="enemy"
          :log="battleLog"
          :disabled="busy"
          @attack="handleAttack"
        />

        <RoomItemsPanel
          v-if="!inBattle"
          :key="info.room.number"
          :room-number="info.room.number"
          :room-name="info.room.name"
          :in-shop="isShop"
        />
      </div>

      <div class="space-y-4">
        <EquipmentSlots
          :weapon="info.weapon"
          :helm="info.helm"
          :chestplate="info.chestplate"
          :disabled="busy"
          @unequip="handleUnequip"
        />

        <InventoryList :items="info.inventory">
          <template #actions="{ item }">
            <button
              v-if="canUse(item)"
              type="button"
              class="rounded border border-emerald-800 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-950 disabled:opacity-40"
              :disabled="busy"
              @click="handleUse(item)"
            >
              Использовать
            </button>

            <button
              v-if="canEquip(item)"
              type="button"
              class="rounded border border-stone-700 px-3 py-1 text-xs text-stone-200 hover:border-stone-500 hover:text-white disabled:opacity-40"
              :disabled="busy"
              @click="handleEquip(item)"
            >
              Надеть
            </button>

            <button
              v-if="isShop && canSell(item)"
              type="button"
              class="rounded border border-amber-800 px-3 py-1 text-xs text-amber-200 hover:bg-amber-950 disabled:opacity-40"
              :disabled="busy"
              @click="handleSell(item)"
            >
              Продать
            </button>
          </template>
        </InventoryList>
      </div>
    </div>

    <DungeonMap v-model:open="mapOpen" :current-number="info.room.number" :in-battle="inBattle" />
  </div>
</template>
