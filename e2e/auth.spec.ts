import { expect, test } from '@playwright/test'

import { meAnonymous, meSequence, meWithoutSession, mockApi } from './support/fixtures'

test('без куки показывается экран входа', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': meAnonymous() })

  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Подземелье' })).toBeVisible()
  await expect(page.getByLabel('Логин')).toBeVisible()
  // Подвал доступен до входа: лицензии иконок должны читаться без аккаунта.
  await expect(page.getByRole('link', { name: 'Иконки' })).toBeVisible()
})

test('авторы иконок открываются до входа', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': meAnonymous() })

  await page.goto('/credits')

  await expect(page).toHaveURL(/\/credits$/)
  await expect(page.getByRole('heading', { name: 'Иконки' })).toBeVisible()

  // Ради этого страница и существует: оба источника и авторы каждого.
  // Имена ссылок в Playwright ищутся по подстроке, поэтому где нужно —
  // сверяем точно.
  await expect(page.getByRole('link', { name: 'game-icons.net', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Delapouite', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'www.flaticon.com', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'madness', exact: true })).toBeVisible()

  // CC BY требует отмечать изменения — эта строка и есть такая отметка.
  await expect(page.getByText('Часть иконок изменена')).toBeVisible()
})

test('вход ведёт к списку игр', async ({ page }) => {
  await mockApi(page, {
    // Анкета спрашивается дважды: до входа и сразу после — чтобы узнать, есть ли игра.
    'GET /auth/me': meSequence(meWithoutSession),
    'POST /auth/tokens': {},
    'GET /sessions': [],
  })

  await page.goto('/login')
  await page.getByLabel('Логин').fill('player')
  await page.getByLabel('Пароль').fill('Pass1')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()

  await expect(page).toHaveURL(/\/sessions$/)
  await expect(page.getByRole('heading', { name: 'Игровые сессии' })).toBeVisible()
})
