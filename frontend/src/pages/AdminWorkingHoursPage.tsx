import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api/client'
import type { WeeklyWorkingDay, WorkingHours, WorkingHoursException } from '../api/types'

const dayNames = new Map([
  [1, 'Понедельник'],
  [2, 'Вторник'],
  [3, 'Среда'],
  [4, 'Четверг'],
  [5, 'Пятница'],
  [6, 'Суббота'],
  [7, 'Воскресенье'],
])

const initialExceptionForm: WorkingHoursException = {
  date: '',
  isWorking: false,
  startTime: '09:00',
  endTime: '18:00',
}

function byDayOfWeek(first: WeeklyWorkingDay, second: WeeklyWorkingDay) {
  return first.dayOfWeek - second.dayOfWeek
}

function byDate(first: WorkingHoursException, second: WorkingHoursException) {
  return first.date.localeCompare(second.date)
}

export function AdminWorkingHoursPage() {
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null)
  const [exceptionForm, setExceptionForm] = useState<WorkingHoursException>(initialExceptionForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weeklySchedule = useMemo(
    () => [...(workingHours?.weeklySchedule ?? [])].sort(byDayOfWeek),
    [workingHours],
  )

  async function loadWorkingHours() {
    setIsLoading(true)
    setError(null)

    try {
      setWorkingHours(await api.getWorkingHours())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить рабочее время')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadWorkingHours()
  }, [])

  function updateWeeklyDay(dayOfWeek: number, patch: Partial<WeeklyWorkingDay>) {
    setWorkingHours((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        weeklySchedule: current.weeklySchedule
          .map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day))
          .sort(byDayOfWeek),
      }
    })
  }

  function addException() {
    if (!exceptionForm.date || !workingHours) {
      return
    }

    const exception: WorkingHoursException = {
      date: exceptionForm.date,
      isWorking: exceptionForm.isWorking,
      ...(exceptionForm.isWorking
        ? {
            startTime: exceptionForm.startTime,
            endTime: exceptionForm.endTime,
          }
        : {}),
    }

    setWorkingHours({
      ...workingHours,
      exceptions: [
        ...workingHours.exceptions.filter((item) => item.date !== exception.date),
        exception,
      ].sort(byDate),
    })
    setExceptionForm(initialExceptionForm)
  }

  function removeException(date: string) {
    setWorkingHours((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        exceptions: current.exceptions.filter((exception) => exception.date !== date),
      }
    })
  }

  async function saveWorkingHours() {
    if (!workingHours) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      setWorkingHours(await api.updateWorkingHours(workingHours))
      notifications.show({
        title: 'Рабочее время сохранено',
        message: 'Доступные слоты обновятся по новым правилам.',
        color: 'green',
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Не удалось сохранить рабочее время'
      setError(message)
      notifications.show({
        title: 'Ошибка сохранения',
        message,
        color: 'red',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Paper withBorder radius="lg" p="xl">
          <Title order={1}>Рабочее время</Title>
          <Text c="dimmed">
            Настройте дни и часы, в которые гости могут выбирать слоты для бронирования.
          </Text>
        </Paper>

        {error ? (
          <Alert color="red" title="Ошибка">
            {error}
          </Alert>
        ) : null}

        <Card withBorder radius="lg" p="lg">
          <Group justify="space-between" mb="md">
            <Title order={2}>Недельное расписание</Title>
            {isLoading ? <Loader size="sm" /> : null}
          </Group>

          <Table.ScrollContainer minWidth={720}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>День</Table.Th>
                  <Table.Th>Рабочий день</Table.Th>
                  <Table.Th>Начало</Table.Th>
                  <Table.Th>Окончание</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {weeklySchedule.map((day) => (
                  <Table.Tr key={day.dayOfWeek}>
                    <Table.Td>
                      <Text fw={700}>{dayNames.get(day.dayOfWeek)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={day.isWorking}
                        onChange={(event) =>
                          updateWeeklyDay(day.dayOfWeek, { isWorking: event.currentTarget.checked })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        type="time"
                        value={day.startTime ?? '09:00'}
                        disabled={!day.isWorking}
                        onChange={(event) =>
                          updateWeeklyDay(day.dayOfWeek, { startTime: event.currentTarget.value })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        type="time"
                        value={day.endTime ?? '18:00'}
                        disabled={!day.isWorking}
                        onChange={(event) =>
                          updateWeeklyDay(day.dayOfWeek, { endTime: event.currentTarget.value })
                        }
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>

        <Card withBorder radius="lg" p="lg">
          <Stack>
            <Title order={2}>Исключения по датам</Title>
            <Text c="dimmed">
              Исключение переопределяет обычный день недели: можно сделать дату выходной или задать
              короткий рабочий день.
            </Text>

            <Group align="end">
              <TextInput
                label="Дата"
                type="date"
                value={exceptionForm.date}
                onChange={(event) =>
                  setExceptionForm((current) => ({ ...current, date: event.currentTarget.value }))
                }
              />
              <Switch
                label="Рабочий день"
                checked={exceptionForm.isWorking}
                onChange={(event) =>
                  setExceptionForm((current) => ({
                    ...current,
                    isWorking: event.currentTarget.checked,
                  }))
                }
              />
              <TextInput
                label="Начало"
                type="time"
                value={exceptionForm.startTime ?? '09:00'}
                disabled={!exceptionForm.isWorking}
                onChange={(event) =>
                  setExceptionForm((current) => ({
                    ...current,
                    startTime: event.currentTarget.value,
                  }))
                }
              />
              <TextInput
                label="Окончание"
                type="time"
                value={exceptionForm.endTime ?? '18:00'}
                disabled={!exceptionForm.isWorking}
                onChange={(event) =>
                  setExceptionForm((current) => ({ ...current, endTime: event.currentTarget.value }))
                }
              />
              <Button onClick={addException} disabled={!exceptionForm.date || !workingHours}>
                Добавить
              </Button>
            </Group>

            {!workingHours?.exceptions.length ? (
              <Text c="dimmed">Исключений пока нет.</Text>
            ) : (
              <Table.ScrollContainer minWidth={720}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Дата</Table.Th>
                      <Table.Th>Статус</Table.Th>
                      <Table.Th>Время</Table.Th>
                      <Table.Th>Действия</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {workingHours.exceptions.map((exception) => (
                      <Table.Tr key={exception.date}>
                        <Table.Td>{exception.date}</Table.Td>
                        <Table.Td>{exception.isWorking ? 'Рабочий день' : 'Выходной'}</Table.Td>
                        <Table.Td>
                          {exception.isWorking
                            ? `${exception.startTime} - ${exception.endTime}`
                            : '—'}
                        </Table.Td>
                        <Table.Td>
                          <Button
                            size="xs"
                            color="red"
                            variant="light"
                            onClick={() => removeException(exception.date)}
                          >
                            Удалить
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Stack>
        </Card>

        <Group justify="flex-end">
          <Button onClick={() => void saveWorkingHours()} loading={isSaving} disabled={!workingHours}>
            Сохранить рабочее время
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
