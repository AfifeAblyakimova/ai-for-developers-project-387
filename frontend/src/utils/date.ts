export function getBookingWindow() {
  const from = new Date()
  const to = new Date(from)
  to.setDate(from.getDate() + 14)

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

export function toDatePickerValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getBookingWindowDates() {
  const from = new Date()
  const to = new Date(from)
  to.setDate(from.getDate() + 13)

  return {
    minDate: toDatePickerValue(from),
    maxDate: toDatePickerValue(to),
  }
}

export function getDayBounds(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const from = new Date(year, month - 1, day, 0, 0, 0, 0)
  const to = new Date(year, month - 1, day + 1, 0, 0, 0, 0)

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'long',
  }).format(new Date(`${value}T00:00:00`))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatTimeRange(start: string, end: string) {
  const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${timeFormatter.format(new Date(start))} - ${timeFormatter.format(new Date(end))}`
}
