// Bloques de F6 en Reportes (Mockup 09): Desempeño operativo (8.1), Distribución por canal (9.2)
// y la vista Operación Postventa (8.2). Todo sale de 2.12 con los filtros aplicados.
import type { ReactNode } from 'react';
import { BarChart } from '@mantine/charts';
import { Avatar, Box, Button, Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { Canal } from '@/types/comun';
import type { MetricasDashboard } from '@/types/reclamo';
import { entero, soles, tasaAnulacion } from '../Dashboard/metricas';
import { TarjetaKpi } from '../Dashboard/TarjetaKpi';
import { ETIQUETA_CANAL } from '../Reclamos/formato';
import { porcentaje, tasaEntrega } from './reportes';

function Bloque({ titulo, subtitulo, accion, children }: { titulo: string; subtitulo?: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
        <div>
          <Title order={3}>{titulo}</Title>
          {subtitulo && (
            <Text size="sm" c="dimmed">
              {subtitulo}
            </Text>
          )}
        </div>
        {accion}
      </Group>
      {children}
    </Paper>
  );
}

export function DesempenoOperativo({ actual, onVerDetalle }: { actual: MetricasDashboard; onVerDetalle: () => void }) {
  const datos = [
    { categoria: 'Pedidos', volumen: actual.pedidos.total },
    { categoria: 'Entregados', volumen: actual.pedidos.entregados },
    { categoria: 'Anulados', volumen: actual.pedidos.anulados },
    { categoria: 'Devoluciones', volumen: actual.postventa.devolucionesAprobadas },
  ];
  return (
    <Bloque
      titulo="Desempeño operativo"
      subtitulo="Volumen del periodo según filtros aplicados"
      accion={
        <Button variant="default" size="xs" onClick={onVerDetalle}>
          Ver detalle
        </Button>
      }
    >
      <BarChart
        h={240}
        data={datos}
        dataKey="categoria"
        series={[{ name: 'volumen', label: 'Volumen', color: 'signal.6' }]}
        tickLine="y"
        withBarValueLabel
      />
      <Text size="xs" c="dimmed" mt="xs">
        Los entregados y anulados forman parte del total de pedidos; las devoluciones pertenecen a postventa.
      </Text>
    </Bloque>
  );
}

interface DistribucionProps {
  porCanal: { canal: Canal; pedidos: number }[] | null;
  canalAplicado: string;
  onVerDetalle: () => void;
}

export function DistribucionPorCanal({ porCanal, canalAplicado, onVerDetalle }: DistribucionProps) {
  const total = porCanal?.reduce((s, c) => s + c.pedidos, 0) ?? 0;
  const lider = porCanal && total > 0 ? [...porCanal].sort((a, b) => b.pedidos - a.pedidos)[0] : null;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <Bloque
      titulo="Distribución por canal"
      subtitulo="Participación de pedidos por canal de venta"
      accion={
        <Button variant="default" size="xs" onClick={onVerDetalle}>
          Ver detalle
        </Button>
      }
    >
      {!porCanal ? (
        <Text size="sm" c="dimmed">
          El reporte está filtrado a un solo canal ({canalAplicado}). Elige "Todos" para ver la participación.
        </Text>
      ) : (
        <Stack gap="md">
          <SimpleGrid cols={2}>
            <Box bg="signal.0" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
              <Text size="xs" fw={700} c="signal.7" tt="uppercase">
                Pedidos del periodo
              </Text>
              <Text fz={24} fw={700}>
                {entero(total)}
              </Text>
            </Box>
            <Box bg="cloud.2" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Canal líder
              </Text>
              <Group justify="space-between" wrap="nowrap">
                <Text fw={700}>{lider ? ETIQUETA_CANAL[lider.canal] : '—'}</Text>
                {lider && (
                  <Text size="sm" fw={700} c="volt.9">
                    {pct(lider.pedidos)}%
                  </Text>
                )}
              </Group>
            </Box>
          </SimpleGrid>
          {porCanal.map((c) => (
            <Group key={c.canal} gap="sm" wrap="nowrap">
              <Avatar color="signal" radius="md" size="sm">
                {ETIQUETA_CANAL[c.canal].charAt(0)}
              </Avatar>
              <Stack gap={4} style={{ flex: 1 }}>
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    {ETIQUETA_CANAL[c.canal]}
                  </Text>
                  <Group gap="md">
                    <Text size="sm" fw={600}>
                      {entero(c.pedidos)}
                    </Text>
                    <Text size="sm" c="signal.7" w={40} ta="right">
                      {pct(c.pedidos)}%
                    </Text>
                  </Group>
                </Group>
                <Progress value={pct(c.pedidos)} color="signal" size="sm" />
              </Stack>
            </Group>
          ))}
          <Text size="xs" c="dimmed" ta="center">
            La longitud de cada barra representa su participación sobre el total del periodo
          </Text>
        </Stack>
      )}
    </Bloque>
  );
}

interface VistaOperacionProps {
  actual: MetricasDashboard;
  onVerResumen: () => void;
  onVolver: () => void;
}

export function VistaOperacion({ actual, onVerResumen, onVolver }: VistaOperacionProps) {
  const { pedidos, postventa } = actual;
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        <TarjetaKpi categoria="Pedidos" titulo="Pedidos totales" valor={entero(pedidos.total)} icono="#" pie="Pedidos consolidados" />
        <TarjetaKpi categoria="Entregas" titulo="Entregados" valor={entero(pedidos.entregados)} icono="✓" pie="Pedidos con entrega confirmada" />
        <TarjetaKpi categoria="Anulaciones" titulo="Anulados" valor={entero(pedidos.anulados)} icono="✕" pie="Pedidos anulados del periodo" />
        <TarjetaKpi
          categoria="Devoluciones"
          titulo="Devoluciones aprobadas"
          valor={entero(postventa.devolucionesAprobadas)}
          icono="↩"
          pie="Expedientes aprobados"
        />
        <TarjetaKpi
          categoria="Reembolsos"
          titulo="Monto reembolsado"
          valor={soles(postventa.montoReembolsadoPEN)}
          icono="↻"
          pie="Extornos exitosos en soles"
        />
        <TarjetaKpi
          categoria="Atención SLA"
          titulo="Reclamos pendientes"
          valor={entero(postventa.reclamosPendientesSLA)}
          icono="!"
          pie="Plazo que vence en el periodo"
        />
      </SimpleGrid>

      <Bloque titulo="Lectura del periodo" subtitulo="Proporciones además del volumen">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <div>
            <Text size="sm" c="dimmed">
              Tasa de entrega
            </Text>
            <Text fz={24} fw={700}>
              {porcentaje(tasaEntrega(actual))}
            </Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              Tasa de anulación
            </Text>
            <Text fz={24} fw={700}>
              {porcentaje(tasaAnulacion(actual))}
            </Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              Devoluciones aprobadas
            </Text>
            <Text fz={24} fw={700}>
              {entero(postventa.devolucionesAprobadas)}
            </Text>
          </div>
        </SimpleGrid>
      </Bloque>

      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={onVerResumen}>
          Ver resumen
        </Button>
        <Button color="dark" onClick={onVolver}>
          Volver a vista general
        </Button>
      </Group>
    </Stack>
  );
}
