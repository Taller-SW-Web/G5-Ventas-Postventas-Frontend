// Mockup 01 — Dashboard (F6). Responsable: Fabrizio
// Indicadores de GET /api/v2/dashboard/metricas (2.12) con filtros de periodo (rango de fechas) y canal.
// Ventas, ticket promedio, tendencia e importes por canal necesitan montos que 2.12 todavía no entrega:
// se calculan con la bandeja de pedidos (1.4), ver cargarVentas en metricas.ts.
import { useState, type ReactNode } from 'react';
import { AreaChart, BarChart, DonutChart } from '@mantine/charts';
import { DatePickerInput } from '@mantine/dates';
import {
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import type { Canal } from '@/types/comun';
import { ETIQUETA_CANAL, fechaHora } from '../Reclamos/formato';
import { AtencionPrioritaria } from './AtencionPrioritaria';
import { TarjetaKpi } from './TarjetaKpi';
import {
  cargarDashboard,
  contarReclamosAbiertos,
  diferencia,
  entero,
  rangoDe,
  soles,
  tasaAnulacion,
  variacionPorcentual,
  tasaDevolucion,
  type DatosDashboard,
  type Rango,
} from './metricas';

const TODOS = 'TODOS';

const OPCIONES_CANAL = [
  { value: TODOS, label: 'Todos' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
  { value: 'CHATBOT', label: 'Chatbot' },
  { value: 'RETAIL', label: 'Retail' },
];

type RangoElegido = [string | null, string | null];

interface Filtros {
  rango: Rango;
  canal: string;
}

function iniciales(): Filtros {
  return { rango: rangoDe('MES_ACTUAL'), canal: TODOS };
}

const porcentaje = (n: number | null) =>
  n === null ? '—' : `${n.toLocaleString('es-PE', { maximumFractionDigits: 1 })}%`;

export function DashboardPage() {
  const [aplicados, setAplicados] = useState<Filtros>(iniciales);
  const [rangoElegido, setRangoElegido] = useState<RangoElegido>([aplicados.rango.desde, aplicados.rango.hasta]);
  const [canalElegido, setCanalElegido] = useState<string>(TODOS);

  const canal = aplicados.canal === TODOS ? undefined : (aplicados.canal as Canal);
  const consulta = useConsulta(
    () => cargarDashboard(aplicados.rango, canal),
    [aplicados.rango.desde, aplicados.rango.hasta, canal],
  );
  const reclamosAbiertos = useConsulta(contarReclamosAbiertos, []);

  const [desde, hasta] = rangoElegido;
  const rangoCompleto = desde !== null && hasta !== null;

  function aplicar() {
    if (!rangoCompleto) return;
    setAplicados({ rango: { desde, hasta }, canal: canalElegido });
  }

  function limpiar() {
    const base = iniciales();
    setRangoElegido([base.rango.desde, base.rango.hasta]);
    setCanalElegido(TODOS);
    setAplicados(base);
  }

  return (
    <Stack gap="lg">
      <Title order={1}>Dashboard</Title>

      <Paper withBorder radius="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <DatePickerInput
            type="range"
            label="Periodo"
            placeholder="Elige el rango de fechas"
            valueFormat="DD/MM/YYYY"
            value={rangoElegido}
            onChange={(v) => setRangoElegido([v[0] ?? null, v[1] ?? null])}
            maxDate={new Date()}
            style={{ flex: '2 1 260px' }}
          />
          <Select
            label="Canal"
            data={OPCIONES_CANAL}
            value={canalElegido}
            onChange={(v) => setCanalElegido(v ?? TODOS)}
            allowDeselect={false}
            style={{ flex: '1 1 180px' }}
          />
          <Group gap="sm" ml="auto">
            <Button onClick={aplicar} disabled={!rangoCompleto}>
              Aplicar filtros
            </Button>
            <Button variant="default" onClick={limpiar}>
              Limpiar
            </Button>
          </Group>
        </Group>
      </Paper>

      <EstadoCarga
        cargando={consulta.cargando}
        error={consulta.error}
        datos={consulta.datos}
        onReintentar={consulta.recargar}
        esVacio={() => false}
      >
        {(datos) => <Contenido datos={datos} reclamosAbiertos={reclamosAbiertos.datos} />}
      </EstadoCarga>
    </Stack>
  );
}

function Bloque({ titulo, subtitulo, extra, children }: { titulo: string; subtitulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
        <div>
          <Title order={3}>{titulo}</Title>
          <Text size="sm" c="dimmed">
            {subtitulo}
          </Text>
        </div>
        {extra}
      </Group>
      {children}
    </Paper>
  );
}

/** Recuadro pequeño de la esquina (PICO, VARIACIÓN, TOTAL) como en el Figma. */
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Box bg="cloud.2" px="sm" py={6} style={{ borderRadius: 'var(--mantine-radius-md)' }}>
      <Text size="xs" fw={700} c="orange.7" tt="uppercase">
        {etiqueta}
      </Text>
      <Text size="sm" fw={700}>
        {valor}
      </Text>
    </Box>
  );
}

