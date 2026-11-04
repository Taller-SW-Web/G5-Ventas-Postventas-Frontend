// Layout del portal del Gestor: barra lateral oscura VENTAS / POSTVENTA (Figma, Mockups 01-09).
// El botón de tres líneas alterna el menú expandido y el compacto (solo iconos); en pantallas chicas la barra se
// oculta y se abre con el botón de la cabecera.
import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom';
import { ActionIcon, AppShell, Box, Burger, Group, NavLink, Stack, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconChartBar,
  IconHeadset,
  IconLayoutGrid,
  IconMenu2,
  IconShoppingBag,
  type Icon,
} from '@tabler/icons-react';
import clases from './LayoutGestor.module.css';

interface Acceso {
  etiqueta: string;
  ruta: string;
  icono: Icon;
  /** Otras rutas de la misma sección (Anulaciones es parte del recorrido de Pedidos, Mockup 04). */
  tambien?: string[];
}

const ACCESOS: Acceso[] = [
  { etiqueta: 'Dashboard', ruta: '/admin/dashboard', icono: IconLayoutGrid },
  { etiqueta: 'Pedidos', ruta: '/admin/pedidos', icono: IconShoppingBag, tambien: ['/admin/anulaciones'] },
  { etiqueta: 'Postventa', ruta: '/admin/postventa', icono: IconHeadset },
  { etiqueta: 'Reportes', ruta: '/admin/reportes', icono: IconChartBar },
];

const ANCHO_EXPANDIDO = 236;
const ANCHO_COMPACTO = 76;

/** true si la ruta actual pertenece a la sección del acceso. */
export function accesoActivo(pathname: string, ruta: string, tambien: string[] = []): boolean {
  return [ruta, ...tambien].some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

function Marca({ compacta }: { compacta: boolean }) {
  return (
    <Box
      bg="ink.8"
      px={compacta ? 0 : 'md'}
      py="sm"
      ta={compacta ? 'center' : undefined}
      style={{ borderRadius: 'var(--mantine-radius-md)', borderLeft: '4px solid var(--mantine-color-orange-7)' }}
    >
      <Title order={3} c="cloud.2" lh={1.1}>
        {compacta ? 'V' : 'Ventas'}
      </Title>
      {!compacta && (
        <Text size="xs" c="cloud.5" tt="uppercase">
          Postventa
        </Text>
      )}
    </Box>
  );
}

export function LayoutGestor() {
  const [abierto, { toggle, close }] = useDisclosure();
  const [compacto, { toggle: alternarCompacto }] = useDisclosure(false);
  const { pathname } = useLocation();

  return (
    <AppShell
      header={{ height: { base: 56, sm: 0 } }}
      navbar={{ width: compacto ? ANCHO_COMPACTO : ANCHO_EXPANDIDO, breakpoint: 'sm', collapsed: { mobile: !abierto } }}
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
        <Stack gap="lg">
          <Stack gap="sm" visibleFrom="sm">
            <Marca compacta={compacto} />
            <ActionIcon
              variant="filled"
              color="ink.8"
              size="lg"
              onClick={alternarCompacto}
              aria-label={compacto ? 'Expandir menú' : 'Contraer menú'}
              aria-expanded={!compacto}
              className={clases.alternar}
              style={{ alignSelf: compacto ? 'center' : 'flex-end' }}
            >
              <IconMenu2 size={20} stroke={2} />
            </ActionIcon>
          </Stack>
          <Stack gap={6}>
            {ACCESOS.map((a) => {
              const Icono = a.icono;
              const enlace = (
                <NavLink
                  component={RouterNavLink}
                  to={a.ruta}
                  label={compacto ? undefined : a.etiqueta}
                  aria-label={compacto ? a.etiqueta : undefined}
                  leftSection={<Icono size={20} stroke={2} aria-hidden />}
                  active={accesoActivo(pathname, a.ruta, a.tambien)}
                  onClick={close}
                  className={clases.acceso}
                  data-compacto={compacto || undefined}
                />
              );
              return compacto ? (
                <Tooltip key={a.ruta} label={a.etiqueta} position="right" withArrow>
                  {enlace}
                </Tooltip>
              ) : (
                <Box key={a.ruta}>{enlace}</Box>
              );
            })}
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
