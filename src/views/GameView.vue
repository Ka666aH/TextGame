<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { fetchMe } from '../api/auth'
import { CODE, isHttpFallbackCode } from '../api/codes'
import { isApiError, messageForError, type ApiError } from '../api/errors'
import type { EquipmentSlot } from '../api/game'
import { isBattleWin, isGameOver } from '../api/guards'
import { canEquip, canSell, canUse, hasMap, itemId } from '../api/items'
import { ROOM_KINDS } from '../api/labels'
import { outcomeOf } from '../api/outcome'
import type { Enemy, InventoryItem } from '../api/types'
import { priceSuffix } from '../lib/itemText'
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
import { useCreateSaveMutation } from '../queries/saves'
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
const saveMutation = useCreateSaveMutation()

const mapOpen = ref(false)

// Вид комнаты приходит полем `kind` (с 1.2.0), имя — только для арта.
const isShop = computed(() => info.value?.room.kind === ROOM_KINDS.shop)
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
  // `MISSING_SESSION_ID_CLAIM` — policy `RequireSession`: активной игры нет.
  // С 1.2.0 отказ приходит с телом, пустой `403` остаётся фолбэком.
  if (cause.status === 403) {
    if (cause.code === CODE.missingSessionIdClaim || isHttpFallbackCode(cause.code)) return true
  }
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

/**
 * Быстрое сохранение: имя не задаём — сервер подставит «РУЧНОЕ СОХРАНЕНИЕ ОТ …».
 * Состояние к этому моменту уже лежит в кеше сервера: его положил `GET /state`,
 * на котором построен экран.
 */
async function handleQuickSave(): Promise<void> {
  const result = await runGameAction(
    () => saveMutation.mutateAsync({}),
    'Не удалось сохранить игру.',
  )
  if (result.ok) ui.notify('Сохранено.', 'success')
}
</script>

<template>
  <p v-if="isPending" class="text-sm text-muted">Загружаю состояние…</p>

  <section
    v-else-if="stateLost"
    class="rounded border border-warn-line bg-warn-soft/30 p-4 text-sm text-warn-ink"
  >
    <p>Партию не из чего восстановить.</p>
    <p class="mt-2 text-xs opacity-80">
      Партия восстанавливается из последнего сохранения, но у этой игры сохранений нет. Выбери
      другую игру или создай новую — ход партии уже не вернуть.
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
        @click="goTo('saves')"
      >
        К сохранениям
      </button>

      <button
        type="button"
        class="rounded border border-line-strong px-4 py-2 text-sm text-ink-soft hover:border-line-hover hover:text-strong"
        @click="goTo('sessions')"
      >
        К списку игр
      </button>
    </div>
  </section>

  <section
    v-else-if="isError"
    class="rounded border border-danger-line bg-danger-soft/40 p-4 text-sm text-danger-ink"
  >
    <p>Не удалось загрузить состояние игры.</p>
    <p class="mt-2 text-xs opacity-80">{{ errorText }}</p>
  </section>

  <div v-else-if="info" class="space-y-4">
    <StatBar :info="info" />

    <div class="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div class="space-y-4">
        <RoomPanel :room="info.room">
          <template #actions>
            <button
              v-if="canWalkBack"
              type="button"
              class="rounded border border-line-strong px-4 py-2 text-sm text-ink-soft hover:border-line-hover hover:text-strong disabled:opacity-40"
              :disabled="busy || inBattle"
              @click="handleGoBack"
            >
              ← Назад
            </button>

            <button
              type="button"
              class="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-40"
              :disabled="busy || inBattle"
              @click="handleNextRoom"
            >
              Идти дальше
            </button>

            <button
              v-if="mapAvailable"
              type="button"
              class="rounded border border-line-strong px-4 py-2 text-sm text-ink-soft hover:border-line-hover hover:text-strong disabled:opacity-40"
              :disabled="busy"
              @click="mapOpen = true"
            >
              Карта
            </button>

            <button
              type="button"
              class="ml-auto rounded border border-line-strong p-2 text-ink-soft hover:border-line-hover hover:text-strong disabled:opacity-40"
              :disabled="busy"
              aria-label="Сохранить игру"
              title="Сохранить игру"
              @click="handleQuickSave"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <path d="M4 4h11l5 5v11H4z" />
                <path d="M8 4v6h7V4" />
                <path d="M8 20v-6h8v6" />
              </svg>
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
          :room-kind="info.room.kind"
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
              class="rounded border border-ok-line px-3 py-1 text-xs text-ok-ink hover:bg-ok-soft-strong disabled:opacity-40"
              :disabled="busy"
              @click="handleUse(item)"
            >
              Использовать
            </button>

            <button
              v-if="canEquip(item)"
              type="button"
              class="rounded border border-line-strong px-3 py-1 text-xs text-ink-soft hover:border-line-hover hover:text-strong disabled:opacity-40"
              :disabled="busy"
              @click="handleEquip(item)"
            >
              Надеть
            </button>
          </template>

          <!-- Продажа стоит у правого края карточки, остальные действия — слева. -->
          <template v-if="isShop" #actions-end="{ item }">
            <button
              v-if="canSell(item)"
              type="button"
              class="rounded border border-warn-line px-3 py-1 text-xs text-warn-ink hover:bg-warn-soft-strong disabled:opacity-40"
              :disabled="busy"
              @click="handleSell(item)"
            >
              Продать{{ priceSuffix(item) }}
            </button>
          </template>
        </InventoryList>
      </div>
    </div>

    <DungeonMap v-model:open="mapOpen" :current-number="info.room.number" :in-battle="inBattle" />
  </div>
</template>
