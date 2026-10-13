// Layout del portal del Gestor: barra lateral fija VENTAS / POSTVENTA (Mockup 01).
import { NavLink as RouterNavLink, Outlet } from 'react-router-dom';
import { AppShell, Burger, Group, NavLink, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

const ACCESOS = [
  { etiqueta: 'Dashboard', ruta: '/admin/dashboard' },
  { etiqueta: 'Pedidos', ruta: '/admin/pedidos' },
  { etiqueta: 'Postventa', ruta: '/admin/postventa' },
  { etiqueta: 'Reportes', ruta: '/admin/reportes' },
];

export function LayoutGestor() {
  const [abierto, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60, collapsed: false }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !abierto } }}
      padding="lg"
    >
      <AppShell.Header bg="ink.9" c="cloud.2">
        <Group h="100%" px="md">
          <Burger opened={abierto} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
          <Title order={3} c="cloud.2">
            Ventas / Postventa
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" fw={600} px="sm" pb={4}>
            MÓDULO D
          </Text>
          {ACCESOS.map((a) => (
            <NavLink
              key={a.ruta}
              component={RouterNavLink}
              to={a.ruta}
              label={a.etiqueta}
              onClick={close}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
