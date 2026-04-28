const request = require('supertest')
const app = require('../../server')

describe('Logging redaction of sensitive data', () => {
  let logSpy
  beforeAll(() => {
    // Use a provider to trigger registry log but redact API key in logs
    process.env.CALENDAR_PROVIDER = 'google-calendar'
    process.env.CALENDAR_API_KEY = 'SUPER-SECRET-KEY-12345678'
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterAll(() => {
    logSpy.mockRestore()
    delete process.env.CALENDAR_PROVIDER
    delete process.env.CALENDAR_API_KEY
  })

  test('logs should not contain API key', async () => {
    // Next weekday at 10:00
    const date = new Date()
    do {
      date.setDate(date.getDate() + 1)
    } while (date.getDay() === 0 || date.getDay() === 6)
    date.setHours(10, 0, 0, 0)
    const start = date.toISOString()

    await request(app).post('/bookings').send({
      eventTypeId: 'meeting-15',
      start,
      guestName: 'Test User',
      guestEmail: 'test@example.com',
    })

    const allLogs = logSpy.mock.calls.map((call) => String(call[0] ?? ''))
    const combined = allLogs.join('\n')
    expect(combined).not.toContain(process.env.CALENDAR_API_KEY)
  })
})
