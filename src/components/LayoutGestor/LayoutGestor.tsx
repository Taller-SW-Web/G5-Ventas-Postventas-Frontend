// Layout del portal del Gestor: barra lateral oscura VENTAS / POSTVENTA (Figma, Mockups 01-09).
// En pantallas chicas la barra se oculta y se abre con el botón de menú.
import { NavLink as RouterNavLink, Outlet } from 'react-router-dom';
import { AppShell, Box, Burger, Group, NavLink, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import clases from './LayoutGestor.module.css';

const ACCESOS = [
  { etiqueta: 'Dashboard', ruta: '/admin/dashboard' },
  { etiqueta: 'Pedidos', ruta: '/admin/pedidos' },
  { etiqueta: 'Postventa', ruta: '/admin/postventa' },
  { etiqueta: 'Reportes', ruta: '/admin/reportes' },
];

function Marca() {
  return (
    <Box
      bg="ink.8"
      px="md"
      py="sm"
      style={{ borderRadius: 'var(--mantine-radius-md)', borderLeft: '4px solid var(--mantine-color-orange-7)' }}
    >
      <Title order={3} c="cloud.2" lh={1.1}>
        Ventas
      </Title>
      <Text size="xs" c="cloud.5" tt="uppercase">
        Postventa
      </Text>
    </Box>
  );
}

export function LayoutGestor() {
  const [abierto, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: { base: 56, sm: 0 } }}
      navbar={{ width: 236, breakpoint: 'sm', collapsed: { mobile: !abierto } }}
      padding="lg"
      bg="cloud.2"
    >
      <AppShell.Header bg="ink.9" hiddenFrom="sm" withBorder={false}>
        <Group h="100%" px="md">
          <Burger opened={abierto} onClick={toggle} size="sm" color="white" aria-label="Abrir menú" />
          <Title order={3} c="cloud.2">
            Ventas / Postventa
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="ink.9" withBorder={false}>
        <Stack gap="xl">
          <Box visibleFrom="sm">
            <Marca />
          </Box>
          <Stack gap={6}>
            {ACCESOS.map((a) => (
              <NavLink
                key={a.ruta}
                component={RouterNavLink}
                to={a.ruta}
                label={a.etiqueta}
                onClick={close}
                className={clases.acceso}
              />
            ))}
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
