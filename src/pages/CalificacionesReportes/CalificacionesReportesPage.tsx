// Mockup 09 — Calificaciones y reportes (F5 + F6). Responsable: Johan (calificaciones) + Fabrizio (reportes)
// Parte F6 (Fabrizio): filtros, indicadores, Desempeño operativo, Distribución por canal, vista Operación Postventa,
// Comparar, Exportar (simulado), Detalle operativo y Resumen, todo desde 2.12.
// Parte F5 (Johan): SeccionSatisfaccion y SeccionComentarios, cada una en su propio archivo.
import { useState } from 'react';
import { Button, Grid, Group, Paper, Select, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import type { Canal } from '@/types/comun';
import {
  cargarDashboard,
  diferencia,
  entero,
  rangoAnterior,
  soles,
  variacionPorcentual,
  type DatosDashboard,
} from '../Dashboard/metricas';
import { TarjetaKpi } from '../Dashboard/TarjetaKpi';
import { DesempenoOperativo, DistribucionPorCanal, VistaOperacion } from './BloquesOperacion';
import { ModalComparar } from './ModalComparar';
import { ModalDetalleOperativo } from './ModalDetalleOperativo';
import { ModalDistribucionCanal } from './ModalDistribucionCanal';
import { ModalExportar } from './ModalExportar';
import { ModalResumen } from './ModalResumen';
import {
  OPCIONES_VISTA,
  csat,
  etiquetaCanal,
  etiquetaPeriodo,
  opcionesPeriodo,
  rangoReporte,
  textoRango,
  type ContextoReporte,
  type PeriodoReporte,
  type VistaReporte,
} from './reportes';
import { SeccionComentarios } from './SeccionComentarios';
import { SeccionSatisfaccion } from './SeccionSatisfaccion';

const TODOS = 'TODOS';

const OPCIONES_CANAL = [
  { value: TODOS, label: 'Todos' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
  { value: 'CHATBOT', label: 'Chatbot' },
  { value: 'RETAIL', label: 'Retail' },
];

interface Filtros {
  periodo: PeriodoReporte;
  canal: string;
  vista: VistaReporte;
}

/** Selección inicial explícita (la ficha 12 pide que se sepa a qué periodo y canal corresponden las cifras). */
const INICIALES: Filtros = { periodo: 'MES_ACTUAL', canal: TODOS, vista: 'GENERAL' };

type ModalAbierto = 'comparar' | 'exportar' | 'detalle' | 'canales' | 'resumen' | null;

export function CalificacionesReportesPage() {
  const [controles, setControles] = useState<Filtros>(INICIALES);
  const [aplicados, setAplicados] = useState<Filtros>(INICIALES);
  const [modal, setModal] = useState<ModalAbierto>(null);

  const rango = rangoReporte(aplicados.periodo);
  const canal = aplicados.canal === TODOS ? undefined : (aplicados.canal as Canal);
  const consulta = useConsulta(() => cargarDashboard(rango, canal), [rango.desde, rango.hasta, canal]);

  const contexto: ContextoReporte | null = consulta.datos
    ? {
        periodo: etiquetaPeriodo(aplicados.periodo),
        rango,
        canal: etiquetaCanal(canal),
        actual: consulta.datos.actual,
        anterior: consulta.datos.anterior,
        rangoAnterior: rangoAnterior(rango),
      }
    : null;

  const cambiar = <K extends keyof Filtros>(campo: K) => (valor: string | null) => {
    if (valor !== null) setControles((c) => ({ ...c, [campo]: valor as Filtros[K] }));
  };

  const volverAGeneral = () => {
    setControles((c) => ({ ...c, vista: 'GENERAL' }));
    setAplicados((a) => ({ ...a, vista: 'GENERAL' }));
  };

  return (
    <Stack gap="lg">
      <Title order={1}>Calificaciones y reportes</Title>

      <Paper withBorder radius="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <Select
            label="Periodo"
            data={opcionesPeriodo()}
            value={controles.periodo}
            onChange={cambiar('periodo')}
            allowDeselect={false}
            style={{ flex: '1 1 170px' }}
          />
          <Select
            label="Canal"
            data={OPCIONES_CANAL}
            value={controles.canal}
            onChange={cambiar('canal')}
            allowDeselect={false}
            style={{ flex: '1 1 150px' }}
          />
          <Select
            label="Reporte / Vista"
            data={OPCIONES_VISTA}
            value={controles.vista}
            onChange={cambiar('vista')}
            allowDeselect={false}
            style={{ flex: '1 1 190px' }}
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
          <Group gap="sm" ml="auto">
            <Button variant="default" disabled={!contexto} onClick={() => setModal('comparar')}>
              Comparar
            </Button>
            <Button color="dark" disabled={!contexto} onClick={() => setModal('exportar')}>
              Exportar
            </Button>
          </Group>
        </Group>
        <Text size="xs" c="dimmed" mt="xs">
          Mostrando {etiquetaPeriodo(aplicados.periodo)} ({textoRango(rango)}) · {etiquetaCanal(canal)}
        </Text>
      </Paper>

      <EstadoCarga
        cargando={consulta.cargando}
        error={consulta.error}
        datos={consulta.datos}
        onReintentar={consulta.recargar}
        esVacio={() => false}
      >
        {(datos) => (
          <Contenido
            datos={datos}
            vista={aplicados.vista}
            canalAplicado={etiquetaCanal(canal)}
            abrir={setModal}
            onVolver={volverAGeneral}
          />
        )}
      </EstadoCarga>

      <ModalComparar abierto={modal === 'comparar'} contexto={contexto} onCerrar={() => setModal(null)} />
      <ModalExportar abierto={modal === 'exportar'} contexto={contexto} onCerrar={() => setModal(null)} />
      <ModalDetalleOperativo abierto={modal === 'detalle'} contexto={contexto} onCerrar={() => setModal(null)} />
      <ModalDistribucionCanal
        abierto={modal === 'canales'}
        contexto={contexto}
        porCanal={consulta.datos?.porCanal ?? null}
        onCerrar={() => setModal(null)}
      />
      <ModalResumen abierto={modal === 'resumen'} contexto={contexto} onCerrar={() => setModal(null)} />
    </Stack>
  );
}

interface ContenidoProps {
  datos: DatosDashboard;
  vista: VistaReporte;
  canalAplicado: string;
  abrir: (modal: ModalAbierto) => void;
  onVolver: () => void;
}

function Contenido({ datos, vista, canalAplicado, abrir, onVolver }: ContenidoProps) {
  const { actual, anterior, porCanal } = datos;

  if (vista === 'OPERACION') {
    return <VistaOperacion actual={actual} onVerResumen={() => abrir('resumen')} onVolver={onVolver} />;
  }

  if (vista === 'SATISFACCION') {
    return (
      <Stack gap="lg">
        <SeccionSatisfaccion />
        <Group justify="flex-end">
          <Button color="dark" onClick={onVolver}>
            Volver a vista general
          </Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <TarjetaKpi
          categoria="Satisfacción"
          titulo="CSAT promedio"
          valor={csat(actual.postventa.csatPromedio)}
          icono="★"
          variacion={diferencia(actual.postventa.csatPromedio, anterior.postventa.csatPromedio)}
          unidad="pts"
          pie="Calificaciones válidas 1–5"
        />
        <TarjetaKpi
          categoria="Operación"
          titulo="Pedidos del periodo"
          valor={entero(actual.pedidos.total)}
          icono="#"
          variacion={variacionPorcentual(actual.pedidos.total, anterior.pedidos.total)}
          pie="Pedidos consolidados"
        />
        <TarjetaKpi
          categoria="Reembolsos"
          titulo="Monto reembolsado"
          valor={soles(actual.postventa.montoReembolsadoPEN)}
          icono="↻"
          variacion={variacionPorcentual(actual.postventa.montoReembolsadoPEN, anterior.postventa.montoReembolsadoPEN)}
          menosEsMejor
          pie="Extornos del periodo"
        />
        <TarjetaKpi
          categoria="Atención SLA"
          titulo="Reclamos pendientes"
          valor={entero(actual.postventa.reclamosPendientesSLA)}
          icono="!"
          variacion={variacionPorcentual(actual.postventa.reclamosPendientesSLA, anterior.postventa.reclamosPendientesSLA)}
          menosEsMejor
          pie="Casos pendientes de atención"
        />
      </SimpleGrid>

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <SeccionSatisfaccion />
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <DesempenoOperativo actual={actual} onVerDetalle={() => abrir('detalle')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <SeccionComentarios />
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <DistribucionPorCanal porCanal={porCanal} canalAplicado={canalAplicado} onVerDetalle={() => abrir('canales')} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
