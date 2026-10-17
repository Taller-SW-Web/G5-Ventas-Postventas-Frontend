// Mockup 06 — Devoluciones y cambios (F3). Responsable: Joseph
// Bandeja del Gestor (2.4) + revisión del expediente (2.3) + resolución (2.5).
// Detalle de la pantalla: diseno/mockups/Mockup 06 - Devoluciones y Cambios.md
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import { EstadoCarga } from '@/components/EstadoCarga';
import { TablaPaginada, type ColumnaTabla } from '@/components/TablaPaginada';
import { useConsulta } from '@/hooks/useConsulta';
import { usePaginacion } from '@/hooks/usePaginacion';
import type {
  DevolucionResumen,
  EstadoDevolucion,
  FiltrosDevoluciones,
  OrdenDevoluciones,
  TipoDevolucion,
} from '@/types/devolucion';
import { AccionesExpediente } from './AccionesExpediente';
import { EvidenciaExpediente } from './EvidenciaExpediente';
import { DetalleExpediente, EvaluacionExpediente } from './PanelesExpediente';
import { ETIQUETA_MOTIVO, ETIQUETA_TIPO, dia } from './formato';
import { listarDevoluciones } from '@/services/devoluciones';
import { obtenerExpediente } from './expediente';

const TAMANO_PAGINA = 5;
const TODOS = 'TODOS';

const OPCIONES_ESTADO = [
  { value: TODOS, label: 'Todos' },
  { value: 'SOLICITADA', label: 'SOLICITADA' },
  { value: 'EN_EVALUACION', label: 'EN EVALUACIÓN' },
  { value: 'APROBADA', label: 'APROBADA' },
  { value: 'RECHAZADA', label: 'RECHAZADA' },
  { value: 'COMPLETADA', label: 'COMPLETADA' },
];

const OPCIONES_TIPO = [
  { value: TODOS, label: 'Todos' },
  { value: 'CAMBIO', label: 'Cambio' },
  { value: 'DEVOLUCION_DINERO', label: 'Devolución' },
];

const OPCIONES_ORDEN = [
  { value: 'RECIENTES', label: 'Más recientes' },
  { value: 'ANTIGUOS', label: 'Más antiguos' },
];

interface Controles {
  buscar: string;
  estado: string;
  tipo: string;
}

const CONTROLES_INICIALES: Controles = { buscar: '', estado: TODOS, tipo: TODOS };

function aFiltros(c: Controles): Omit<FiltrosDevoluciones, 'pagina' | 'tamano' | 'orden'> {
  return {
    buscar: c.buscar.trim() || undefined,
    estado: c.estado !== TODOS ? (c.estado as EstadoDevolucion) : undefined,
    tipo: c.tipo !== TODOS ? (c.tipo as TipoDevolucion) : undefined,
  };
}

