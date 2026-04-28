class CalendarCredentialError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CalendarCredentialError'
  }
}

class ProviderModelNotFoundError extends Error {
  constructor(providerId) {
    super(`Provider not found: ${providerId}`)
    this.name = 'ProviderModelNotFoundError'
    this.providerId = providerId
  }
}

class CalendarProviderMisconfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CalendarProviderMisconfigurationError'
  }
}

module.exports = {
  CalendarCredentialError,
  ProviderModelNotFoundError,
  CalendarProviderMisconfigurationError,
}
