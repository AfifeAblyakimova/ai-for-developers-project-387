const GoogleCalendarProvider = require('./googleCalendarProvider')

// Simple registry-like export of provider classes/instances
const PROVIDERS = {
  'google-calendar': new GoogleCalendarProvider(),
  // Future: 'outlook-calendar': new OutlookCalendarProvider()
}

module.exports = {
  PROVIDERS,
  getProvider: (providerId) => PROVIDERS[providerId],
}
