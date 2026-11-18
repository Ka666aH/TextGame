import type { Page, Route } from '@playwright/test'

/**
 * Подмена сети для e2e: бэкенд не нужен, ответы задаются таблицей
 * `"МЕТОД /путь"` → тело JSON.
 *
 * Всё, чего нет в таблице, отвечает `500` с кодом `NOT_MOCKED`: пропущенный
 * запрос виден сразу, а не тонет в таймауте непонятного элемента.
 *
 * Маршруты проверяются в обратном порядке регистрации, поэтому особая логика
 * (`mockMeAnonymous`, `mockSequence`) вешается **после** этой функции и
 * перекрывает таблицу.
 */
export async function mockApi(page: Page, table: Record<string, unknown>): Promise<void> {
  await page.route('**/api/**', async (route: Route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace(/^\/api/, '')
    const key = `${request.method()} ${path}`

    if (!(key in table)) {
      await route.fulfill({
        status: 500,
        json: { title: 'NOT_MOCKED', detail: `Нет заглушки для ${key}` },
      })
      return
    }

    await route.fulfill({ status: 200, json: table[key] })
  })
}

/** `/auth/me` всегда `401`: пользователь не вошёл. */
export async function mockMeAnonymous(page: Page): Promise<void> {
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401, body: '' }))
}

/** `/auth/me`: первый вызов анонимный, дальше — вошедший пользователь. */
export async function mockMeThenAuthenticated(page: Page, authenticated: unknown): Promise<void> {
  let calls = 0
  await page.route('**/api/auth/me', async (route) => {
    calls += 1
    if (calls === 1) {
      await route.fulfill({ status: 401, body: '' })
      return
    }
    await route.fulfill({ status: 200, json: authenticated })
  })
}

/**
 * Ответ меняется от вызова к вызову: первый — первый элемент, дальше
 * последний. Нужен там, где состояние сервера реально меняется: обыск
 * комнаты, перечитывание состояния на экране исхода.
 */
export async function mockSequence(page: Page, pattern: string, bodies: unknown[]): Promise<void> {
  let index = 0
  await page.route(pattern, async (route) => {
    const body = bodies[Math.min(index, bodies.length - 1)]
    index += 1
    await route.fulfill({ status: 200, json: body })
  })
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
}

export const exitRoom = {
  number: 9,
  name: 'ВЫХОД',
  description: 'Свет в конце коридора.',
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
}

/** Снимок состояния: поля ровно те, что отдаёт `GET /state`. */
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
    ...overrides,
  }
}

/** `200 GameOver` — и победа, и поражение приходят одной формой. */
export function gameOver(message: string, room: Record<string, unknown>): Record<string, unknown> {
  return { message, gameInfo: gameInfo({ room }) }
}
