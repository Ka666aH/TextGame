import type { Page, Route } from '@playwright/test'

export type MockHandler = (route: Route) => Promise<void> | void

/** Тело ответа `200` — или функция, если ответ особый. */
export type MockValue = unknown | MockHandler

function isHandler(value: unknown): value is MockHandler {
  return typeof value === 'function'
}

/**
 * Подмена сети для e2e: бэкенд не нужен.
 *
 * Маршрут один, а совпадение проверяется предикатом по пути. Глоб
 * `**\/api/**` на практике не сработал: запросы уходили в прокси, падали по
 * сети, и тест падал пустой страницей вместо понятной причины.
 *
 * Ключ таблицы — `"МЕТОД /путь"`. Значение — тело ответа `200` либо функция
 * для особых случаев (401, меняющиеся ответы). Всё, чего нет в таблице,
 * отвечает `500 NOT_MOCKED`: пропущенный запрос виден сразу.
 */
export async function mockApi(page: Page, table: Record<string, MockValue>): Promise<void> {
  logPageProblems(page)

  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname.replace(/^\/api/, '')
      const key = `${request.method()} ${path}`
      const value = table[key]

      if (value === undefined) {
        await route.fulfill({
          status: 500,
          json: { title: 'NOT_MOCKED', detail: `Нет заглушки для ${key}` },
        })
        return
      }

      if (isHandler(value)) {
        await value(route)
        return
      }

      await route.fulfill({ status: 200, json: value })
    },
  )
}

/**
 * Диагностика на случай падения: без неё отказ выглядит как пустая страница,
 * и причину приходится угадывать. Playwright показывает stdout упавших
 * тестов, так что в зелёном прогоне этих строк не видно.
 */
function logPageProblems(page: Page): void {
  page.on('pageerror', (error) => {
    console.log(`[pageerror] ${error.message}`)
  })

  page.on('request', (request) => {
    if (!request.url().includes('/api/')) return
    console.log(`[api →] ${request.method()} ${new URL(request.url()).pathname}`)
  })

  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText ?? 'без причины'
    console.log(`[requestfailed] ${request.method()} ${request.url()} — ${reason}`)
  })

  page.on('response', (response) => {
    if (!response.url().includes('/api/')) return
    if (response.status() < 400) return

    const path = new URL(response.url()).pathname
    console.log(`[api ${response.status()}] ${response.request().method()} ${path}`)
  })
}

/** `/auth/me` всегда `401`: пользователь не вошёл. */
export function meAnonymous(): MockHandler {
  return (route) => route.fulfill({ status: 401, body: '' })
}

/** `/auth/me`: первый вызов анонимный, дальше — вошедший пользователь. */
export function meSequence(authenticated: unknown): MockHandler {
  let calls = 0

  return async (route) => {
    calls += 1
    if (calls === 1) {
      await route.fulfill({ status: 401, body: '' })
      return
    }
    await route.fulfill({ status: 200, json: authenticated })
  }
}

/**
 * Ответ меняется от вызова к вызову: первый элемент, дальше последний.
 * Нужен там, где состояние сервера действительно меняется: обыск комнаты,
 * перечитывание состояния на экране исхода.
 */
export function sequence(bodies: unknown[]): MockHandler {
  let index = 0

  return async (route) => {
    const body = bodies[Math.min(index, bodies.length - 1)]
    index += 1
    await route.fulfill({ status: 200, json: body })
  }
}

export const me = {
  userId: '11111111-1111-1111-1111-111111111111',
  login: 'player',
  sessionId: '22222222-2222-2222-2222-222222222222',
  sessionName: 'ТЕСТОВАЯ ИГРА',
}

export const meWithoutSession = { ...me, sessionId: null, sessionName: null }

export const smallRoom = {
  number: 2,
  name: 'МАЛЕНЬКАЯ КОМНАТА',
  description: 'Тесная комната без окон.',
  isSearched: false,
  kind: 'small',
}

export const exitRoom = {
  number: 9,
  name: 'ВЫХОД',
  description: 'Свет в конце коридора.',
  isSearched: false,
  kind: 'exit',
}

const rat = {
  id: 7,
  name: 'КРЫСА',
  description: 'Крупная крыса с жёлтыми зубами.',
  health: 10,
  damage: 2,
  damageBlock: 0,
}

/** Комната с врагом: на экране это бой. */
export const battleRoom = {
  number: 4,
  name: 'БОЛЬШАЯ КОМНАТА',
  description: 'Просторный зал с колоннами.',
  isSearched: true,
  kind: 'big',
  enemy: rat,
}

/** Та же комната после победы: врага в ней уже нет. */
export const clearedRoom = {
  number: 4,
  name: 'БОЛЬШАЯ КОМНАТА',
  description: 'Просторный зал с колоннами.',
  isSearched: true,
  kind: 'big',
}

export const bandage = {
  id: 301,
  name: 'ПОВЯЗКА',
  description: 'Полоска чистой ткани.',
  cost: 4,
  maxHealthBoost: 0,
  currentHealthBoost: 10,
}

export const chest = {
  id: 302,
  name: 'СУНДУК',
  description: 'Дубовый сундук с железными полосами.',
  isClosed: true,
  cost: null,
  isLocked: false,
}

/** Удар по врагу: `BattleLog` с заполненным здоровьем цели. */
export const hitLog = {
  target: 'КРЫСА',
  damageToTarget: 10,
  targetHealthBeforeAttack: 10,
  targetHealthAfterAttack: 0,
  attacker: 'ИГРОК',
  damageToAttacker: 0,
  healthBeforeAttack: 80,
  healthAfterAttack: 80,
}

/** Снимок состояния: поля ровно те, что отдаёт `GET /state` (1.2.0). */
export function gameInfo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    room: smallRoom,
    weapon: { name: 'КУЛАКИ', description: 'Просто руки.', damage: 3 },
    helm: null,
    chestplate: null,
    maxHealth: 100,
    currentHealth: 80,
    coins: 12,
    keys: 1,
    inventory: [],
    isGameStarted: true,
    result: null,
    ...overrides,
  }
}

/** `200 GameOver` — и победа, и поражение приходят одной формой. */
export function gameOver(message: string, room: Record<string, unknown>): Record<string, unknown> {
  return { message, gameInfo: gameInfo({ room }) }
}

/** `200 BattleWin`: с 1.2.0 несёт `gameInfo`, поэтому перечитывать `/state` не нужно. */
export function battleWin(
  message: string,
  battleLog: Record<string, unknown>,
  info: Record<string, unknown>,
): Record<string, unknown> {
  return { message, battleLog, gameInfo: info }
}
