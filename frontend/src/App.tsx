import { AppShell, Burger, Button, Container, Group, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Link, NavLink as RouterNavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminBookingsPage } from './pages/AdminBookingsPage'
import { AdminEventTypesPage } from './pages/AdminEventTypesPage'
import { AdminPage } from './pages/AdminPage'
import { AdminWorkingHoursPage } from './pages/AdminWorkingHoursPage'
import { GuestBookingPage } from './pages/GuestBookingPage'

function PublicLayout() {
  return (
    <AppShell header={{ height: 64 }} padding={0}>
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Text fw={800}>Calendar Booking</Text>
            <Button component={Link} to="/admin" variant="subtle" size="sm">
              Админка
            </Button>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

function AdminLayout() {
  const [opened, { toggle, close }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding={0}
    >
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Group>
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Text fw={800}>Админка Calendar Booking</Text>
            </Group>
            <Button component={Link} to="/booking" variant="subtle" size="sm">
              Страница гостя
            </Button>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <nav className="app-nav" onClick={close}>
          <RouterNavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Обзор
          </RouterNavLink>
          <RouterNavLink
            to="/admin/event-types"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Типы событий
          </RouterNavLink>
          <RouterNavLink
            to="/admin/bookings"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Предстоящие встречи
          </RouterNavLink>
          <RouterNavLink
            to="/admin/working-hours"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Рабочее время
          </RouterNavLink>
        </nav>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Navigate to="/booking" replace />} />
        <Route path="/booking" element={<GuestBookingPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path="/admin/event-types" element={<AdminEventTypesPage />} />
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/working-hours" element={<AdminWorkingHoursPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/booking" replace />} />
    </Routes>
  )
}

export default App
