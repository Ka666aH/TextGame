import { expect, test } from '@playwright/test'

import {
  chest,
  exitRoom,
  gameInfo,
  gameOver,
  me,
  mockApi,
  mockSequence,
  smallRoom,
} from './support/fixtures'

/**
 * Мимик — единственная смерть, которая не меняет здоровье: сервер снимает
 * только флаг старта. Если экран исхода начнёт доверять эвристике больше,
 * чем ответу на действие, он отправит игрока обратно в мёртвую игру.
 */
test('открытый мимик ведёт на экран поражения, а не обратно в игру', async ({ page }) => {
  const swallowed = gameOver(
    'НА ВАС НАПАЛ МИМИК! ВЫ БЫЛИ ПРОГЛОЧЕНЫ И ПЕРЕВАРЕНЫ!',
    smallRoom,
  )

  await mockApi(page, {
    'GET /auth/me': me,
    'GET /state': gameInfo(),
    'POST /state/rooms/current/items': [chest],
    'POST /state/rooms/current/items/302/chest/open': swallowed,
  })

  await page.goto('/game')
  await page.getByRole('button', { name: 'Обыскать', exact: true }).click()
  await page.getByRole('button', { name: 'Открыть', exact: true }).click()

  await expect(page).toHaveURL(/\/game-over$/)
  await expect(page.getByRole('heading', { name: 'Вы погибли' })).toBeVisible()
  await expect(page.getByText('ПРОГЛОЧЕНЫ')).toBeVisible()
})

test('комната «ВЫХОД» ведёт на экран победы', async ({ page }) => {
  const found = gameOver('ВЫ НАШЛИ ВЫХОД ИЗ ПОДЗЕМЕЛЬЯ!', exitRoom)

  await mockApi(page, {
    'GET /auth/me': me,
    'POST /state/rooms': found,
  })
  // После перехода сервер отдаёт уже финальное состояние — комнату «ВЫХОД».
  await mockSequence(page, '**/api/state', [gameInfo(), gameInfo({ room: exitRoom })])

  await page.goto('/game')
  await page.getByRole('button', { name: 'Идти дальше' }).click()

  await expect(page).toHaveURL(/\/game-over$/)
  await expect(page.getByRole('heading', { name: 'Выход найден' })).toBeVisible()
})
