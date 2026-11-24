import { expect, test } from '@playwright/test'

/**
 * Единственный тест **без моков**: проверяет контракт того API, который реально
 * поднят. Остальные спеки сеть подменяют, поэтому смена контракта на бэкенде
 * проходит для них незамеченной — здесь она падает.
 *
 * Запуск: `SMOKE=1 pnpm test:e2e` при живом бэкенде на `:5000`. Тест создаёт
 * пользователя и игру и удаляет игру за собой: в dev-базе после прогона
 * остаётся неиспользуемый аккаунт `smoke…`.
 */
const smokeEnabled = process.env.SMOKE === '1'

test('живой API отдаёт контракт 1.2.0', async ({ page }) => {
  test.skip(!smokeEnabled, 'нужен живой API: SMOKE=1')

  const login = `smoke${Date.now().toString(36)}`

  // Регистрация: 201 без тела, куки уже стоят.
  const registered = await page.request.post('/api/users', {
    data: { login, password: 'Pass1' },
  })
  expect(registered.status()).toBe(201)

  const me = await page.request.get('/api/auth/me')
  expect(me.status()).toBe(200)
  expect((await me.json()).login).toBe(login)

  // Новая игра сразу активна, а seed приходит строкой — иначе он терял бы
  // точность выше 2^53 (то самое ломающее изменение 1.2.0).
  const created = await page.request.post('/api/sessions')
  expect(created.status()).toBe(201)
  const session = await created.json()
  expect(typeof session.seed).toBe('string')
  expect(session.seed).toMatch(/^\d+$/)
  expect(typeof session.sessionId).toBe('string')

  const state = await page.request.get('/api/state')
  expect(state.status()).toBe(200)
  const info = await state.json()

  expect(typeof info.isGameStarted).toBe('boolean')
  expect(info.isGameStarted).toBe(true)
  // У новой партии исхода ещё нет; появившись, он приходит строкой в нижнем регистре.
  expect(info.result === null || ['win', 'lose'].includes(info.result)).toBe(true)

  expect(typeof info.room.kind).toBe('string')
  expect(typeof info.room.isSearched).toBe('boolean')

  // Обыск стартовой комнаты: предметов нет, но ответ — 200 и массив.
  const searched = await page.request.post('/api/state/rooms/current/items')
  expect(searched.status()).toBe(200)
  expect(Array.isArray(await searched.json())).toBe(true)

  // Ошибка без сессии приходит с телом ProblemDetails, а не пустой.
  const removed = await page.request.delete(`/api/sessions/${session.sessionId}`)
  expect(removed.status()).toBe(204)

  const afterRemoval = await page.request.get('/api/state')
  expect(afterRemoval.status()).toBe(403)
  expect((await afterRemoval.json()).title).toBe('MISSING_SESSION_ID_CLAIM')

  const loggedOut = await page.request.delete('/api/auth/tokens')
  expect(loggedOut.status()).toBe(204)
})
