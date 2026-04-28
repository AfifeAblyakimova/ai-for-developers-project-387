import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { api } from '../api/client'
import type { Booking, EventType } from '../api/types'
import { formatDateTime, formatTimeRange } from '../utils/date'

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const eventTypesById = useMemo(
    () => new Map(eventTypes.map((eventType) => [eventType.id, eventType])),
    [eventTypes],
  )

  const visibleBookings = useMemo(() => {
    const now = Date.now()

    return bookings
      .filter((booking) => new Date(booking.start).getTime() >= now)
      .filter((booking) => !eventTypeFilter || booking.eventTypeId === eventTypeFilter)
      .sort((first, second) => new Date(first.start).getTime() - new Date(second.start).getTime())
  }, [bookings, eventTypeFilter])

  const eventTypeOptions = eventTypes.map((eventType) => ({
    value: eventType.id,
    label: eventType.name,
  }))

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const [eventTypesData, bookingsData] = await Promise.all([
          api.listEventTypes(),
          api.listBookings({ from: new Date().toISOString() }),
        ])

        setEventTypes(eventTypesData)
        setBookings(bookingsData)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить встречи')
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [])

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Paper withBorder radius="lg" p="xl">
          <Title order={1}>Предстоящие встречи</Title>
          <Text c="dimmed">
            Единый список бронирований всех типов событий для владельца календаря.
          </Text>
        </Paper>

        {error ? (
          <Alert color="red" title="Ошибка">
            {error}
          </Alert>
        ) : null}

        <Card withBorder radius="lg" p="lg">
          <Group justify="space-between" align="end" mb="md">
            <Select
              label="Фильтр по типу события"
              placeholder="Все типы"
              data={eventTypeOptions}
              value={eventTypeFilter}
              onChange={setEventTypeFilter}
              clearable
              searchable
            />
            {isLoading ? <Loader size="sm" /> : <Badge variant="light">{visibleBookings.length}</Badge>}
          </Group>

          {!isLoading && visibleBookings.length === 0 ? (
            <Text c="dimmed">Предстоящих встреч нет.</Text>
          ) : (
            <Table.ScrollContainer minWidth={820}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Дата и время</Table.Th>
                    <Table.Th>Тип события</Table.Th>
                    <Table.Th>Гость</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Создано</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {visibleBookings.map((booking) => {
                    const eventType = eventTypesById.get(booking.eventTypeId)

                    return (
                      <Table.Tr key={booking.id}>
                        <Table.Td>
                          <Text fw={700}>{formatDateTime(booking.start)}</Text>
                          <Text size="xs" c="dimmed">
                            {formatTimeRange(booking.start, booking.end)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {eventType ? (
                            <Stack gap={2}>
                              <Text>{eventType.name}</Text>
                              <Text size="xs" c="dimmed">
                                {eventType.durationMinutes} мин
                              </Text>
                            </Stack>
                          ) : (
                            <Text c="dimmed">id: {booking.eventTypeId}</Text>
                          )}
                        </Table.Td>
                        <Table.Td>{booking.guestName}</Table.Td>
                        <Table.Td>{booking.guestEmail || '—'}</Table.Td>
                        <Table.Td>{formatDateTime(booking.createdAt)}</Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Card>
      </Stack>
    </Container>
  )
}
