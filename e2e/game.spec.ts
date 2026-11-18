import { expect, test } from '@playwright/test'

import { bandage, gameInfo, me, mockApi, mockSequence } from './support/fixtures'

test('экран игры показывает комнату и действия', async ({ page }) => {
  await mockApi(page, {
    'GET /auth/me': me,
    'GET /state': gameInfo(),
  })

  await page.goto('/')

  await expect(page).toHaveURL(/\/game$/)
  await expect(page.getByRole('heading', { name: /МАЛЕНЬКАЯ КОМНАТА/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Идти дальше' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Обыскать', exact: true })).toBeVisible()
})

test('обыск показывает предмет, а «Взять» переносит его в инвентарь', async ({ page }) => {
  await mockApi(page, {
    'GET /auth/me': me,
    'GET /state': gameInfo(),
    'POST /state/rooms/current/items/301/take': gameInfo({ inventory: [bandage] }),
  })
  // Обыск — это POST, и после «Взять» комната уже пуста.
  await mockSequence(page, '**/api/state/rooms/current/items', [[bandage], []])

  await page.goto('/game')
  await page.getByRole('button', { name: 'Обыскать', exact: true }).click()
  await page.getByRole('button', { name: 'Взять', exact: true }).click()

  // Предмет ушёл в инвентарь (появилось действие), а в комнате стало пусто.
  await expect(page.getByRole('button', { name: 'Использовать' })).toBeVisible()
  await expect(page.getByText('Пусто.')).toBeVisible()
})
