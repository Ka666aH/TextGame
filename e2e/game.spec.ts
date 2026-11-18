import { expect, test } from '@playwright/test'

import { bandage, gameInfo, me, mockApi, sequence } from './support/fixtures'

test('экран игры показывает комнату, экипировку и содержимое', async ({ page }) => {
  await mockApi(page, {
    'GET /auth/me': me,
    'GET /state': gameInfo(),
    // Комната обыскивается сама при входе: отдельного шага больше нет.
    'POST /state/rooms/current/items': [],
  })

  await page.goto('/')

  await expect(page).toHaveURL(/\/game$/)
  await expect(page.getByRole('heading', { name: /МАЛЕНЬКАЯ КОМНАТА/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'экипировка' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Идти дальше' })).toBeVisible()
  await expect(page.getByText('Пусто.')).toBeVisible()
})

test('комната обыскивается сама, а «Взять» переносит предмет в инвентарь', async ({ page }) => {
  await mockApi(page, {
    'GET /auth/me': me,
    'GET /state': gameInfo(),
    'POST /state/rooms/current/items/301/take': gameInfo({ inventory: [bandage] }),
    // Содержимое меняется: до «Взять» в комнате лежит повязка, после — ничего.
    'POST /state/rooms/current/items': sequence([[bandage], []]),
  })

  await page.goto('/game')

  // Список пришёл без нажатия, поэтому кнопка называется «Обыскать заново».
  await expect(page.getByRole('button', { name: 'Обыскать заново' })).toBeVisible()
  await page.getByRole('button', { name: 'Взять', exact: true }).click()

  // Предмет ушёл в инвентарь (появилось действие), а в комнате стало пусто.
  await expect(page.getByRole('button', { name: 'Использовать' })).toBeVisible()
  await expect(page.getByText('Пусто.')).toBeVisible()
})
