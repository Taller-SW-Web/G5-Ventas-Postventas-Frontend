// Mockup 05 — Atención prioritaria (pantalla complementaria del Hub Postventa). Responsable: Joseph
// Bandeja consolidada de solo consulta: el caso se sigue gestionando en su propio módulo.
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { EstadoCarga } from '@/components/EstadoCarga';
import { TablaPaginada, type ColumnaTabla } from '@/components/TablaPaginada';
import { useConsulta } from '@/hooks/useConsulta';
import { dia } from '@/pages/Devoluciones/formato';
import {
  ETIQUETA_PRIORIDAD,
  ETIQUETA_SITUACION,
  ETIQUETA_TIPO_CASO,
  obtenerCasosPrioritarios,
  type CasoPrioritario,
  type PrioridadCaso,
  type SituacionCaso,
} from './casosPrioritarios';

const TODOS = 'TODOS';

// Valores del filtro "Tipo" del Figma: Reclamos, Devoluciones o Cambios.
const OPCIONES_TIPO = [
  { value: TODOS, label: 'Todos' },
  { value: 'RECLAMOS', label: 'Reclamos' },
  { value: 'DEVOLUCIONES', label: 'Devoluciones' },
  { value: 'CAMBIOS', label: 'Cambios' },
];
const TIPO_POR_FILTRO = { RECLAMOS: 'RECLAMO', DEVOLUCIONES: 'DEVOLUCION', CAMBIOS: 'CAMBIO' } as const;

const OPCIONES_PRIORIDAD = [
  { value: TODOS, label: 'Todas' },
  ...(Object.keys(ETIQUETA_PRIORIDAD) as PrioridadCaso[]).map((p) => ({ value: p, label: ETIQUETA_PRIORIDAD[p] })),
];

const OPCIONES_SITUACION = [
  { value: TODOS, label: 'Todas' },
  ...(Object.keys(ETIQUETA_SITUACION) as SituacionCaso[]).map((s) => ({ value: s, label: ETIQUETA_SITUACION[s] })),
];

const COLOR_SITUACION: Record<SituacionCaso, string> = {
  VENCIDO: 'red',
  PROXIMO_A_VENCER: 'yellow',
  PENDIENTE_EVALUACION: 'yellow',
  EN_EVALUACION: 'signal',
};

const COLOR_PRIORIDAD: Record<PrioridadCaso, string> = { ALTA: 'orange', MEDIA: 'gray' };

interface Controles {
  caso: string | null;
  tipo: string;
  prioridad: string;
  situacion: string;
}

const CONTROLES_INICIALES: Controles = { caso: null, tipo: TODOS, prioridad: TODOS, situacion: TODOS };

/** Desde el Hub se llega con ?tipo=DEVOLUCIONES o ?tipo=RECLAMOS. */
function controlesDeUrl(params: URLSearchParams): Controles {
  const tipo = params.get('tipo');
  return OPCIONES_TIPO.some((o) => o.value === tipo) ? { ...CONTROLES_INICIALES, tipo: tipo! } : CONTROLES_INICIALES;
}

function filtrar(casos: CasoPrioritario[], c: Controles): CasoPrioritario[] {
  return casos.filter(
    (caso) =>
      (!c.caso || caso.codigo === c.caso) &&
      (c.tipo === TODOS || caso.tipo === TIPO_POR_FILTRO[c.tipo as keyof typeof TIPO_POR_FILTRO]) &&
      (c.prioridad === TODOS || caso.prioridad === c.prioridad) &&
      (c.situacion === TODOS || caso.situacion === c.situacion),
  );
}

function DetalleCaso({ caso, onCerrar }: { caso: CasoPrioritario | null; onCerrar: () => void }) {
  const navigate = useNavigate();
  const filas: [string, string][] = caso
    ? [
        ['Código', caso.codigo],
        ['Fecha', dia(caso.fecha)],
        ['Tipo', ETIQUETA_TIPO_CASO[caso.tipo]],
        ['Cliente', caso.cliente],
        ['Contexto', caso.contexto],
        ['Situación', ETIQUETA_SITUACION[caso.situacion]],
        ['Prioridad', ETIQUETA_PRIORIDAD[caso.prioridad]],
      ]
    : [];

  return (
    <Modal
      opened={caso !== null}
      onClose={onCerrar}
      size={520}
      title={
        <Text ff="Oswald, sans-serif" fw={700} fz={22} tt="uppercase">
          Detalle del caso
        </Text>
      }
    >
      <Divider mb="md" />
      <Box style={{ display: 'grid', gridTemplateColumns: '8.5rem 1fr', gap: '14px 8px' }}>
        {filas.map(([etiqueta, valor]) => (
          <Box key={etiqueta} display="contents">
            <Text size="sm" c="dimmed">
              {etiqueta}
            </Text>
            <Text size="sm" fw={500}>
              {valor}
            </Text>
          </Box>
        ))}
      </Box>
      <Paper bg="cloud.2" radius="md" p="sm" mt="lg">
        <Text size="xs" c="dimmed" ta="center">
          El caso se continúa gestionando en su módulo específico de Postventa
        </Text>
      </Paper>
      <Button fullWidth mt="sm" onClick={() => caso && navigate(caso.ruta)}>
        Abrir caso en módulo
      </Button>
    </Modal>
  );
}

