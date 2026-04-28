import type {
  Booking,
  CreateBookingRequest,
  CreateEventTypeRequest,
  EventType,
  Slot,
  UpdateEventTypeRequest,
  WorkingHours,
} from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type QueryValue = string | number | boolean | undefined | null

function withQuery(path: string, query?: Record<string, QueryValue>) {
  if (!query) {
    return path
  }

  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()

  return queryString ? `${path}?${queryString}` : path
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`

  let response: Response

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(
      `API недоступно по адресу ${url}. Запустите бэкенд или mock API командой npm run mock:api из корня проекта.`,
      0,
    )
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : `API вернул ошибку ${response.status}`

    throw new ApiError(message, response.status)
  }

  return data as T
}

export const api = {
  listEventTypes: () => request<EventType[]>('/event-types'),

  createEventType: (body: CreateEventTypeRequest) =>
    request<EventType>('/event-types', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateEventType: (id: string, body: UpdateEventTypeRequest) =>
    request<EventType>(`/event-types/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteEventType: (id: string) =>
    request<void>(`/event-types/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  listSlots: (query: { eventTypeId: string; from?: string; to?: string }) =>
    request<Slot[]>(withQuery('/slots', query)),

  getWorkingHours: () => request<WorkingHours>('/working-hours'),

  updateWorkingHours: (body: WorkingHours) =>
    request<WorkingHours>('/working-hours', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  listBookings: (query?: { from?: string; to?: string }) =>
    request<Booking[]>(withQuery('/bookings', query)),

  createBooking: (body: CreateBookingRequest) =>
    request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
