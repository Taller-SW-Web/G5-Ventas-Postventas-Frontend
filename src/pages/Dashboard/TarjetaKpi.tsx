// Tarjeta de indicador del Dashboard: valor del periodo y variación contra el periodo anterior.
// Un solo color de acento (naranja del theme): la paleta de 5 colores del mockup se va a corregir (guía frontend).
import { Group, Paper, Stack, Text } from '@mantine/core';

interface Props {
  titulo: string;
  valor: string;
  /** Variación ya calculada; null = sin comparación posible. */
  variacion: number | null;
  /** '%' para cantidades, 'pp' para tasas, 'pts' para CSAT. */
  unidad: '%' | 'pp' | 'pts';
  /** true si subir es malo (anulaciones, devoluciones, reclamos). */
  menosEsMejor?: boolean;
  ayuda?: string;
}

export function TarjetaKpi({ titulo, valor, variacion, unidad, menosEsMejor = false, ayuda }: Props) {
  let texto = 'Sin comparación';
  let color = 'dimmed';
  if (variacion !== null) {
    const redondeada = Math.round(variacion * 10) / 10;
    const signo = redondeada > 0 ? '+' : redondeada < 0 ? '−' : '';
    texto = `${signo}${Math.abs(redondeada).toLocaleString('es-PE')}${unidad === '%' ? '%' : ` ${unidad}`} vs periodo anterior`;
    if (redondeada !== 0) {
      const mejora = menosEsMejor ? redondeada < 0 : redondeada > 0;
      color = mejora ? 'green.7' : 'red.7';
    }
  }

  return (
    <Paper withBorder radius="md" p="md" style={{ borderTop: '3px solid var(--mantine-color-orange-6)' }}>
      <Stack gap={4}>
        <Text size="sm" c="dimmed" fw={600}>
          {titulo}
        </Text>
        <Text fz={28} fw={700} lh={1.2}>
          {valor}
        </Text>
        <Group gap={4}>
          <Text size="xs" c={color}>
            {texto}
          </Text>
        </Group>
        {ayuda && (
          <Text size="xs" c="dimmed">
            {ayuda}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