export function DevolucionesPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pagina, setPagina, reiniciar } = usePaginacion(TAMANO_PAGINA);
  const [controles, setControles] = useState<Controles>(CONTROLES_INICIALES);
  const [aplicados, setAplicados] = useState<Controles>(CONTROLES_INICIALES);
  const [orden, setOrden] = useState<OrdenDevoluciones>('RECIENTES');
  // Desde Atención prioritaria se llega con ?expediente=DEV-...
  const [seleccionado, setSeleccionado] = useState<string | null>(() => params.get('expediente'));
  const [version, setVersion] = useState(0);

  const bandeja = useConsulta(
    () => listarDevoluciones({ ...aFiltros(aplicados), orden, pagina, tamano: TAMANO_PAGINA }),
    [aplicados, orden, pagina, version],
  );

  const expediente = useConsulta(
    () => (seleccionado ? obtenerExpediente(seleccionado) : Promise.resolve(null)),
    [seleccionado, version],
  );

  // Abrir un expediente SOLICITADA lo pasa a EN_EVALUACION (2.3): se refresca la fila de la bandeja.
  const estadoAbierto = expediente.datos?.devolucion.estado;
  const filaAbierta = bandeja.datos?.contenido.find((d) => d.devolucionId === seleccionado);
  const recargarBandeja = bandeja.recargar;
  useEffect(() => {
    if (estadoAbierto && filaAbierta && filaAbierta.estado !== estadoAbierto) recargarBandeja();
  }, [estadoAbierto, filaAbierta, recargarBandeja]);

  const cambiar = (campo: keyof Controles) => (valor: string | null) =>
    setControles((c) => ({ ...c, [campo]: valor ?? TODOS }));

  // Cambiar filtros, página u orden cierra la revisión abierta (Mockup 06, 5.1 y 5.3).
  function aplicarFiltros() {
    setAplicados(controles);
    setSeleccionado(null);
    reiniciar();
  }

  function limpiarFiltros() {
    setControles(CONTROLES_INICIALES);
    setAplicados(CONTROLES_INICIALES);
    setOrden('RECIENTES');
    setSeleccionado(null);
    reiniciar();
  }

  const columnas: ColumnaTabla<DevolucionResumen>[] = [
    {
      clave: 'codigo',
      titulo: 'Código / Fecha',
      render: (d) => (
        <Stack gap={0}>
          <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
            {d.devolucionId}
          </Text>
          <Text size="xs" c="dimmed">
            {dia(d.fechaRegistro)}
          </Text>
        </Stack>
      ),
    },
    {
      clave: 'pedido',
      titulo: 'Pedido',
      render: (d) => (
        <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
          {d.pedidoId}
        </Text>
      ),
    },
    { clave: 'tipo', titulo: 'Tipo', render: (d) => ETIQUETA_TIPO[d.tipo] },
    { clave: 'motivo', titulo: 'Motivo', render: (d) => ETIQUETA_MOTIVO[d.motivo] },
    {
      clave: 'estado',
      titulo: 'Estado',
      render: (d) => <EstadoBadge entidad="devolucion" estado={d.estado} size="sm" miw="max-content" />,
    },
    {
      clave: 'accion',
      titulo: 'Acción',
      render: (d) => (
        <Button size="xs" variant="default" onClick={() => setSeleccionado(d.devolucionId)}>
          Revisar
        </Button>
      ),
    },
  ];

  const revisando = seleccionado !== null;

  const tablaSolicitudes = (
    <Paper withBorder radius="md" p="md" shadow="xs">
      <Group justify="space-between" mb="md" wrap="wrap">
        <Title order={3} size="h4" ff="Oswald, sans-serif" tt="uppercase">
          Solicitudes de devolución y cambio
        </Title>
        <Select
          aria-label="Orden"
          data={OPCIONES_ORDEN}
          value={orden}
          onChange={(v) => {
            setOrden((v as OrdenDevoluciones) ?? 'RECIENTES');
            setSeleccionado(null);
            reiniciar();
          }}
          allowDeselect={false}
          w={180}
        />
      </Group>
      <EstadoCarga
        cargando={bandeja.cargando}
        error={bandeja.error}
        datos={bandeja.datos}
        mensajeVacio="No hay expedientes que coincidan con los filtros."
        onReintentar={bandeja.recargar}
      >
        {(datos) => {
          const desde = datos.pagina * TAMANO_PAGINA + 1;
          const hasta = datos.pagina * TAMANO_PAGINA + datos.contenido.length;
          return (
            <TablaPaginada
              columnas={columnas}
              filas={datos.contenido}
              obtenerClave={(d) => d.devolucionId}
              pagina={datos.pagina}
              totalPaginas={datos.totalPaginas}
              totalElementos={datos.totalElementos}
              resumen={`Mostrando ${desde}–${hasta} de ${datos.totalElementos} expedientes`}
              onCambiarPagina={(p) => {
                setPagina(p);
                setSeleccionado(null);
              }}
              onClickFila={(d) => setSeleccionado(d.devolucionId)}
            />
          );
        }}
      </EstadoCarga>
    </Paper>
  );

  return (
    <Stack gap="lg">
      <Group gap="sm">
        <ActionIcon
          variant="default"
          size="lg"
          onClick={() => navigate('/admin/postventa')}
          aria-label="Volver a Postventa"
        >
          ←
        </ActionIcon>
        <Title order={1}>Devoluciones y cambios</Title>
      </Group>

      <Paper withBorder radius="md" p="md" shadow="xs">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Buscar"
            placeholder="DEV-2026-0042 o PED-2026-00981"
            value={controles.buscar}
            onChange={(ev) => {
              const valor = ev.currentTarget.value;
              setControles((c) => ({ ...c, buscar: valor }));
            }}
            onKeyDown={(ev) => ev.key === 'Enter' && aplicarFiltros()}
            style={{ flex: '2 1 240px' }}
          />
          <Select
            label="Estado"
            data={OPCIONES_ESTADO}
            value={controles.estado}
            onChange={cambiar('estado')}
            allowDeselect={false}
            style={{ flex: '1 1 150px' }}
          />
          <Select
            label="Tipo"
            data={OPCIONES_TIPO}
            value={controles.tipo}
            onChange={cambiar('tipo')}
            allowDeselect={false}
            style={{ flex: '1 1 130px' }}
          />
          <Group gap="sm">
            <Button onClick={aplicarFiltros}>Aplicar filtros</Button>
            <Button variant="default" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </Group>
        </Group>
      </Paper>

      {!revisando ? (
        <Box maw={800} w="100%" mx="auto">
          {tablaSolicitudes}
        </Box>
      ) : (
        <Grid gap="md" align="flex-start">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="md">
              {tablaSolicitudes}
              {expediente.datos && <EvidenciaExpediente expediente={expediente.datos} />}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <EstadoCarga
              cargando={expediente.cargando}
              error={expediente.error}
              datos={expediente.datos}
              mensajeVacio="No se encontró el expediente."
              onReintentar={expediente.recargar}
            >
              {(e) => (
                <Stack gap="md">
                  <DetalleExpediente expediente={e} onCerrar={() => setSeleccionado(null)} />
                  <EvaluacionExpediente expediente={e} />
                  <AccionesExpediente expediente={e} onCambio={() => setVersion((v) => v + 1)} />
                </Stack>
              )}
            </EstadoCarga>
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
