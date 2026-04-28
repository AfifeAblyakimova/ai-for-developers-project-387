const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')

const app = express()
const port = Number(process.env.PORT ?? 3000)
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist')
const frontendIndexPath = path.join(frontendDistPath, 'index.html')

app.use(cors())
app.use(express.json())

let eventTypeSequence = 1
let bookingSequence = 1

const eventTypes = [
  {
    id: 'meeting-15',
    name: 'Встреча на 15 минут',
    description: 'Короткая встреча для быстрого созвона.',
    durationMinutes: 15,
  },
  {
    id: 'meeting-30',
    name: 'Встреча на 30 минут',
    description: 'Стандартная встреча для обсуждения задачи.',
    durationMinutes: 30,
  },
]

const bookings = []

let workingHours = createDefaultWorkingHours()

function sendError(response, status, message) {
  return response.status(status).json({ message })
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return undefined
  }

  const normalized = String(value).trim()

  return normalized || undefined
}

function isValidDuration(value) {
  return Number.isInteger(value) && value >= 1 && value <= 1440
}

function parseDateTime(value) {
  if (typeof value !== 'string') {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function toIsoString(date) {
  return date.toISOString()
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function findEventType(id) {
  return eventTypes.find((eventType) => eventType.id === id)
}

function buildEventTypeId(name) {
  const slug = normalizeOptionalString(name)
    ?.toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-|-$/g, '')

  return `${slug || 'event-type'}-${eventTypeSequence++}`
}

function createBookingId() {
  return `booking-${bookingSequence++}`
}

function rangesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return firstStart < secondEnd && secondStart < firstEnd
}

function isSlotTaken(eventTypeId, start, end) {
  return bookings.some((booking) => {
    if (booking.eventTypeId !== eventTypeId) {
      return false
    }

    return rangesOverlap(start, end, new Date(booking.start), new Date(booking.end))
  })
}

function filterByDateRange(items, from, to) {
  return items.filter((item) => {
    const start = new Date(item.start)

    if (from && start < from) {
      return false
    }

    if (to && start >= to) {
      return false
    }

    return true
  })
}

function createDefaultWorkingHours() {
  return {
    weeklySchedule: [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
      dayOfWeek,
      isWorking: dayOfWeek <= 5,
      startTime: dayOfWeek <= 5 ? '09:00' : undefined,
      endTime: dayOfWeek <= 5 ? '18:00' : undefined,
    })),
    exceptions: [],
  }
}

function cloneWorkingHours(value) {
  return {
    weeklySchedule: value.weeklySchedule.map((day) => ({ ...day })),
    exceptions: value.exceptions.map((exception) => ({ ...exception })),
  }
}

function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function isValidDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function getDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getContractDayOfWeek(date) {
  const day = date.getDay()

  return day === 0 ? 7 : day
}

function combineLocalDateAndTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number)

  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0)
}

