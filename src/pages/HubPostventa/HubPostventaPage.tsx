// Mockup 05 — Hub Postventa (F3 + F4 + F6). Responsable: Joseph
// Punto de entrada a Devoluciones, Reclamos y Reembolsos. Solo navegación y conteos, sin decisiones.
// Detalle de la pantalla: diseno/mockups/Mockup 05 - Hub Postventa.md
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Center,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import { obtenerResumenPostventa, type IndicadorPostventa } from './resumenPostventa';

// Cada área repite su color e ícono en el indicador y en la tarjeta de acceso (Figma).
interface Area {
  clave: 'devoluciones' | 'reclamos' | 'reembolsos';
  titulo: string;
  indicador: string;
  pildora: (cantidad: number) => string;
  simbolo: string;
  color: string;
  ruta: string;
  /** El indicador superior abre Atención prioritaria filtrada; Reembolsos va directo a su bandeja. */
  rutaIndicador: string;
}

const AREAS: Area[] = [
  {
    clave: 'devoluciones',
    titulo: 'Devoluciones y cambios',
    indicador: 'Devoluciones pendientes',
    pildora: (n) => `${n} pendientes`,
    simbolo: '↺',
    color: 'orange',
    ruta: '/admin/postventa/devoluciones',
    rutaIndicador: '/admin/postventa/prioritarios?tipo=DEVOLUCIONES',
  },
  {
    clave: 'reclamos',
    titulo: 'Reclamos',
    indicador: 'Reclamos abiertos',
    pildora: (n) => `${n} abiertos`,
    simbolo: '!',
    color: 'signal',
    ruta: '/admin/postventa/reclamos',
    rutaIndicador: '/admin/postventa/prioritarios?tipo=RECLAMOS',
  },
  {
    clave: 'reembolsos',
    titulo: 'Reembolsos',
    indicador: 'Reembolsos en proceso',
    pildora: (n) => `${n} en proceso`,
    simbolo: '↶',
    color: 'volt',
    ruta: '/admin/postventa/reembolsos',
    rutaIndicador: '/admin/postventa/reembolsos',
  },
];

// Tono del texto sobre el fondo suave de cada color (volt claro no tiene contraste suficiente).
const TONO_TEXTO: Record<string, string> = { orange: 'orange.7', signal: 'signal.6', volt: 'volt.9' };

function Simbolo({ area, tamano }: { area: Area; tamano: number }) {
  return (
    <Center
      bg={`${area.color}.1`}
      w={tamano}
      h={tamano}
      style={{ borderRadius: tamano > 50 ? 14 : 12, flexShrink: 0 }}
      aria-hidden
    >
      <Text fw={700} fz={tamano > 50 ? 26 : 22} c={TONO_TEXTO[area.color]} lh={1}>
        {area.simbolo}
      </Text>
    </Center>
  );
}

function TarjetaIndicador({ area, dato, onClick }: { area: Area; dato: IndicadorPostventa; onClick: () => void }) {
  return (
    <UnstyledButton onClick={onClick} aria-label={`${area.indicador}: ${dato.cantidad ?? 'no disponible'}`}>
      <Paper withBorder radius="md" p="md" shadow="xs" h="100%">
        <Group align="flex-start" wrap="nowrap" gap="md">
          <Simbolo area={area} tamano={46} />
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              {area.indicador}
            </Text>
            <Text fz={28} fw={700} lh={1.2}>
              {dato.cantidad ?? '—'}
            </Text>
            <Badge color="gray" variant="light" tt="none" radius="xl" w="fit-content">
              {dato.detalle}
            </Badge>
          </Stack>
        </Group>
      </Paper>
    </UnstyledButton>
  );
}

function TarjetaModulo({ area, dato, onIr }: { area: Area; dato: IndicadorPostventa; onIr: () => void }) {
  return (
    <Paper withBorder radius="md" p="lg" shadow="xs">
      <Stack align="center" gap="md">
        <Simbolo area={area} tamano={68} />
        <Text fz="lg" fw={600} ta="center">
          {area.titulo}
        </Text>
        <Badge color={area.color} variant="light" tt="none" radius="xl" c={TONO_TEXTO[area.color]}>
          {dato.cantidad === null ? 'No disponible' : area.pildora(dato.cantidad)}
        </Badge>
        <Button fullWidth mt="sm" onClick={onIr}>
          Ir al módulo →
        </Button>
      </Stack>
    </Paper>
  );
}

export function HubPostventaPage() {
  const navigate = useNavigate();
  const resumen = useConsulta(obtenerResumenPostventa, []);

  return (
    <Stack gap="xl">
      <Title order={1}>Postventa</Title>

      <EstadoCarga
        cargando={resumen.cargando}
        error={resumen.error}
        datos={resumen.datos}
        onReintentar={resumen.recargar}
      >
        {(datos) => (
          <Stack gap="xl">
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              {AREAS.map((a) => (
                <TarjetaIndicador
                  key={a.clave}
                  area={a}
                  dato={datos[a.clave]}
                  onClick={() => navigate(a.rutaIndicador)}
                />
              ))}
            </SimpleGrid>

            <Stack gap="md">
              <Title order={2} size="h3">
                Accesos a módulos
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 3 }}>
                {AREAS.map((a) => (
                  <TarjetaModulo key={a.clave} area={a} dato={datos[a.clave]} onIr={() => navigate(a.ruta)} />
                ))}
              </SimpleGrid>
            </Stack>
          </Stack>
        )}
      </EstadoCarga>

      <Paper withBorder radius="md" p="md" shadow="xs">
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group wrap="nowrap" gap="md">
            <Center bg="yellow.1" w={44} h={44} style={{ borderRadius: 11, flexShrink: 0 }} aria-hidden>
              <Text fw={700} fz={18} c="yellow.9">
                ◷
              </Text>
            </Center>
            <Stack gap={2}>
              <Title order={3} size="h4">
                Atención prioritaria
              </Title>
              <Text size="sm" c="dimmed">
                Revisa primero los reclamos por SLA y luego los expedientes pendientes de evaluación
              </Text>
            </Stack>
          </Group>
          <Button variant="default" w={232} onClick={() => navigate('/admin/postventa/prioritarios')}>
            Ver casos prioritarios
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
