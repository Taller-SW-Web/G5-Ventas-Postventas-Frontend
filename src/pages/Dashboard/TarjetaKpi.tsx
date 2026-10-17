// Tarjeta de indicador del Dashboard y de Reportes (Figma: borde lateral, ícono, categoría, valor, variación y pie).
// Un solo color de acento (naranja del theme): la paleta de 5 colores del mockup se va a corregir (guía frontend).
import { Badge, Box, Center, Divider, Group, Paper, Stack, Text } from '@mantine/core';

interface Props {
  /** Etiqueta corta en mayúsculas, ej. "ANULACIONES". */
  categoria: string;
  titulo: string;
  valor: string;
  /** Símbolo del ícono (el proyecto todavía no tiene librería de íconos). */
  icono: string;
  /** Variación ya calculada; null = sin comparación posible (no se muestra la píldora). */
  variacion?: number | null;
  /** '%' para cantidades, 'pp' para tasas, 'pts' para CSAT. */
  unidad?: '%' | 'pp' | 'pts';
  /** true si subir es malo (anulaciones, devoluciones, reclamos). */
  menosEsMejor?: boolean;
  /** Texto bajo la línea, ej. "vs. periodo anterior". */
  pie?: string;
  /** false: el dato todavía no lo entrega el backend (se muestra "—" y el aviso). */
  disponible?: boolean;
}

function textoVariacion(variacion: number, unidad: '%' | 'pp' | 'pts'): string {
  const redondeada = Math.round(variacion * 10) / 10;
  const signo = redondeada > 0 ? '+' : redondeada < 0 ? '−' : '';
  return `${signo}${Math.abs(redondeada).toLocaleString('es-PE')}${unidad === '%' ? '%' : ` ${unidad}`}`;
}

export function TarjetaKpi({
  categoria,
  titulo,
  valor,
  icono,
  variacion = null,
  unidad = '%',
  menosEsMejor = false,
  pie,
  disponible = true,
}: Props) {
  let colorVariacion = 'gray';
  if (variacion !== null && Math.round(variacion * 10) !== 0) {
    const mejora = menosEsMejor ? variacion < 0 : variacion > 0;
    colorVariacion = mejora ? 'green' : 'red';
  }

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      h="100%"
      style={{ borderLeft: '4px solid var(--mantine-color-orange-6)' }}
    >
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <Center w={40} h={40} bg="cloud.2" style={{ borderRadius: 'var(--mantine-radius-md)', flexShrink: 0 }}>
          <Text fw={700} c="orange.7" aria-hidden>
            {icono}
          </Text>
        </Center>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text size="xs" fw={700} c="orange.7" tt="uppercase">
              {categoria}
            </Text>
            {disponible && variacion !== null && (
              <Badge variant="light" color={colorVariacion} size="sm" tt="none">
                {textoVariacion(variacion, unidad)}
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {titulo}
          </Text>
          <Text fz={26} fw={700} lh={1.2}>
            {disponible ? valor : '—'}
          </Text>
          <Divider my={4} />
          <Box>
            <Text size="xs" c="dimmed">
              {disponible ? pie : 'Aún no disponible en el servicio de métricas'}
            </Text>
          </Box>
        </Stack>
      </Group>
    </Paper>
  );
}
