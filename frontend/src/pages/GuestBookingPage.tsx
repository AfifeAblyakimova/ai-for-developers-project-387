import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { api } from '../api/client'
import type { EventType, Slot } from '../api/types'
import {
  formatDate,
  formatDateTime,
  formatTimeRange,
  getBookingWindowDates,
  getDayBounds,
  toDatePickerValue,
} from '../utils/date'

export function GuestBookingPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(toDatePickerValue(new Date()))
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [isLoadingEventTypes, setIsLoadingEventTypes] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedEventType = eventTypes.find((eventType) => eventType.id === selectedEventTypeId)
  const selectedSlot = slots.find((slot) => slot.start === selectedSlotStart)
  const bookingWindow = useMemo(() => getBookingWindowDates(), [])

  const eventTypeOptions = useMemo(
    () =>
      eventTypes.map((eventType) => ({
        value: eventType.id,
        label: `${eventType.name} (${eventType.durationMinutes} мин)`,
      })),
    [eventTypes],
  )

  async function loadEventTypes() {
    setIsLoadingEventTypes(true)
    setError(null)

    try {
      const data = await api.listEventTypes()
      setEventTypes(data)
      setSelectedEventTypeId((current) => current ?? data[0]?.id ?? null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить типы событий')
    } finally {
      setIsLoadingEventTypes(false)
    }
  }

  async function loadSlots(eventTypeId: string, date: string) {
    setIsLoadingSlots(true)
    setError(null)
    setSelectedSlotStart(null)

    try {
      const day = getDayBounds(date)
      const data = await api.listSlots({
        eventTypeId,
        from: day.from,
        to: day.to,
      })
      setSlots(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить слоты')
    } finally {
      setIsLoadingSlots(false)
    }
  }

  useEffect(() => {
    void loadEventTypes()
  }, [])

  useEffect(() => {
    if (selectedEventTypeId) {
      void loadSlots(selectedEventTypeId, selectedDate)
    } else {
      setSlots([])
    }
  }, [selectedEventTypeId, selectedDate])

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedEventTypeId || !selectedSlotStart || !guestName.trim()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await api.createBooking({
        eventTypeId: selectedEventTypeId,
        start: selectedSlotStart,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim() || undefined,
      })

      notifications.show({
        title: 'Бронирование создано',
        message: 'Встреча успешно добавлена в календарь.',
        color: 'green',
      })

      setGuestName('')
      setGuestEmail('')
      await loadSlots(selectedEventTypeId, selectedDate)
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Не удалось создать бронирование'
      setError(message)
      notifications.show({
        title: 'Ошибка бронирования',
        message,
        color: 'red',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Paper withBorder radius="lg" p="xl">
          <Stack gap="sm">
            <Badge variant="light">Публичная страница</Badge>
            <Title order={1}>Страница бронирования для гостя</Title>
            <Text c="dimmed">
              Эту страницу можно отправить пользователю: он выбирает тип встречи, дату в
              ближайшие 14 дней и свободный слот на выбранную дату.
            </Text>
          </Stack>
        </Paper>

        {error ? (
          <Alert color="red" title="Ошибка">
            {error}
          </Alert>
        ) : null}

        <Card withBorder radius="lg" p="lg">
          <Stack>
            <Group justify="space-between" align="end">
              <Select
                label="Тип события"
                placeholder={isLoadingEventTypes ? 'Загрузка...' : 'Выберите тип'}
                data={eventTypeOptions}
                value={selectedEventTypeId}
                onChange={setSelectedEventTypeId}
                disabled={isLoadingEventTypes}
                searchable
              />
              {isLoadingEventTypes ? <Loader size="sm" /> : null}
            </Group>

            {selectedEventType ? (
              <Paper withBorder radius="md" p="md">
                <Stack gap={4}>
                  <Text fw={700}>{selectedEventType.name}</Text>
                  <Text c="dimmed">{selectedEventType.description || 'Описание не указано'}</Text>
                  <Text size="sm">Длительность: {selectedEventType.durationMinutes} мин</Text>
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </Card>

        <Card withBorder radius="lg" p="lg">
          <Stack>
            <Group justify="space-between">
              <Stack gap={0}>
                <Title order={2}>Дата и слоты</Title>
                <Text size="sm" c="dimmed">
                  Выбрана дата: {formatDate(selectedDate)}
                </Text>
              </Stack>
              {isLoadingSlots ? <Loader size="sm" /> : null}
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Paper withBorder radius="md" p="md">
                  <DatePicker
                    value={selectedDate}
                    onChange={(value) => {
                      if (value) {
                        setSelectedDate(value)
                      }
                    }}
                    minDate={bookingWindow.minDate}
                    maxDate={bookingWindow.maxDate}
                    allowDeselect={false}
                  />
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 7 }}>
                <Stack gap="sm">
                  {!isLoadingSlots && slots.length === 0 ? (
                    <Text c="dimmed">На выбранную дату свободных слотов нет.</Text>
                  ) : null}

                  {slots.map((slot) => (
                    <Card
                      key={slot.start}
                      withBorder
                      radius="md"
                      shadow={selectedSlotStart === slot.start ? 'md' : undefined}
                    >
                      <Group justify="space-between" align="center">
                        <Stack gap={2}>
                          <Text fw={700}>{formatTimeRange(slot.start, slot.end)}</Text>
                          <Text size="sm" c="dimmed">
                            {formatDateTime(slot.start)}
                          </Text>
                        </Stack>
                        <Group>
                          <Badge color={slot.isAvailable ? 'green' : 'gray'}>
                            {slot.isAvailable ? 'Свободно' : 'Занято'}
                          </Badge>
                          <Button
                            variant={selectedSlotStart === slot.start ? 'filled' : 'light'}
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedSlotStart(slot.start)}
                          >
                            Выбрать
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>

        <Card withBorder radius="lg" p="lg" component="form" onSubmit={handleBookingSubmit}>
          <Stack>
            <Title order={2}>Подтверждение</Title>
            <Text c="dimmed">
              {selectedSlot
                ? `Выбран слот: ${formatDateTime(selectedSlot.start)}`
                : 'Сначала выберите свободный слот.'}
            </Text>
            <TextInput
              label="Имя гостя"
              value={guestName}
              onChange={(event) => setGuestName(event.currentTarget.value)}
              required
            />
            <TextInput
              label="Email (необязательно)"
              type="email"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.currentTarget.value)}
            />
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!selectedEventTypeId || !selectedSlotStart || !guestName.trim()}
            >
              Создать бронирование
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
