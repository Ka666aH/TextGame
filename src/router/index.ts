import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { meQueryOptions } from '../queries/auth'
import { queryClient } from '../queries/client'

// Заглушка для экранов, которые появятся в блоках 2–4.
const StubView = () => import('../views/StubView.vue')

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/', name: 'root', component: StubView, props: { title: 'Загрузка' } },
  { path: '/sessions', name: 'sessions', component: () => import('../views/SessionsView.vue') },
  { path: '/saves', name: 'saves', component: StubView, props: { title: 'Сохранения' } },
  { path: '/game', name: 'game', component: StubView, props: { title: 'Игра' } },
  { path: '/game-over', name: 'gameOver', component: StubView, props: { title: 'Конец игры' } },
  { path: '/:pathMatch(.*)*', redirect: { name: 'root' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/**
 * Ровно один bootstrap-запрос на загрузку страницы, и он же решает, какой
 * экран показать. `ensureQueryData` кэширует результат, поэтому переходы
 * между экранами не дёргают `/auth/me` повторно.
 */
router.beforeEach(async (to) => {
  const me = await queryClient.ensureQueryData(meQueryOptions())

  if (me === null) {
    return to.name === 'login' ? true : { name: 'login' }
  }

  const home = me.sessionId !== null ? { name: 'game' } : { name: 'sessions' }

  if (to.name === 'login' || to.name === 'root') return home

  return true
})

export default router
