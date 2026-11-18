import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { meQueryOptions } from '../queries/auth'
import { queryClient } from '../queries/client'

declare module 'vue-router' {
  interface RouteMeta {
    /** Экран бессмысленен без активной сессии: сервер ответил бы 403. */
    requiresSession?: boolean
  }
}

// Заглушка для игровых экранов блока 4.
const StubView = () => import('../views/StubView.vue')

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/', name: 'root', component: StubView, props: { title: 'Загрузка' } },
  { path: '/sessions', name: 'sessions', component: () => import('../views/SessionsView.vue') },
  {
    path: '/saves',
    name: 'saves',
    component: () => import('../views/SavesView.vue'),
    meta: { requiresSession: true },
  },
  {
    path: '/game',
    name: 'game',
    component: StubView,
    props: { title: 'Игра' },
    meta: { requiresSession: true },
  },
  {
    path: '/game-over',
    name: 'gameOver',
    component: StubView,
    props: { title: 'Конец игры' },
    meta: { requiresSession: true },
  },
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

  if (to.meta.requiresSession === true && me.sessionId === null) {
    return { name: 'sessions' }
  }

  return true
})

export default router
