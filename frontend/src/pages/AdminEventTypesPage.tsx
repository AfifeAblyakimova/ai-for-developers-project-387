import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Container,
  Group,
  Loader,
  NumberInput,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api/client'
import type { EventType } from '../api/types'

type FormState = {
  name: string
  description: string
  durationMinutes: number
}

const initialFormState: FormState = {
  name: '',
  description: '',
  durationMinutes: 30,
}

export function AdminEventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [form, setForm] = useState<FormState>(initialFormState)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadEventTypes() {
    setIsLoading(true)
    setError(null)

    try {
      setEventTypes(await api.listEventTypes())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить типы событий')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEventTypes()
  }, [])

  function resetForm() {
    setForm(initialFormState)
    setEditingId(null)
  }

  function startEditing(eventType: EventType) {
    setEditingId(eventType.id)
    setForm({
      name: eventType.name,
      description: eventType.description ?? '',
      durationMinutes: eventType.durationMinutes,
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setError(null)

    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: form.durationMinutes,
      }

      if (editingId) {
        await api.updateEventType(editingId, body)
        notifications.show({
          title: 'Тип события обновлен',
          message: 'Изменения сохранены.',
          color: 'green',
        })
      } else {
        await api.createEventType(body)
        notifications.show({
          title: 'Тип события создан',
          message: 'Новый тип доступен гостям.',
          color: 'green',
        })
      }

      resetForm()
      await loadEventTypes()
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Не удалось сохранить тип события'
      setError(message)
      notifications.show({
        title: 'Ошибка сохранения',
        message,
        color: 'red',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setError(null)

    try {
      await api.deleteEventType(id)
      notifications.show({
        title: 'Тип события удален',
        message: 'Список обновлен.',
        color: 'green',
      })
      await loadEventTypes()
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Не удалось удалить тип события'
      setError(message)
      notifications.show({
        title: 'Ошибка удаления',
        message,
        color: 'red',
      })
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Paper withBorder radius="lg" p="xl">
          <Title order={1}>Типы событий</Title>
          <Text c="dimmed">
            Админская часть для владельца календаря: создание, редактирование и удаление видов
            встреч.
          </Text>
        </Paper>

        {error ? (
          <Alert color="red" title="Ошибка">
            {error}
          </Alert>
        ) : null}

        <Card withBorder radius="lg" p="lg" component="form" onSubmit={handleSubmit}>
          <Stack>
            <Title order={2}>{editingId ? 'Редактировать тип' : 'Создать тип события'}</Title>
            <TextInput
              label="Название"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.currentTarget.value }))}
              required
            />
            <Textarea
              label="Описание"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.currentTarget.value }))
              }
              autosize
              minRows={2}
            />
            <NumberInput
              label="Длительность, минут"
              min={1}
              value={form.durationMinutes}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  durationMinutes: typeof value === 'number' ? value : Number(value) || 1,
                }))
              }
              required
            />
            <Group>
              <Button type="submit" loading={isSubmitting} disabled={!form.name.trim()}>
                {editingId ? 'Сохранить' : 'Создать'}
              </Button>
              {editingId ? (
                <Button variant="subtle" onClick={resetForm}>
                  Отменить
                </Button>
              ) : null}
            </Group>
          </Stack>
        </Card>

        <Card withBorder radius="lg" p="lg">
          <Group justify="space-between" mb="md">
            <Title order={2}>Список типов</Title>
            {isLoading ? <Loader size="sm" /> : null}
          </Group>

          {!isLoading && eventTypes.length === 0 ? (
            <Text c="dimmed">Типы событий еще не созданы.</Text>
          ) : (
            <Table.ScrollContainer minWidth={720}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Название</Table.Th>
                    <Table.Th>Описание</Table.Th>
                    <Table.Th>Длительность</Table.Th>
                    <Table.Th>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {eventTypes.map((eventType) => (
                    <Table.Tr key={eventType.id}>
                      <Table.Td>
                        <Text fw={700}>{eventType.name}</Text>
                        <Text size="xs" c="dimmed">
                          id: {eventType.id}
                        </Text>
                      </Table.Td>
                      <Table.Td>{eventType.description || '—'}</Table.Td>
                      <Table.Td>{eventType.durationMinutes} мин</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button size="xs" variant="light" onClick={() => startEditing(eventType)}>
                            Изменить
                          </Button>
                          <Button
                            size="xs"
                            color="red"
                            variant="light"
                            onClick={() => void handleDelete(eventType.id)}
                          >
                            Удалить
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Card>
      </Stack>
    </Container>
  )
}
