const request = require('supertest')
const app = require('../../server')

describe('Unknown provider handling', () => {
  beforeAll(() => {
    process.env.CALENDAR_PROVIDER = 'non-existent-provider'
    process.env.CALENDAR_API_KEY = 'aaaaaaaaaaaaaaaa'
  })

  afterAll(() => {
    delete process.env.CALENDAR_PROVIDER
    delete process.env.CALENDAR_API_KEY
  })

  test('should respond 500 for unregistered provider', async () => {
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

    expect(res.status).toBe(500)
    expect(res.body.message).toContain('Calendar provider not registered')
  })
})