function Contenido({ datos, reclamosAbiertos }: { datos: DatosDashboard; reclamosAbiertos: number | null }) {
  const { actual, anterior, porCanal, ventas, ventasAnterior } = datos;
  const ticket = (v: typeof ventas) => (v.vendidos > 0 ? v.monto / v.vendidos : null);
  const pico = ventas.porDia.reduce((m, d) => (d.monto > m.monto ? d : m), { fecha: '', monto: 0 });
  const variacionVentas = variacionPorcentual(ventas.monto, ventasAnterior.monto);
  const { pedidos } = actual;
  const enCurso = Math.max(0, pedidos.total - pedidos.entregados - pedidos.anulados);
  // 2.12 no separa pagados / despachados / pendientes: se muestra lo que el contrato sí entrega.
  const distribucion = [
    { name: 'Entregados', value: pedidos.entregados, color: 'orange.7' },
    { name: 'En curso', value: enCurso, color: 'ink.9' },
    { name: 'Anulados', value: pedidos.anulados, color: 'orange.3' },
  ];
  const totalDistribucion = distribucion.reduce((s, d) => s + d.value, 0);
  const mayor = [...distribucion].sort((a, b) => b.value - a.value)[0];

  return (
    <Stack gap="lg">
      <Text size="sm" c="dimmed">
        Periodo {fechaCorta(actual.periodo.desde)} a {fechaCorta(actual.periodo.hasta)}
        {actual.ultimaActualizacion
          ? ` · datos consolidados al ${fechaHora(actual.ultimaActualizacion)}`
          : ' · sin actividad registrada en el periodo'}
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
        <TarjetaKpi
          categoria="Ingresos"
          titulo="Ventas"
          valor={soles(ventas.monto)}
          icono="↗"
          variacion={variacionVentas}
          pie={`${entero(ventas.vendidos)} pedidos vendidos`}
        />
        <TarjetaKpi
          categoria="Promedio"
          titulo="Ticket promedio"
          valor={ticket(ventas) === null ? '—' : soles(ticket(ventas) ?? 0)}
          icono="◇"
          variacion={variacionPorcentual(ticket(ventas), ticket(ventasAnterior))}
          pie="Venta media por pedido"
        />
        <TarjetaKpi
          categoria="Anulaciones"
          titulo="Tasa de anulación"
          valor={porcentaje(tasaAnulacion(actual))}
          icono="✕"
          variacion={diferencia(tasaAnulacion(actual), tasaAnulacion(anterior))}
          unidad="pp"
          menosEsMejor
          pie="Anulados sobre pedidos del periodo"
        />
        <TarjetaKpi
          categoria="Devoluciones"
          titulo="Tasa de devolución"
          valor={porcentaje(tasaDevolucion(actual))}
          icono="↩"
          variacion={diferencia(tasaDevolucion(actual), tasaDevolucion(anterior))}
          unidad="pp"
          menosEsMejor
          pie="Aprobadas sobre pedidos entregados"
        />
        <TarjetaKpi
          categoria="Atención"
          titulo="Reclamos abiertos"
          valor={reclamosAbiertos === null ? '—' : entero(reclamosAbiertos)}
          icono="!"
          pie="Casos por resolver"
        />
      </SimpleGrid>

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Bloque
            titulo="Tendencia de ventas"
            subtitulo="Evolución del periodo consolidada"
            extra={
              <Group gap="xs" wrap="nowrap">
                <Dato etiqueta="Pico" valor={pico.monto > 0 ? soles(pico.monto) : '—'} />
                <Dato
                  etiqueta="Variación"
                  valor={variacionVentas === null ? '—' : `${variacionVentas > 0 ? '+' : ''}${variacionVentas.toFixed(1)}%`}
                />
              </Group>
            }
          >
            {ventas.monto === 0 ? (
              <Text size="sm" c="dimmed" ta="center">
                Sin ventas en el periodo.
              </Text>
            ) : (
              <AreaChart
                h={240}
                data={ventas.porDia.map((d) => ({ dia: fechaCorta(d.fecha).slice(0, 5), ventas: d.monto }))}
                dataKey="dia"
                series={[{ name: 'ventas', label: 'Ventas (S/)', color: 'orange.6' }]}
                curveType="monotone"
                valueFormatter={(n) => soles(n)}
              />
            )}
          </Bloque>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <AtencionPrioritaria />
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Bloque
            titulo="Ventas por canal"
            subtitulo="Importe vendido por canal en el periodo"
            extra={<Dato etiqueta="Total" valor={soles(ventas.monto)} />}
          >
            {porCanal ? (
              <BarChart
                h={240}
                data={porCanal.map((c) => ({ canal: ETIQUETA_CANAL[c.canal], ventas: ventas.porCanal[c.canal] }))}
                dataKey="canal"
                series={[{ name: 'ventas', label: 'Ventas (S/)', color: 'orange.6' }]}
                tickLine="y"
                valueFormatter={(n) => soles(n)}
                withBarValueLabel
              />
            ) : (
              <Text size="sm" c="dimmed">
                El filtro ya es un solo canal: {soles(ventas.monto)} en {entero(ventas.vendidos)} pedidos. Elige "Todos" para comparar.
              </Text>
            )}
          </Bloque>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Bloque
            titulo="Distribución de pedidos"
            subtitulo="Composición del periodo por estado del pedido"
            extra={<Dato etiqueta="Total pedidos" valor={entero(pedidos.total)} />}
          >
            {totalDistribucion === 0 ? (
              <Text size="sm" c="dimmed">
                Sin pedidos en el periodo.
              </Text>
            ) : (
              <Group align="stretch" gap="lg" wrap="wrap">
                <Stack
                  align="center"
                  gap={4}
                  bg="cloud.2"
                  p="md"
                  style={{ borderRadius: 'var(--mantine-radius-md)', flex: '0 0 auto' }}
                >
                  <DonutChart data={distribucion} chartLabel={entero(totalDistribucion)} size={170} thickness={24} />
                  <Text size="xs" c="dimmed">
                    Mayor volumen: <b>{mayor.name}</b> · {Math.round((mayor.value / totalDistribucion) * 100)}%
                  </Text>
                </Stack>
                <Paper withBorder radius="md" p="sm" style={{ flex: 1, minWidth: 240 }}>
                  <Table verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Detalle por estado</Table.Th>
                        <Table.Th ta="right">Cantidad</Table.Th>
                        <Table.Th ta="right">%</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {distribucion.map((d) => {
                        const pct = Math.round((d.value / totalDistribucion) * 100);
                        return (
                          <Table.Tr key={d.name}>
                            <Table.Td>
                              <Text size="sm">{d.name}</Text>
                              <Progress value={pct} color={d.color} size="sm" mt={4} />
                            </Table.Td>
                            <Table.Td ta="right">{entero(d.value)}</Table.Td>
                            <Table.Td ta="right" c="orange.7" fw={600}>
                              {pct}%
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Group>
            )}
          </Bloque>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

/** YYYY-MM-DD → DD/MM/YYYY */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
