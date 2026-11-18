import { expect, test } from '@playwright/test'

import { meWithoutSession, mockApi, mockMeAnonymous, mockMeThenAuthenticated } from './support/fixtures'

test('без куки показывается экран входа', async ({ page }) => {
  await mockApi(page, {})
  await mockMeAnonymous(page)

  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Подземелье' })).toBeVisible()
  await expect(page.getByLabel('Логин')).toBeVisible()
})

test('вход ведёт к списку игр', async ({ page }) => {
  await mockApi(page, {
    'POST /auth/tokens': {},
    'GET /sessions': [],
  })
  // Анкета спрашивается дважды: до входа и сразу после, чтобы узнать, есть ли игра.
  await mockMeThenAuthenticated(page, meWithoutSession)

  await page.goto('/login')
  await page.getByLabel('Логин').fill('player')
  await page.getByLabel('Пароль').fill('Pass1')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()

  await expect(page).toHaveURL(/\/sessions$/)
  await expect(page.getByRole('heading', { name: 'Игровые сессии' })).toBeVisible()
})
