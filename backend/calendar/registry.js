const { CalendarCredentialError, ProviderModelNotFoundError, CalendarProviderMisconfigurationError } = require('./errors')

// Lightweight in-repo registry of supported providers (example stubs)
const PROVIDERS = {
  'google-calendar': {
    id: 'google-calendar',
    name: 'Google Calendar',
  },
  'outlook-calendar': {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
  },
}

function isProviderSupported(providerId) {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, providerId)
}

// Lightweight preflight loader that validates env-config and returns a provider object or null (mock mode)
function loadConfiguredProvider() {
  const providerId = String(process.env.CALENDAR_PROVIDER || '').trim()
  const apiKey = String(process.env.CALENDAR_API_KEY || '').trim()

  // Basic redaction log to avoid leaking sensitive data in logs
  if (providerId) {
    // Do not log the API key; log only providerId for traceability
    // eslint-disable-next-line no-console
    console.log(`Loading calendar provider: ${providerId}`)
  } else {
    // eslint-disable-next-line no-console
    console.log('Using local/mock calendar provider (no external provider configured)')
  }

  // Local/mock mode when provider is not configured
  if (!providerId) {
    return null
  }

  if (!isProviderSupported(providerId)) {
    throw new ProviderModelNotFoundError(providerId)
  }

  // Basic key validation (replace with robust logic in prod)
  if (!apiKey || apiKey.length < 16) {
    throw new CalendarCredentialError('Invalid API key for calendar provider')
  }

  // Return the provider stub from registry
  return PROVIDERS[providerId]
}

module.exports = {
  SUPPORTED_CALENDAR_PROVIDERS: Object.keys(PROVIDERS),
  loadConfiguredProvider,
  getProvider: (providerId) => PROVIDERS[providerId],
}
