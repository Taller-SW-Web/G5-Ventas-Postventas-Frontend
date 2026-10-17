// Mockup 07 — Reclamos (F6). Responsable: Fabrizio
// Bandeja del Gestor (2.10) + panel de revisión (2.9) + atención (2.11). Ver diseno/mockups/Mockup 07 - Reclamos.md
// Filtro SLA por días restantes: propuesta UX 01 (diseno/mockups/propuestas-ux-ui/propuesta-01-sla-reclamos.md).
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ActionIcon, Button, Grid, Group, Paper, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import { EstadoCarga } from '@/components/EstadoCarga';
import { TablaPaginada, type ColumnaTabla } from '@/components/TablaPaginada';
import { useConsulta } from '@/hooks/useConsulta';
import { usePaginacion } from '@/hooks/usePaginacion';
import { listarReclamos } from '@/services/reclamos';
import type { EstadoReclamo, EstadoSla, FiltrosReclamos, ReclamoResumen } from '@/types/reclamo';
import { DetalleReclamo } from './DetalleReclamo';
import { ETIQUETA_MOTIVO, dia, textoSlaCorto } from './formato';

const TAMANO_PAGINA = 5;
const TODOS = 'TODOS';

const OPCIONES_ESTADO = [
  { value: TODOS, label: 'Todos' },
  { value: 'REGISTRADO', label: 'REGISTRADO' },
  { value: 'EN_PROCESO', label: 'EN PROCESO' },
  { value: 'ATENDIDO', label: 'ATENDIDO' },
];

/** Urgencia operativa (propuesta UX 01). "Por vencer" incluye los críticos (0 a 5 días hábiles). */
const OPCIONES_SLA = [
  { value: TODOS, label: 'Todos' },
  { value: 'VENCIDO', label: 'Vencidos' },
  { value: 'POR_VENCER', label: 'Por vencer' },
  { value: 'EN_PLAZO', label: 'En plazo' },
  { value: 'ATENDIDO', label: 'Atendidos' },
];

