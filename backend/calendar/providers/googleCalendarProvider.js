// Very light placeholder for Google Calendar provider. In production,
// this would implement a common interface used by server to interact with
// Google Calendar APIs.
class GoogleCalendarProvider {
  constructor() {
    this.id = 'google-calendar'
    this.name = 'Google Calendar'
  }

  // Example stub: would implement createEvent, checkAvailability, etc.
}

module.exports = GoogleCalendarProvider
