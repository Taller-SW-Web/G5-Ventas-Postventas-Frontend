// Atención prioritaria (Mockup 01, 7.3 y 7.4) — Responsable: Fabrizio (F6)
// Bandeja consolidada de reclamos por SLA y expedientes de postventa pendientes. Se llega desde el Dashboard
// ("Ver todas", o "Ver" de un caso: ?tipo=...&codigo=... abre ya filtrado y con el detalle del caso).
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import type { PrioridadCaso, SituacionCaso, TipoCaso } from '@/types/reclamo';
import { dia } from '../Reclamos/formato';
import {
  ETIQUETA_PRIORIDAD,
  ETIQUETA_SITUACION,
  ETIQUETA_TIPO_CASO,
  cargarCasosPrioritarios,
  type CasoPrioritario,
  type ResultadoCasos,
} from './casos';
import { ModalDetallePrioritario } from './ModalDetallePrioritario';

const TODOS = 'TODOS';

const OPCIONES_TIPO = [
  { value: TODOS, label: 'Todos' },
  ...(['RECLAMO', 'DEVOLUCION', 'CAMBIO'] as TipoCaso[]).map((t) => ({ value: t, label: ETIQUETA_TIPO_CASO[t] })),
];

const OPCIONES_PRIORIDAD = [
  { value: TODOS, label: 'Todas' },
  ...(['ALTA', 'MEDIA'] as PrioridadCaso[]).map((p) => ({ value: p, label: ETIQUETA_PRIORIDAD[p] })),
];

const OPCIONES_SITUACION = [
  { value: TODOS, label: 'Todas' },
  ...(['VENCIDO', 'POR_VENCER', 'PENDIENTE_EVALUACION', 'EN_EVALUACION'] as SituacionCaso[]).map((s) => ({
    value: s,
    label: ETIQUETA_SITUACION[s],
  })),
];

interface Filtros {
  buscar: string;
  tipo: string;
  prioridad: string;
  situacion: string;
}

const INICIALES: Filtros = { buscar: '', tipo: TODOS, prioridad: TODOS, situacion: TODOS };

function filtrar(casos: CasoPrioritario[], f: Filtros): CasoPrioritario[] {
  const texto = f.buscar.trim().toLowerCase();
  return casos.filter(
    (c) =>
      (f.tipo === TODOS || c.tipo === f.tipo) &&
      (f.prioridad === TODOS || c.prioridad === f.prioridad) &&
      (f.situacion === TODOS || c.situacion === f.situacion) &&
      (!texto ||
        c.codigo.toLowerCase().includes(texto) ||
        (c.cliente ?? '').toLowerCase().includes(texto) ||
        (c.pedidoId ?? '').toLowerCase().includes(texto) ||
        c.contexto.toLowerCase().includes(texto)),
  );
}

