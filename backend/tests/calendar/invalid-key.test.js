const request = require('supertest')
const app = require('../../server')

describe('Invalid CALENDAR_API_KEY handling', () => {
  beforeAll(() => {
    process.env.CALENDAR_PROVIDER = 'google-calendar'
    process.env.CALENDAR_API_KEY = 'short'
  })

  afterAll(() => {
    delete process.env.CALENDAR_PROVIDER
    delete process.env.CALENDAR_API_KEY
  })

  test('should respond 403 for invalid API key', async () => {
    // Next weekday at 10:00
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

    expect(res.status).toBe(403)
    expect(res.body.message).toContain('Invalid calendar API key')
  })
})