const OPCIONES_FECHA = [
  { value: TODOS, label: 'Todos' },
  { value: '7', label: 'Últimos 7 días' },
  { value: '15', label: 'Últimos 15 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: 'MES', label: 'Este mes' },
];

const OPCIONES_ORDEN = [
  { value: 'RECIENTES', label: 'Más recientes' },
  { value: 'ANTIGUOS', label: 'Más antiguos' },
];

interface Controles {
  buscar: string;
  estado: string;
  sla: string;
  fecha: string;
}

const CONTROLES_INICIALES: Controles = { buscar: '', estado: TODOS, sla: TODOS, fecha: TODOS };

/** Convierte lo elegido en pantalla a los parámetros de 2.10. */
function aFiltros(c: Controles): Omit<FiltrosReclamos, 'pagina' | 'tamano' | 'orden'> {
  const hoy = dayjs();
  let desde: string | undefined;
  if (c.fecha === 'MES') desde = hoy.startOf('month').format('YYYY-MM-DD');
  else if (c.fecha !== TODOS) desde = hoy.subtract(Number(c.fecha) - 1, 'day').format('YYYY-MM-DD');
  return {
    buscar: c.buscar.trim() || undefined,
    estado: c.estado !== TODOS ? (c.estado as EstadoReclamo) : undefined,
    sla: c.sla !== TODOS ? (c.sla as EstadoSla) : undefined,
    desde,
    hasta: desde ? hoy.format('YYYY-MM-DD') : undefined,
  };
}

const COLUMNAS: ColumnaTabla<ReclamoResumen>[] = [
  {
    clave: 'codigo',
    titulo: 'Código / Fecha',
    render: (r) => (
      <Stack gap={0}>
        <Text size="sm" fw={600}>
          {r.codigoSeguimiento}
        </Text>
        <Text size="xs" c="dimmed">
          {dia(r.fechaRegistro)}
        </Text>
      </Stack>
    ),
  },
  { clave: 'pedido', titulo: 'Pedido', render: (r) => r.pedidoId ?? '—' },
  { clave: 'cliente', titulo: 'Cliente', render: (r) => r.nombreConsumidor ?? '—' },
  { clave: 'motivo', titulo: 'Motivo', render: (r) => ETIQUETA_MOTIVO[r.motivo] },
  { clave: 'estado', titulo: 'Estado', render: (r) => <EstadoBadge entidad="reclamo" estado={r.estado} size="sm" /> },
  {
    clave: 'sla',
    titulo: 'SLA',
    render: (r) =>
      r.estadoSla ? (
        <EstadoBadge
          entidad="sla"
          estado={r.estadoSla}
          texto={textoSlaCorto(r.estadoSla, r.diasHabilesRestantes)}
          size="sm"
          tt="none"
        />
      ) : (
        '—'
      ),
  },
];

/** Desde el Dashboard (atención prioritaria) se llega con ?sla=... o ?codigo=... */
function controlesDeUrl(params: URLSearchParams): Controles {
  const sla = params.get('sla');
  return OPCIONES_SLA.some((o) => o.value === sla) ? { ...CONTROLES_INICIALES, sla: sla! } : CONTROLES_INICIALES;
}

export function ReclamosPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pagina, setPagina, reiniciar } = usePaginacion(TAMANO_PAGINA);
  const [controles, setControles] = useState<Controles>(() => controlesDeUrl(params));
  const [aplicados, setAplicados] = useState<Controles>(() => controlesDeUrl(params));
  const [orden, setOrden] = useState<'RECIENTES' | 'ANTIGUOS'>('RECIENTES');
  const [seleccionado, setSeleccionado] = useState<string | null>(() => params.get('codigo'));

  const consulta = useConsulta(
    () => listarReclamos({ ...aFiltros(aplicados), orden, pagina, tamano: TAMANO_PAGINA }),
    [aplicados, orden, pagina],
  );

  const cambiar = (campo: keyof Controles) => (valor: string | null) =>
    setControles((c) => ({ ...c, [campo]: valor ?? TODOS }));

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

  const columnas: ColumnaTabla<ReclamoResumen>[] = [
    ...COLUMNAS,
    {
      clave: 'accion',
      titulo: 'Acción',
      render: (r) => (
        <Button size="xs" variant="default" onClick={() => setSeleccionado(r.codigoSeguimiento)}>
          Ver
        </Button>
      ),
    },
  ];

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
        <Title order={1}>Reclamos</Title>
      </Group>

      <Paper withBorder radius="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Buscar"
            placeholder="Código de reclamo, pedido o cliente"
            value={controles.buscar}
            onChange={(e) => {
              const valor = e.currentTarget.value;
              setControles((c) => ({ ...c, buscar: valor }));
            }}
            onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
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
            label="SLA"
            data={OPCIONES_SLA}
            value={controles.sla}
            onChange={cambiar('sla')}
            allowDeselect={false}
            style={{ flex: '1 1 150px' }}
          />
          <Select
            label="Fecha de creación"
            data={OPCIONES_FECHA}
            value={controles.fecha}
            onChange={cambiar('fecha')}
            allowDeselect={false}
            style={{ flex: '1 1 170px' }}
          />
          <Group gap="sm">
            <Button onClick={aplicarFiltros}>Aplicar filtros</Button>
            <Button variant="default" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </Group>
        </Group>
      </Paper>

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, lg: seleccionado ? 7 : 12 }}>
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" align="flex-start" mb="sm">
              <Title order={3}>Reclamos</Title>
              <Select
                aria-label="Orden"
                data={OPCIONES_ORDEN}
                value={orden}
                onChange={(v) => {
                  setOrden((v as 'RECIENTES' | 'ANTIGUOS') ?? 'RECIENTES');
                  setSeleccionado(null);
                  reiniciar();
                }}
                allowDeselect={false}
                w={170}
              />
            </Group>
            <EstadoCarga
              cargando={consulta.cargando}
              error={consulta.error}
              datos={consulta.datos}
              onReintentar={consulta.recargar}
              mensajeVacio="No hay reclamos que coincidan con los filtros."
            >
              {(listado) => {
                const primero = listado.pagina * TAMANO_PAGINA + 1;
                const ultimo = primero + listado.contenido.length - 1;
                return (
                  <TablaPaginada
                    columnas={columnas}
                    filas={listado.contenido}
                    obtenerClave={(r) => r.codigoSeguimiento}
                    pagina={listado.pagina}
                    totalPaginas={listado.totalPaginas}
                    totalElementos={listado.totalElementos}
                    resumen={`Mostrando ${primero} a ${ultimo} de ${listado.totalElementos} reclamos`}
                    onCambiarPagina={(p) => {
                      setSeleccionado(null);
                      setPagina(p);
                    }}
                  />
                );
              }}
            </EstadoCarga>
          </Paper>
        </Grid.Col>

        {seleccionado && (
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <DetalleReclamo
              key={seleccionado}
              codigo={seleccionado}
              onCerrar={() => setSeleccionado(null)}
              onActualizado={consulta.recargar}
            />
          </Grid.Col>
        )}
      </Grid>
    </Stack>
  );
}