export function AtencionPrioritariaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tipoInicial = OPCIONES_TIPO.some((o) => o.value === params.get('tipo')) ? params.get('tipo')! : TODOS;
  const [controles, setControles] = useState<Filtros>({ ...INICIALES, tipo: tipoInicial });
  const [aplicados, setAplicados] = useState<Filtros>({ ...INICIALES, tipo: tipoInicial });
  const [codigoAbierto, setCodigoAbierto] = useState<string | null>(() => params.get('codigo'));

  const consulta = useConsulta(cargarCasosPrioritarios, []);

  const cambiar = (campo: keyof Filtros) => (valor: string | null) =>
    setControles((c) => ({ ...c, [campo]: valor ?? TODOS }));

  const abierto = useMemo(
    () => consulta.datos?.casos.find((c) => c.codigo === codigoAbierto) ?? null,
    [consulta.datos, codigoAbierto],
  );

  return (
    <Stack gap="lg">
      <Group gap="sm" align="flex-start">
        <ActionIcon variant="default" size="lg" onClick={() => navigate('/admin/dashboard')} aria-label="Volver al Dashboard">
          ←
        </ActionIcon>
        <div>
          <Title order={1}>Atención prioritaria</Title>
          <Text size="sm" c="dimmed">
            Bandeja consolidada de reclamos por SLA y expedientes de postventa pendientes
          </Text>
        </div>
      </Group>

      <Paper withBorder radius="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Buscar"
            placeholder="Código, cliente, pedido o motivo"
            value={controles.buscar}
            onChange={(e) => {
              const valor = e.currentTarget.value;
              setControles((c) => ({ ...c, buscar: valor }));
            }}
            onKeyDown={(e) => e.key === 'Enter' && setAplicados(controles)}
            style={{ flex: '2 1 240px' }}
          />
          <Select
            label="Tipo"
            data={OPCIONES_TIPO}
            value={controles.tipo}
            onChange={cambiar('tipo')}
            allowDeselect={false}
            style={{ flex: '1 1 150px' }}
          />
          <Select
            label="Prioridad"
            data={OPCIONES_PRIORIDAD}
            value={controles.prioridad}
            onChange={cambiar('prioridad')}
            allowDeselect={false}
            style={{ flex: '1 1 150px' }}
          />
          <Select
            label="Situación"
            data={OPCIONES_SITUACION}
            value={controles.situacion}
            onChange={cambiar('situacion')}
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
        </Group>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" align="flex-start" mb="md" wrap="wrap">
          <div>
            <Title order={3}>Casos prioritarios</Title>
            <Text size="sm" c="dimmed">
              Reclamos por urgencia de SLA y expedientes de devolución o cambio pendientes de atención
            </Text>
          </div>
          <Group gap="xs">
            <Badge variant="light" color="signal" tt="none">
              Reclamos · SLA
            </Badge>
            <Badge variant="light" color="volt" tt="none">
              Postventa
            </Badge>
          </Group>
        </Group>

        <EstadoCarga
          cargando={consulta.cargando}
          error={consulta.error}
          datos={consulta.datos}
          onReintentar={consulta.recargar}
          esVacio={() => false}
        >
          {(resultado: ResultadoCasos) => {
            const filas = filtrar(resultado.casos, aplicados);
            return (
              <Stack gap="sm">
                {!resultado.devolucionesDisponibles && (
                  <Alert color="blue" variant="light">
                    Las devoluciones y cambios se mostrarán aquí cuando el listado de devoluciones (2.4) permita consultar
                    todos los expedientes sin indicar un cliente.
                  </Alert>
                )}
                {filas.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">
                    No hay casos prioritarios que coincidan con los filtros.
                  </Text>
                ) : (
                  <Table.ScrollContainer minWidth={800}>
                    <Table verticalSpacing="sm" highlightOnHover>
                      <Table.Thead bg="cloud.2">
                        <Table.Tr>
                          <Table.Th>Código / Fecha</Table.Th>
                          <Table.Th>Tipo</Table.Th>
                          <Table.Th>Cliente</Table.Th>
                          <Table.Th>Contexto</Table.Th>
                          <Table.Th>Situación</Table.Th>
                          <Table.Th>Prioridad</Table.Th>
                          <Table.Th>Acción</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {filas.map((c) => (
                          <Table.Tr key={c.codigo}>
                            <Table.Td>
                              <Text size="sm" fw={600}>
                                {c.codigo}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {dia(c.fecha)}
                              </Text>
                            </Table.Td>
                            <Table.Td>{ETIQUETA_TIPO_CASO[c.tipo]}</Table.Td>
                            <Table.Td>{c.cliente ?? '—'}</Table.Td>
                            <Table.Td>{c.contexto}</Table.Td>
                            <Table.Td>
                              <EstadoBadge
                                entidad="situacion"
                                estado={c.situacion}
                                texto={ETIQUETA_SITUACION[c.situacion]}
                                size="sm"
                                tt="none"
                              />
                            </Table.Td>
                            <Table.Td>
                              <EstadoBadge
                                entidad="prioridad"
                                estado={c.prioridad}
                                texto={ETIQUETA_PRIORIDAD[c.prioridad]}
                                size="sm"
                                tt="none"
                              />
                            </Table.Td>
                            <Table.Td>
                              <Button size="xs" variant="default" onClick={() => setCodigoAbierto(c.codigo)}>
                                Ver
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
                <Text size="sm" c="dimmed">
                  Mostrando {filas.length} {filas.length === 1 ? 'caso prioritario' : 'casos prioritarios'}
                </Text>
              </Stack>
            );
          }}
        </EstadoCarga>
      </Paper>

      <ModalDetallePrioritario caso={abierto} onCerrar={() => setCodigoAbierto(null)} />
    </Stack>
  );
}
