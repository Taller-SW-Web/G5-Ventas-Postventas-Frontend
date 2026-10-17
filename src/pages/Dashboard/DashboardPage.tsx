// Mockup 01 — Dashboard (F6). Responsable: Fabrizio
// Indicadores de GET /api/v2/dashboard/metricas (2.12) con filtros de periodo y canal.
// Ventas, ticket promedio y tendencia necesitan importes que 2.12 todavía no entrega: se muestran como no disponibles.
import { useState } from 'react';
import { BarChart, DonutChart } from '@mantine/charts';
import { Button, Grid, Group, Paper, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import type { Canal } from '@/types/comun';
import { ETIQUETA_CANAL, fechaHora } from '../Reclamos/formato';
import { AtencionPrioritaria } from './AtencionPrioritaria';
import { TarjetaKpi } from './TarjetaKpi';
import {
  OPCIONES_PERIODO,
  cargarDashboard,
  diferencia,
  entero,
  rangoDe,
  soles,
  tasaAnulacion,
  tasaDevolucion,
  variacionPorcentual,
  type ClavePeriodo,
  type DatosDashboard,
} from './metricas';

const TODOS = 'TODOS';

const OPCIONES_CANAL = [
  { value: TODOS, label: 'Todos' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
  { value: 'CHATBOT', label: 'Chatbot' },
  { value: 'RETAIL', label: 'Retail' },
];

interface Filtros {
  periodo: ClavePeriodo;
  canal: string;
}

const INICIALES: Filtros = { periodo: 'MES_ACTUAL', canal: TODOS };

const porcentaje = (n: number | null) =>
  n === null ? '—' : `${n.toLocaleString('es-PE', { maximumFractionDigits: 1 })}%`;

export function DashboardPage() {
  const [controles, setControles] = useState<Filtros>(INICIALES);
  const [aplicados, setAplicados] = useState<Filtros>(INICIALES);

  const rango = rangoDe(aplicados.periodo);
  const canal = aplicados.canal === TODOS ? undefined : (aplicados.canal as Canal);
  const consulta = useConsulta(() => cargarDashboard(rango, canal), [rango.desde, rango.hasta, canal]);

  return (
    <Stack gap="lg">
      <Title order={1}>Dashboard</Title>

      <Paper withBorder radius="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <Select
            label="Periodo"
            data={OPCIONES_PERIODO}
            value={controles.periodo}
            onChange={(v) => setControles((c) => ({ ...c, periodo: (v as ClavePeriodo) ?? 'MES_ACTUAL' }))}
            allowDeselect={false}
            style={{ flex: '1 1 200px' }}
          />
          <Select
            label="Canal"
            data={OPCIONES_CANAL}
            value={controles.canal}
            onChange={(v) => setControles((c) => ({ ...c, canal: v ?? TODOS }))}
            allowDeselect={false}
            style={{ flex: '1 1 200px' }}
          />
          <Group gap="sm">
            <Button onClick={() => setAplicados(controles)}>Aplicar filtros</Button>
            <Button
              variant="default"
              onClick={() => {
                setControles(INICIALES);
                setAplicados(INICIALES);
              }}
            >
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
        {(datos) => <Contenido datos={datos} />}
      </EstadoCarga>
    </Stack>
  );
}

function Contenido({ datos }: { datos: DatosDashboard }) {
  const { actual, anterior, porCanal } = datos;
  const { pedidos, postventa } = actual;
  const enCurso = Math.max(0, pedidos.total - pedidos.entregados - pedidos.anulados);
  const distribucion = [
    { name: 'Entregados', value: pedidos.entregados, color: 'orange.7' },
    { name: 'En curso', value: enCurso, color: 'orange.3' },
    { name: 'Anulados', value: pedidos.anulados, color: 'gray.5' },
  ];
  const totalDistribucion = distribucion.reduce((s, d) => s + d.value, 0);

  return (
    <Stack gap="lg">
      <Text size="sm" c="dimmed">
        Periodo {actual.periodo.desde} a {actual.periodo.hasta}
        {actual.ultimaActualizacion
          ? ` · datos consolidados al ${fechaHora(actual.ultimaActualizacion)}`
          : ' · sin actividad registrada en el periodo'}
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        <TarjetaKpi
          titulo="Pedidos pagados"
          valor={entero(pedidos.total)}
          variacion={variacionPorcentual(pedidos.total, anterior.pedidos.total)}
          unidad="%"
        />
        <TarjetaKpi
          titulo="Tasa de anulación"
          valor={porcentaje(tasaAnulacion(actual))}
          variacion={diferencia(tasaAnulacion(actual), tasaAnulacion(anterior))}
          unidad="pp"
          menosEsMejor
          ayuda="Anulados sobre pedidos pagados"
        />
        <TarjetaKpi
          titulo="Tasa de devolución"
          valor={porcentaje(tasaDevolucion(actual))}
          variacion={diferencia(tasaDevolucion(actual), tasaDevolucion(anterior))}
          unidad="pp"
          menosEsMejor
          ayuda="Devoluciones aprobadas sobre pedidos entregados"
        />
        <TarjetaKpi
          titulo="Reclamos pendientes de SLA"
          valor={entero(postventa.reclamosPendientesSLA)}
          variacion={variacionPorcentual(postventa.reclamosPendientesSLA, anterior.postventa.reclamosPendientesSLA)}
          unidad="%"
          menosEsMejor
          ayuda="Sin respuesta y con plazo que vence en el periodo"
        />
        <TarjetaKpi
          titulo="CSAT promedio"
          valor={postventa.csatPromedio === null ? '—' : `${postventa.csatPromedio.toFixed(2)} / 5`}
          variacion={diferencia(postventa.csatPromedio, anterior.postventa.csatPromedio)}
          unidad="pts"
        />
        <TarjetaKpi
          titulo="Monto reembolsado"
          valor={soles(postventa.montoReembolsadoPEN)}
          variacion={variacionPorcentual(postventa.montoReembolsadoPEN, anterior.postventa.montoReembolsadoPEN)}
          unidad="%"
          menosEsMejor
          ayuda="Solo reembolsos exitosos en soles"
        />
      </SimpleGrid>

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper withBorder radius="md" p="md" h="100%">
            <Title order={3} mb="xs">
              Tendencia de ventas
            </Title>
            <Text size="sm" c="dimmed">
              Aún no disponible: el servicio de métricas todavía no entrega importes de venta por día. Lo mismo aplica a
              Ventas y Ticket promedio.
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <AtencionPrioritaria />
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper withBorder radius="md" p="md" h="100%">
            <Title order={3} mb="md">
              Pedidos por canal
            </Title>
            {porCanal ? (
              <BarChart
                h={240}
                data={porCanal.map((c) => ({ canal: ETIQUETA_CANAL[c.canal], pedidos: c.pedidos }))}
                dataKey="canal"
                series={[{ name: 'pedidos', label: 'Pedidos pagados', color: 'orange.6' }]}
                tickLine="y"
              />
            ) : (
              <Text size="sm" c="dimmed">
                El filtro ya es un solo canal: {entero(pedidos.total)} pedidos pagados. Elige "Todos" para comparar.
              </Text>
            )}
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper withBorder radius="md" p="md" h="100%">
            <Title order={3} mb="md">
              Distribución de pedidos
            </Title>
            {totalDistribucion === 0 ? (
              <Text size="sm" c="dimmed">
                Sin pedidos en el periodo.
              </Text>
            ) : (
              <Group align="center" gap="xl" wrap="wrap">
                <DonutChart data={distribucion} chartLabel={entero(totalDistribucion)} size={180} thickness={26} />
                <Table style={{ flex: 1, minWidth: 200 }}>
                  <Table.Tbody>
                    {distribucion.map((d) => (
                      <Table.Tr key={d.name}>
                        <Table.Td>{d.name}</Table.Td>
                        <Table.Td ta="right">{entero(d.value)}</Table.Td>
                        <Table.Td ta="right" c="dimmed">
                          {Math.round((d.value / totalDistribucion) * 100)}%
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Group>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