function isSameLocalDate(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

function getWorkingRuleForDate(date) {
  const dateKey = getDateKey(date)
  const exception = workingHours.exceptions.find((item) => item.date === dateKey)

  if (exception) {
    return exception
  }

  return workingHours.weeklySchedule.find((day) => day.dayOfWeek === getContractDayOfWeek(date))
}

function getWorkingIntervalForDate(date) {
  const rule = getWorkingRuleForDate(date)

  if (!rule?.isWorking || !rule.startTime || !rule.endTime) {
    return null
  }

  return {
    start: combineLocalDateAndTime(date, rule.startTime),
    end: combineLocalDateAndTime(date, rule.endTime),
  }
}

function isWithinWorkingHours(start, end) {
  if (!isSameLocalDate(start, end)) {
    return false
  }

  const interval = getWorkingIntervalForDate(start)

  return Boolean(interval && start >= interval.start && end <= interval.end)
}

function validateWorkingRule(rule, context) {
  const errors = []
  const isWorking = Boolean(rule.isWorking)
  const value = { isWorking }

  if (isWorking) {
    if (!isValidTime(rule.startTime)) {
      errors.push(`${context}: время начала должно быть в формате HH:mm.`)
    }

    if (!isValidTime(rule.endTime)) {
      errors.push(`${context}: время окончания должно быть в формате HH:mm.`)
    }

    if (isValidTime(rule.startTime) && isValidTime(rule.endTime)) {
      if (timeToMinutes(rule.startTime) >= timeToMinutes(rule.endTime)) {
        errors.push(`${context}: время окончания должно быть позже времени начала.`)
      } else {
        value.startTime = rule.startTime
        value.endTime = rule.endTime
      }
    }
  }

  if (!isWorking && rule.startTime !== undefined && rule.startTime !== null && rule.startTime !== '') {
    if (!isValidTime(rule.startTime)) {
      errors.push(`${context}: время начала должно быть в формате HH:mm.`)
    } else {
      value.startTime = rule.startTime
    }
  }

  if (!isWorking && rule.endTime !== undefined && rule.endTime !== null && rule.endTime !== '') {
    if (!isValidTime(rule.endTime)) {
      errors.push(`${context}: время окончания должно быть в формате HH:mm.`)
    } else {
      value.endTime = rule.endTime
    }
  }

  return { errors, value }
}

function validateWorkingHoursBody(body) {
  const errors = []

  if (!Array.isArray(body.weeklySchedule)) {
    errors.push('Поле weeklySchedule должно быть массивом.')
  }

  if (body.exceptions !== undefined && !Array.isArray(body.exceptions)) {
    errors.push('Поле exceptions должно быть массивом.')
  }

  if (errors.length > 0) {
    return { errors, value: null }
  }

  const seenDays = new Set()
  const weeklySchedule = body.weeklySchedule.map((rule) => {
    const dayOfWeek = Number(rule.dayOfWeek)

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
      errors.push('dayOfWeek должен быть целым числом от 1 до 7.')
    } else if (seenDays.has(dayOfWeek)) {
      errors.push(`День недели ${dayOfWeek} указан больше одного раза.`)
    } else {
      seenDays.add(dayOfWeek)
    }

    const validation = validateWorkingRule(rule, `День недели ${dayOfWeek}`)
    errors.push(...validation.errors)

    return {
      dayOfWeek,
      ...validation.value,
    }
  })

  if (seenDays.size !== 7) {
    errors.push('weeklySchedule должен содержать настройки для всех 7 дней недели.')
  }

  const seenExceptionDates = new Set()
  const exceptions = (body.exceptions ?? []).map((exception) => {
    const date = exception.date

    if (!isValidDateKey(date)) {
      errors.push('Дата исключения должна быть в формате YYYY-MM-DD.')
    } else if (seenExceptionDates.has(date)) {
      errors.push(`Исключение для даты ${date} указано больше одного раза.`)
    } else {
      seenExceptionDates.add(date)
    }

    const validation = validateWorkingRule(exception, `Исключение ${date}`)
    errors.push(...validation.errors)

    return {
      date,
      ...validation.value,
    }
  })

  return {
    errors,
    value: {
      weeklySchedule: weeklySchedule.sort((first, second) => first.dayOfWeek - second.dayOfWeek),
      exceptions: exceptions.sort((first, second) => first.date.localeCompare(second.date)),
    },
  }
}

function validateEventTypeBody(body, isPartial = false) {
  const errors = []
  const next = {}

  if (!isPartial || body.name !== undefined) {
    const name = normalizeOptionalString(body.name)

    if (!name) {
      errors.push('Название типа события обязательно.')
    } else {
      next.name = name
    }
  }

  if (body.description !== undefined) {
    next.description = normalizeOptionalString(body.description)
  }

  if (!isPartial || body.durationMinutes !== undefined) {
    const durationMinutes = Number(body.durationMinutes)

    if (!isValidDuration(durationMinutes)) {
      errors.push('Длительность должна быть целым числом от 1 до 1440 минут.')
    } else {
      next.durationMinutes = durationMinutes
    }
  }

  return { errors, value: next }
}

app.get('/event-types', (_request, response) => {
  response.json(eventTypes)
})

app.post('/event-types', (request, response) => {
  const { errors, value } = validateEventTypeBody(request.body)

  if (errors.length > 0) {
    return sendError(response, 400, errors.join(' '))
  }

  const eventType = {
    id: buildEventTypeId(value.name),
    ...value,
  }

  eventTypes.push(eventType)

  return response.status(201).json(eventType)
})

app.get('/event-types/:id', (request, response) => {
  const eventType = findEventType(request.params.id)

  if (!eventType) {
    return sendError(response, 404, 'Тип события не найден.')
  }

  return response.json(eventType)
})

app.patch('/event-types/:id', (request, response) => {
  const eventType = findEventType(request.params.id)

  if (!eventType) {
    return sendError(response, 404, 'Тип события не найден.')
  }

  const { errors, value } = validateEventTypeBody(request.body, true)

  if (errors.length > 0) {
    return sendError(response, 400, errors.join(' '))
  }

  Object.assign(eventType, value)

  return response.json(eventType)
})

app.delete('/event-types/:id', (request, response) => {
  const eventTypeIndex = eventTypes.findIndex((eventType) => eventType.id === request.params.id)

  if (eventTypeIndex === -1) {
    return sendError(response, 404, 'Тип события не найден.')
  }

  eventTypes.splice(eventTypeIndex, 1)

  return response.status(204).send()
})