export function AtencionPrioritariaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [controles, setControles] = useState<Controles>(() => controlesDeUrl(params));
  const [aplicados, setAplicados] = useState<Controles>(() => controlesDeUrl(params));
  const [abierto, setAbierto] = useState<CasoPrioritario | null>(null);
  const consulta = useConsulta(obtenerCasosPrioritarios, []);

  const casos = consulta.datos?.casos;
  const visibles = useMemo(() => filtrar(casos ?? [], aplicados), [casos, aplicados]);

  const opcionesCaso = (casos ?? []).map((c) => ({ value: c.codigo, label: `${c.codigo} · ${c.cliente}` }));

  const cambiar = (campo: keyof Controles) => (valor: string | null) =>
    setControles((c) => ({ ...c, [campo]: campo === 'caso' ? valor : (valor ?? TODOS) }));

  const columnas: ColumnaTabla<CasoPrioritario>[] = [
    {
      clave: 'codigo',
      titulo: 'Código / Fecha',
      render: (c) => (
        <Stack gap={0}>
          <Text size="sm" fw={600}>
            {c.codigo}
          </Text>
          <Text size="xs" c="dimmed">
            {dia(c.fecha)}
          </Text>
        </Stack>
      ),
    },
    { clave: 'tipo', titulo: 'Tipo', render: (c) => ETIQUETA_TIPO_CASO[c.tipo] },
    { clave: 'cliente', titulo: 'Cliente', render: (c) => c.cliente },
    { clave: 'contexto', titulo: 'Contexto', render: (c) => c.contexto },
    {
      clave: 'situacion',
      titulo: 'Situación',
      render: (c) => (
        <Badge color={COLOR_SITUACION[c.situacion]} variant="light" tt="none" radius="xl">
          {ETIQUETA_SITUACION[c.situacion]}
        </Badge>
      ),
    },
    {
      clave: 'prioridad',
      titulo: 'Prioridad',
      render: (c) => (
        <Badge color={COLOR_PRIORIDAD[c.prioridad]} variant="light" tt="none" radius="xl">
          {ETIQUETA_PRIORIDAD[c.prioridad]}
        </Badge>
      ),
    },
    {
      clave: 'accion',
      titulo: 'Acción',
      render: (c) => (
        <Button size="xs" variant="default" onClick={() => setAbierto(c)}>
          Ver
        </Button>
      ),
    },
  ];

  return (
    <Stack gap="lg">
      <Group gap="sm" align="flex-start" wrap="nowrap">
        <ActionIcon
          variant="default"
          size="lg"
          mt={6}
          onClick={() => navigate('/admin/postventa')}
          aria-label="Volver a Postventa"
        >
          ←
        </ActionIcon>
        <Stack gap={0}>
          <Title order={1}>Atención prioritaria</Title>
          <Text size="sm" c="dimmed">
            Bandeja consolidada de reclamos por SLA y expedientes de postventa pendientes
          </Text>
        </Stack>
      </Group>

      <Paper withBorder radius="md" p="md" shadow="xs">
        <Group align="flex-end" gap="md" wrap="wrap">
          <Select
            label="Buscar"
            placeholder="Seleccionar"
            data={opcionesCaso}
            value={controles.caso}
            onChange={cambiar('caso')}
            searchable
            clearable
            nothingFoundMessage="Sin coincidencias"
            style={{ flex: '2 1 240px' }}
          />
          <Select
            label="Tipo"
            data={OPCIONES_TIPO}
            value={controles.tipo}
            onChange={cambiar('tipo')}
            allowDeselect={false}
            style={{ flex: '1 1 130px' }}
          />
          <Select
            label="Prioridad"
            data={OPCIONES_PRIORIDAD}
            value={controles.prioridad}
            onChange={cambiar('prioridad')}
            allowDeselect={false}
            style={{ flex: '1 1 130px' }}
          />
          <Select
            label="Situación"
            data={OPCIONES_SITUACION}
            value={controles.situacion}
            onChange={cambiar('situacion')}
            allowDeselect={false}
            style={{ flex: '1 1 170px' }}
          />
          <Group gap="sm">
            <Button onClick={() => setAplicados(controles)}>Aplicar filtros</Button>
            <Button
              variant="default"
              onClick={() => {
                setControles(CONTROLES_INICIALES);
                setAplicados(CONTROLES_INICIALES);
              }}
            >
              Limpiar
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper withBorder radius="md" p="md" shadow="xs">
        <Group justify="space-between" align="flex-start" mb="md" wrap="wrap">
          <Stack gap={0}>
            <Title order={2} size="h4">
              Casos prioritarios
            </Title>
            <Text size="xs" c="dimmed">
              Reclamos por urgencia de SLA y expedientes de devolución/cambio pendientes de atención
            </Text>
          </Stack>
          <Group gap="xs">
            <Badge color="signal" variant="light" radius="xl">
              Reclamos · SLA
            </Badge>
            <Badge color="volt" variant="light" radius="xl" c="volt.9">
              Postventa
            </Badge>
          </Group>
        </Group>

        {consulta.datos?.avisos.map((aviso) => (
          <Alert key={aviso} color="yellow" mb="md">
            {aviso}
          </Alert>
        ))}
        <EstadoCarga
          cargando={consulta.cargando}
          error={consulta.error}
          datos={casos ? visibles : null}
          mensajeVacio="No hay casos prioritarios con estos filtros."
          onReintentar={consulta.recargar}
        >
          {(casos) => (
            <TablaPaginada
              columnas={columnas}
              filas={casos}
              obtenerClave={(c) => c.codigo}
              pagina={0}
              totalPaginas={1}
              resumen={`Mostrando ${casos.length} casos prioritarios`}
              onCambiarPagina={() => undefined}
            />
          )}
        </EstadoCarga>
      </Paper>

      <DetalleCaso caso={abierto} onCerrar={() => setAbierto(null)} />
    </Stack>
  );
}
