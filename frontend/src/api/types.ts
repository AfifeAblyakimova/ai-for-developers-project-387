export type EventType = {
  id: string
  name: string
  description?: string
  durationMinutes: number
}

export type Booking = {
  id: string
  eventTypeId: string
  start: string
  end: string
  guestName: string
  guestEmail?: string
  createdAt: string
}

export type Slot = {
  start: string
  end: string
  isAvailable: boolean
}

export type WeeklyWorkingDay = {
  dayOfWeek: number
  isWorking: boolean
  startTime?: string
  endTime?: string
}

export type WorkingHoursException = {
  date: string
  isWorking: boolean
  startTime?: string
  endTime?: string
}

export type WorkingHours = {
  weeklySchedule: WeeklyWorkingDay[]
  exceptions: WorkingHoursException[]
}

export type CreateEventTypeRequest = {
  name: string
  description?: string
  durationMinutes: number
}

export type UpdateEventTypeRequest = Partial<CreateEventTypeRequest>

export type CreateBookingRequest = {
  eventTypeId: string
  start: string
  guestName: string
  guestEmail?: string
}
