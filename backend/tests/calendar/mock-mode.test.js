const request = require('supertest')
const app = require('../../server')

describe('Calendar mock mode (no provider configured)', () => {
  beforeAll(() => {
    // Ensure mock mode: no provider configured
    process.env.CALENDAR_PROVIDER = ''
    delete process.env.CALENDAR_API_KEY
  })

  test('should allow booking in local/mock mode', async () => {
    // Next weekday at 10:00 local time, ISO string
    const date = new Date()
    do {
      date.setDate(date.getDate() + 1)
    } while (date.getDay() === 0 || date.getDay() === 6)
    date.setHours(10, 0, 0, 0)
    const start = date.toISOString()

    const res = await request(app).post('/bookings').send({
      eventTypeId: 'meeting-15',
      start,
      guestName: 'Test User',
      guestEmail: 'test@example.com',
    })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
  })
})
