import { expect, test } from '@playwright/test'

const API_URL = 'http://127.0.0.1:3000'

function makeWeeklySchedule() {
  return [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
    dayOfWeek,
    isWorking: true,
    startTime: '00:00',
    endTime: '23:59',
  }))
}

test.beforeEach(async ({ request }) => {
  const response = await request.put(`${API_URL}/working-hours`, {
    data: {
      weeklySchedule: makeWeeklySchedule(),
      exceptions: [],
    },
  })

  expect(response.ok()).toBeTruthy()
})

test('guest can create a booking and owner can see it in admin', async ({ page, request }) => {
  const runId = Date.now()
  const eventName = `E2E встреча ${runId}`
  const guestName = `E2E Гость ${runId}`
  const guestEmail = `guest-${runId}@example.test`

  const eventTypeResponse = await request.post(`${API_URL}/event-types`, {
    data: {
      name: eventName,
      description: 'Тип события для e2e-проверки основного сценария бронирования.',
      durationMinutes: 1,
    },
  })

  expect(eventTypeResponse.ok()).toBeTruthy()

  await page.goto('/booking')
  await expect(page.getByRole('heading', { name: 'Страница бронирования для гостя' })).toBeVisible()

  await page.getByLabel('Тип события').click()
  await page.getByRole('option', { name: new RegExp(eventName) }).click()

  const firstAvailableSlot = page
    .locator('.mantine-Card-root')
    .filter({ hasText: 'Свободно' })
    .getByRole('button', { name: 'Выбрать' })
    .first()

  await expect(firstAvailableSlot).toBeEnabled()
  await firstAvailableSlot.click()

  await expect(page.getByText('Выбран слот:', { exact: false })).toBeVisible()
  await page.getByLabel('Имя гостя').fill(guestName)
  await page.getByLabel('Email (необязательно)').fill(guestEmail)
  await page.getByRole('button', { name: 'Создать бронирование' }).click()

  await expect(page.getByText('Бронирование создано')).toBeVisible()
  await expect(page.getByLabel('Имя гостя')).toHaveValue('')
  await expect(page.getByLabel('Email (необязательно)')).toHaveValue('')

  await page.goto('/admin/bookings')
  await expect(page.getByRole('heading', { name: 'Предстоящие встречи' })).toBeVisible()
  await expect(page.getByRole('cell', { name: guestName })).toBeVisible()
  await expect(page.getByRole('cell', { name: guestEmail })).toBeVisible()
  await expect(page.getByText(eventName)).toBeVisible()
})

test('booking submit button is disabled until required fields are filled', async ({ page, request }) => {
  const runId = Date.now()
  const eventName = `E2E обязательные поля ${runId}`

  const eventTypeResponse = await request.post(`${API_URL}/event-types`, {
    data: {
      name: eventName,
      durationMinutes: 1,
    },
  })

  expect(eventTypeResponse.ok()).toBeTruthy()

  await page.goto('/booking')
  await page.getByLabel('Тип события').click()
  await page.getByRole('option', { name: new RegExp(eventName) }).click()

  const submitButton = page.getByRole('button', { name: 'Создать бронирование' })
  await expect(submitButton).toBeDisabled()

  await page
    .locator('.mantine-Card-root')
    .filter({ hasText: 'Свободно' })
    .getByRole('button', { name: 'Выбрать' })
    .first()
    .click()
  await expect(submitButton).toBeDisabled()

  await page.getByLabel('Имя гостя').fill(`E2E Гость ${runId}`)
  await expect(submitButton).toBeEnabled()
})