app.get('/working-hours', (_request, response) => {
  response.json(cloneWorkingHours(workingHours))
})

app.put('/working-hours', (request, response) => {
  const { errors, value } = validateWorkingHoursBody(request.body)

  if (errors.length > 0) {
    return sendError(response, 400, errors.join(' '))
  }

  workingHours = value

  return response.json(cloneWorkingHours(workingHours))
})

app.get('/slots', (request, response) => {
  const eventTypeId = normalizeOptionalString(request.query.eventTypeId)

  if (!eventTypeId) {
    return sendError(response, 400, 'Параметр eventTypeId обязателен.')
  }

  const eventType = findEventType(eventTypeId)

  if (!eventType) {
    return sendError(response, 404, 'Тип события не найден.')
  }

  const from = parseDateTime(request.query.from)
  const to = parseDateTime(request.query.to)

  if (request.query.from && !from) {
    return sendError(response, 400, 'Параметр from должен быть датой в ISO-формате.')
  }

  if (request.query.to && !to) {
    return sendError(response, 400, 'Параметр to должен быть датой в ISO-формате.')
  }

  const rangeStart = from ?? new Date()
  const rangeEnd = to ?? addMinutes(rangeStart, 24 * 60)

  if (rangeStart >= rangeEnd) {
    return sendError(response, 400, 'Параметр to должен быть позже from.')
  }

  const slots = []
  const now = new Date()
  let day = startOfLocalDay(rangeStart)

  while (day < rangeEnd) {
    const interval = getWorkingIntervalForDate(day)

    if (interval) {
      let start = new Date(interval.start)

      while (addMinutes(start, eventType.durationMinutes) <= interval.end) {
        const end = addMinutes(start, eventType.durationMinutes)

        if (start >= rangeStart && end <= rangeEnd && start >= now) {
          slots.push({
            start: toIsoString(start),
            end: toIsoString(end),
            isAvailable: !isSlotTaken(eventType.id, start, end),
          })
        }

        start = end
      }
    }

    day = addDays(day, 1)
  }

  return response.json(slots)
})

app.get('/bookings', (request, response) => {
  const from = parseDateTime(request.query.from)
  const to = parseDateTime(request.query.to)

  if (request.query.from && !from) {
    return sendError(response, 400, 'Параметр from должен быть датой в ISO-формате.')
  }

  if (request.query.to && !to) {
    return sendError(response, 400, 'Параметр to должен быть датой в ISO-формате.')
  }

  if (from && to && from >= to) {
    return sendError(response, 400, 'Параметр to должен быть позже from.')
  }

  const result = filterByDateRange(bookings, from, to).sort(
    (first, second) => new Date(first.start) - new Date(second.start),
  )

  return response.json(result)
})

app.post('/bookings', (request, response) => {
  const eventTypeId = normalizeOptionalString(request.body.eventTypeId)
  const start = parseDateTime(request.body.start)
  const guestName = normalizeOptionalString(request.body.guestName)
  const guestEmail = normalizeOptionalString(request.body.guestEmail)

  if (!eventTypeId) {
    return sendError(response, 400, 'Поле eventTypeId обязательно.')
  }

  const eventType = findEventType(eventTypeId)

  if (!eventType) {
    return sendError(response, 404, 'Тип события не найден.')
  }

  if (!start) {
    return sendError(response, 400, 'Поле start должно быть датой в ISO-формате.')
  }

  if (!guestName) {
    return sendError(response, 400, 'Имя гостя обязательно.')
  }

  const end = addMinutes(start, eventType.durationMinutes)

  if (start < new Date()) {
    return sendError(response, 400, 'Нельзя создать бронирование в прошлом.')
  }

  if (!isWithinWorkingHours(start, end)) {
    return sendError(response, 400, 'Выбранный слот находится вне рабочего времени.')
  }

  if (isSlotTaken(eventType.id, start, end)) {
    return sendError(response, 409, 'Выбранный слот уже занят.')
  }

  const booking = {
    id: createBookingId(),
    eventTypeId: eventType.id,
    start: toIsoString(start),
    end: toIsoString(end),
    guestName,
    guestEmail,
    createdAt: toIsoString(new Date()),
  }

  bookings.push(booking)

  return response.status(201).json(booking)
})

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath))

  app.get(/.*/, (_request, response) => {
    response.sendFile(frontendIndexPath)
  })
}

app.use((_request, response) => {
  sendError(response, 404, 'Маршрут не найден.')
})

app.listen(port, () => {
  console.log(`Calendar Booking API is running at http://localhost:${port}`)
})
