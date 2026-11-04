// Mockup 04 — Anulaciones (F2). Responsable: Luis Arroyo
// Bandeja 1.8 con filtros, orden y paginación en el servidor; decisiones con 1.9 y nuevas solicitudes con 1.7.
// Todo sale del servidor: si 1.8 falla se muestra el error con "Reintentar" (sin casos de ejemplo), y una
// decisión solo se anuncia cuando 1.9 respondió. El panel lateral muestra siempre la fila de la última consulta.
import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  Title,
  Text,
  Paper,
  Group,
  Stack,
  TextInput,
  Select,
  Button,
  Grid,
  Badge,
  Table,
  Pagination,
  Card,
  Divider,
  ActionIcon,
  Textarea,
  Alert,
  Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BotonVolver } from '@/components/BotonVolver';
import { EstadoBadge } from '@/components/EstadoBadge';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import {
  listarAnulaciones,
  resolverAnulacion,
  solicitarAnulacion,
} from '@/services/anulaciones';
import { ApiError } from '@/services/api';
import { detallesDePedidos } from '@/services/pedidos';
import { sesionActual } from '@/services/auth';
import { ETIQUETA_CANAL, ETIQUETA_ESTADO, formatoFechaHora } from '@/pages/Pedidos/formato';
import {
  aItemBandeja,
  estadoDeFiltro,
  etiquetaMotivo,
  type Autorizacion,
  type EstadoSolicitud,
  type ItemBandejaAnulacion,
} from './bandejaAnulaciones';
import type { Canal } from '@/types/comun';
import type { ListadoAnulacionesPendientes, MotivoAnulacion } from '@/types/pedido';

const CANALES: Canal[] = ['MARKETPLACE', 'CHATBOT', 'RETAIL'];

/** Colores de las capturas del Mockup 04 (siempre acompañados del texto). */
const COLOR_AUTORIZACION: Record<Autorizacion, string> = {
  Pendiente: 'yellow',
  Aprobada: 'volt',
  Rechazada: 'red',
};

const COLOR_SOLICITUD: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'yellow',
  EJECUTADA: 'signal',
  RECHAZADA: 'red',
};

/** Badge suave de autorización o solicitud; el volt claro necesita su tono oscuro para leerse. */
function Pastilla({ color, mayusculas = true, children }: { color: string; mayusculas?: boolean; children: ReactNode }) {
  return (
    <Badge
      size="sm"
      variant="light"
      color={color}
      c={color === 'volt' ? 'volt.9' : undefined}
      tt={mayusculas ? undefined : 'none'}
      miw="max-content"
    >
      {children}
    </Badge>
  );
}

/** "Mostrando 1–5 de 14 solicitudes" (Mockup 04, 5.7). pagina empieza en 1. */
function resumenIntervalo(pagina: number, tamano: number, enPagina: number, total: number): string {
  if (enPagina === 0) return `0 de ${total} solicitudes`;
  const desde = (pagina - 1) * tamano + 1;
  return `Mostrando ${desde}–${desde + enPagina - 1} de ${total} solicitudes`;
}

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
      <Text size="sm" c="dimmed">
        {etiqueta}
      </Text>
      <Text component="div" size="sm" fw={500} ta="right">
        {children}
      </Text>
    </Group>
  );
}

const OPCIONES_MOTIVO_GESTOR: { value: MotivoAnulacion; label: string }[] = [
  { value: 'SOLICITUD_CLIENTE', label: 'Solicitud del cliente (arrepentimiento / cambio de opinión)' },
  { value: 'ARREPENTIMIENTO_COMPRA', label: 'Arrepentimiento de compra' },
  { value: 'ERROR_SELECCION_PRODUCTO', label: 'Error de selección de producto' },
  { value: 'ERROR_DATOS_ENVIO', label: 'Error en datos de envío' },
  { value: 'DUPLICADO', label: 'Pedido duplicado' },
];

const ELEMENTOS_POR_PAGINA = 5;

const mensajeError = (e: unknown, porDefecto: string) => (e instanceof ApiError ? e.message : porDefecto);

export function AnulacionesPage() {
  // ?pedidoId= (desde el detalle del pedido) abre "Iniciar anulación" para ese pedido.
  // ?buscar=PED-...&solicitud=ANUL-... (desde un reembolso, Mockup 08 9.6) busca el pedido y abre esa solicitud.
  const navegar = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pedidoIdParam = searchParams.get('pedidoId');
  const buscarParam = searchParams.get('buscar');
  const solicitudParam = searchParams.get('solicitud');

  // Filtros: los controles editan un borrador y "Aplicar filtros" (o Enter en Buscar) lo aplica (Mockup 04, 5.4)
  const busquedaInicial = pedidoIdParam || buscarParam || '';
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [estadoBorrador, setEstadoBorrador] = useState<string | null>('Todos');
  const [canalBorrador, setCanalBorrador] = useState<string | null>('Todos');
  const [busquedaAplicada, setBusquedaAplicada] = useState(busquedaInicial);
  const [filtroEstado, setFiltroEstado] = useState<string | null>('Todos');
  const [filtroCanal, setFiltroCanal] = useState<string | null>('Todos');
  const [orden, setOrden] = useState<string | null>('recientes');

  const aplicarFiltros = () => {
    setBusquedaAplicada(busqueda);
    setFiltroEstado(estadoBorrador);
    setFiltroCanal(canalBorrador);
  };

  // Modal Iniciar Anulación (Endpoint 1.7)
  const [modalSolicitarAbierto, setModalSolicitarAbierto] = useState(false);
  const [pedidoIdSolicitud, setPedidoIdSolicitud] = useState(pedidoIdParam || '');
  const [motivoSolicitud, setMotivoSolicitud] = useState<MotivoAnulacion>('SOLICITUD_CLIENTE');
  const [comentarioSolicitud, setComentarioSolicitud] = useState('');
  const [solicitandoAnulacion, setSolicitandoAnulacion] = useState(false);

  useEffect(() => {
    if (pedidoIdParam) {
      setBusqueda(pedidoIdParam);
      setBusquedaAplicada(pedidoIdParam);
      setPedidoIdSolicitud(pedidoIdParam);
      setModalSolicitarAbierto(true);
    }
  }, [pedidoIdParam]);

  const cerrarModalSolicitar = () => {
    setModalSolicitarAbierto(false);
    setPedidoIdSolicitud('');
    setComentarioSolicitud('');
    setMotivoSolicitud('SOLICITUD_CLIENTE');
    if (searchParams.has('pedidoId')) {
      const nuevosParams = new URLSearchParams(searchParams);
      nuevosParams.delete('pedidoId');
      setSearchParams(nuevosParams, { replace: true });
    }
    setBusqueda('');
    setBusquedaAplicada('');
  };

  // Paginación (base 1 para la UI, base 0 para el backend)
  const [pagina, setPagina] = useState(1);

  // Solicitud seleccionada: se guarda el id y la fila sale siempre de la última respuesta de 1.8
  const [idSeleccionado, setIdSeleccionado] = useState<string | null>(solicitudParam);

  // Resetear a página 1 cuando cambian filtros, orden o búsqueda (no al montar: conserva ?solicitud=)
  // (se compara con los filtros anteriores: en StrictMode el efecto corre dos veces al montar)
  const filtrosPrevios = useRef(JSON.stringify([busquedaAplicada, filtroEstado, filtroCanal, orden]));
  useEffect(() => {
    const actuales = JSON.stringify([busquedaAplicada, filtroEstado, filtroCanal, orden]);
    if (actuales === filtrosPrevios.current) return;
    filtrosPrevios.current = actuales;
    setPagina(1);
    setIdSeleccionado(null);
  }, [busquedaAplicada, filtroEstado, filtroCanal, orden]);

  // Modales de confirmación
  const [modalAprobarAbierto, setModalAprobarAbierto] = useState(false);
  const [modalRechazarAbierto, setModalRechazarAbierto] = useState(false);
  const [comentarioRechazo, setComentarioRechazo] = useState('');
  const [comentarioAprobacion, setComentarioAprobacion] = useState('');
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const estadoBackend = estadoDeFiltro(filtroEstado);
  const canalBackend: Canal | undefined =
    !filtroCanal || filtroCanal === 'Todos' ? undefined : (filtroCanal as Canal);

  // Consulta al backend con filtros, orden y paginación en el servidor (1.8)
  const consultaBackend = useCallback(async (): Promise<ListadoAnulacionesPendientes> => {
    const listado = await listarAnulaciones({
      estado: estadoBackend,
      canal: canalBackend,
      busqueda: busquedaAplicada.trim() || undefined,
      page: pagina - 1,
      size: ELEMENTOS_POR_PAGINA,
      sort: orden === 'antiguos' ? 'fecha,asc' : 'fecha,desc',
    });

    // Si algún item vino sin datos del pedido, se completa con el detalle de M1 (los que fallen quedan en "—")
    const faltanDetalles = listado.contenido.some((a) => !a.nombreCliente || !a.canal);
    if (faltanDetalles) {
      const pedidos = await detallesDePedidos(listado.contenido.map((a) => a.pedidoId));
      return {
        ...listado,
        contenido: listado.contenido.map((a) => {
          const p = pedidos.get(a.pedidoId);
          return p ? { ...a, canal: a.canal ?? p.canal, nombreCliente: a.nombreCliente ?? p.contacto?.nombreCompleto ?? null, estadoPedido: a.estadoPedido ?? p.estado } : a;
        }),
      };
    }

    return listado;
  }, [estadoBackend, canalBackend, busquedaAplicada, pagina, orden]);

  const { datos, cargando, error, recargar } = useConsulta(consultaBackend, [consultaBackend]);

  const casosPaginados: ItemBandejaAnulacion[] = (datos?.contenido ?? []).map(aItemBandeja);
  const casoSeleccionado = casosPaginados.find((c) => c.solicitudAnulacionId === idSeleccionado) ?? null;
  const totalPaginas = Math.max(1, datos?.totalPaginas ?? 1);
  const totalSolicitudes = datos?.totalElementos ?? 0;
  // Sin la última consulta confirmada no se decide nada: la fila podría estar desactualizada
  const decisionesBloqueadas = cargando || Boolean(error);

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setBusquedaAplicada('');
    setEstadoBorrador('Todos');
    setCanalBorrador('Todos');
    setFiltroEstado('Todos');
    setFiltroCanal('Todos');
    setOrden('recientes');
    setPagina(1);
    setIdSeleccionado(null);
  };

  // 1.9 PATCH /api/v1/pedidos/{pedidoId}/anulaciones/{anulacionId}. Éxito o 409: el resultado lo decide el
  // servidor (en un 409 por despacho ya marcó la solicitud como RECHAZADA), así que se vuelve a consultar.
  const resolver = async (decision: 'APROBADA' | 'RECHAZADA', comentario: string) => {
    if (!casoSeleccionado) return;
    setProcesandoAccion(true);
    try {
      const resp = await resolverAnulacion(casoSeleccionado.pedidoId, casoSeleccionado.solicitudAnulacionId, {
        decision,
        autorizadorId: sesionActual().usuarioId ?? 'ADMIN_VENTAS',
        comentario: comentario.trim(),
      });
      setModalAprobarAbierto(false);
      setModalRechazarAbierto(false);
      setComentarioAprobacion('');
      setComentarioRechazo('');
      notifications.show(
        resp.estadoAnulacion === 'EJECUTADA'
          ? {
              title: 'Anulación aprobada',
              message: `El pedido ${resp.pedidoId} quedó en ${resp.estadoPedido}.`,
              color: 'green',
            }
          : {
              title: 'Solicitud rechazada',
              message: `La anulación quedó ${resp.estadoAnulacion}; el pedido ${resp.pedidoId} sigue en ${resp.estadoPedido}.`,
              color: 'orange',
            },
      );
      recargar();
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        setModalAprobarAbierto(false);
        setModalRechazarAbierto(false);
        notifications.show({ title: 'No se pudo aplicar la decisión', message: e.message, color: 'orange' });
        recargar();
      } else {
        notifications.show({
          title: decision === 'APROBADA' ? 'Error al aprobar' : 'Error al rechazar',
          message: mensajeError(e, 'No se pudo comunicar la decisión al servidor.'),
          color: 'red',
        });
      }
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Enviar Solicitud de Anulación (Endpoint 1.7 POST /api/v1/pedidos/{pedidoId}/anulaciones)
  const handleEnviarSolicitudAnulacion = async () => {
    if (!pedidoIdSolicitud.trim() || !motivoSolicitud) return;
    setSolicitandoAnulacion(true);

    try {
      const resp = await solicitarAnulacion(pedidoIdSolicitud.trim(), {
        motivo: motivoSolicitud,
        comentario: comentarioSolicitud.trim() || undefined,
      });

      if (resp.autorizacionRequerida) {
        notifications.show({
          title: 'Solicitud registrada',
          message: `El pedido ${resp.pedidoId} está en preparación. Se generó la solicitud ${resp.solicitudAnulacionId} para evaluación del Gestor.`,
          color: 'blue',
        });
      } else {
        notifications.show({
          title: 'Pedido anulado',
          message: `El pedido ${resp.pedidoId} quedó en ${resp.estadoPedido}. ${resp.solicitudReembolsoGenerada ? 'Se originó la solicitud de reembolso en F4.' : ''}`,
          color: 'green',
        });
      }
      cerrarModalSolicitar();
      recargar();
    } catch (e: unknown) {
      notifications.show({
        title: 'Error al solicitar anulación',
        message: mensajeError(e, 'No se pudo comunicar la solicitud al servidor.'),
        color: 'red',
      });
    } finally {
      setSolicitandoAnulacion(false);
    }
  };

  return (
    <Stack gap="lg">
      {/* Encabezado con flecha de regreso (Mockup 04, 4) */}
      <Group justify="space-between" align="center" wrap="wrap">
        <Group gap="sm" wrap="nowrap">
          <BotonVolver a="/admin/pedidos" etiqueta="Volver a pedidos" />
          <Title order={1}>Anulaciones</Title>
        </Group>
        {/* No está en el Figma (allí se llega desde el pedido): permite registrar 1.7 sin abrir antes el detalle */}
        <Button variant="outline" onClick={() => setModalSolicitarAbierto(true)}>
          Iniciar anulación
        </Button>
      </Group>

      {/* Barra de filtros: se preparan y se aplican con el botón */}
      <Paper p="md" radius="md" withBorder shadow="xs">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label="Buscar"
            variant="filled"
            placeholder="Código de pedido o cliente"
            leftSection={<IconSearch size={20} aria-hidden />}
            value={busqueda}
            onChange={(e) => setBusqueda(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
            style={{ flex: '2 1 240px' }}
          />
          <Select
            label="Estado"
            variant="filled"
            allowDeselect={false}
            value={estadoBorrador}
            onChange={(val) => setEstadoBorrador(val || 'Todos')}
            data={['Todos', 'Pendiente', 'Aprobada', 'Rechazada', 'Ejecutada']}
            style={{ flex: '1 1 160px' }}
          />
          <Select
            label="Canal"
            variant="filled"
            allowDeselect={false}
            value={canalBorrador}
            onChange={(val) => setCanalBorrador(val || 'Todos')}
            data={[{ value: 'Todos', label: 'Todos' }, ...CANALES.map((c) => ({ value: c, label: ETIQUETA_CANAL[c] }))]}
            style={{ flex: '1 1 160px' }}
          />
          <Group gap="sm" ml="auto">
            <Button onClick={aplicarFiltros}>Aplicar filtros</Button>
            <Button variant="default" onClick={handleLimpiarFiltros}>
              Limpiar
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Contenido Principal: Bandeja + Panel Lateral */}
      <Grid gap="md">
        {/* Bandeja de Solicitudes (Tabla) */}
        {/* La bandeja ocupa 9 columnas aunque no haya selección: la derecha queda para la revisión (Mockup 04) */}
        <Grid.Col span={{ base: 12, lg: 9 }}>
          <Paper p="md" radius="md" withBorder shadow="xs">
            <Group justify="space-between" mb="md" wrap="wrap">
              <div>
                <Title order={3} size="h4">
                  Solicitudes de anulación
                </Title>
                <Text size="sm" c="dimmed">
                  Selecciona una solicitud para revisar su detalle
                </Text>
              </div>
              {/* El orden se elige sobre la tabla (Mockup 04, 5.7) */}
              <Select
                aria-label="Orden"
                variant="filled"
                allowDeselect={false}
                value={orden}
                onChange={(val) => setOrden(val || 'recientes')}
                data={[
                  { value: 'recientes', label: 'Más recientes' },
                  { value: 'antiguos', label: 'Más antiguos' },
                ]}
                w={180}
              />
            </Group>

            <EstadoCarga
              cargando={cargando && !datos}
              error={error}
              datos={casosPaginados}
              onReintentar={recargar}
              mensajeVacio="No hay solicitudes de anulación con estos filtros."
            >
              {(items) => (
                <>
                  <Table.ScrollContainer minWidth={720}>
                    <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="xs">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Pedido / Fecha</Table.Th>
                          <Table.Th>Cliente</Table.Th>
                          <Table.Th>Estado</Table.Th>
                          <Table.Th>Motivo</Table.Th>
                          <Table.Th>Autorización</Table.Th>
                          <Table.Th>Solicitud</Table.Th>
                          <Table.Th>Acción</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {items.map((item) => {
                          const isSelected = casoSeleccionado?.solicitudAnulacionId === item.solicitudAnulacionId;
                          return (
                            <Table.Tr
                              key={item.solicitudAnulacionId}
                              aria-selected={isSelected}
                              style={{
                                backgroundColor: isSelected ? 'var(--mantine-color-orange-0)' : undefined,
                                cursor: 'pointer',
                              }}
                              onClick={() => setIdSeleccionado(item.solicitudAnulacionId)}
                            >
                              <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                <Text fw={600} size="sm">
                                  {item.pedidoId}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {formatoFechaHora(item.fecha)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" miw={110}>
                                  {item.cliente ?? '—'}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {item.canal ? ETIQUETA_CANAL[item.canal] : '—'}
                                </Text>
                              </Table.Td>
                              <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                <Text size="xs" fw={600} tt="uppercase">
                                  {item.estadoPedido ? ETIQUETA_ESTADO[item.estadoPedido] : '—'}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" lineClamp={2}>
                                  {etiquetaMotivo(item.motivo)}
                                </Text>
                              </Table.Td>
                              <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                <Pastilla color={COLOR_AUTORIZACION[item.autorizacion]} mayusculas={false}>{item.autorizacion}</Pastilla>
                              </Table.Td>
                              <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                <Pastilla color={COLOR_SOLICITUD[item.solicitud]}>{item.solicitud}</Pastilla>
                              </Table.Td>
                              <Table.Td>
                                <Button
                                  size="xs"
                                  variant={isSelected ? 'filled' : 'light'}
                                  color={isSelected ? undefined : 'gray'}
                                  c={isSelected ? undefined : 'ink.9'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIdSeleccionado(item.solicitudAnulacionId);
                                  }}
                                >
                                  Revisar
                                </Button>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>

                  <Group justify="space-between" mt="md" wrap="wrap">
                    <Text size="sm" c="dimmed">
                      {resumenIntervalo(pagina, ELEMENTOS_POR_PAGINA, items.length, totalSolicitudes)}
                    </Text>
                    {totalPaginas > 1 && <Pagination total={totalPaginas} value={pagina} onChange={setPagina} />}
                  </Group>
                </>
              )}
            </EstadoCarga>
          </Paper>
        </Grid.Col>

        {/* Panel lateral: detalle, resultado / efectos y acciones del caso seleccionado (Mockup 04, 6 a 9) */}
        {casoSeleccionado && (
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <Stack gap="md">
              <Card p="md" shadow="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Title order={3} size="h4">
                    Detalle de solicitud
                  </Title>
                  <ActionIcon variant="subtle" color="gray" onClick={() => setIdSeleccionado(null)} aria-label="Cerrar detalle">
                    <IconX size={20} aria-hidden />
                  </ActionIcon>
                </Group>
                <Divider my="sm" />
                <Stack gap="xs">
                  <Fila etiqueta="Solicitud">{casoSeleccionado.solicitudAnulacionId}</Fila>
                  <Fila etiqueta="Pedido">{casoSeleccionado.pedidoId}</Fila>
                  <Fila etiqueta="Estado actual">
                    {casoSeleccionado.estadoPedido ? (
                      <EstadoBadge entidad="pedido" estado={casoSeleccionado.estadoPedido} />
                    ) : (
                      '—'
                    )}
                  </Fila>
                  <Fila etiqueta="Cliente">{casoSeleccionado.cliente ?? '—'}</Fila>
                  <Fila etiqueta="Canal">{casoSeleccionado.canal ? ETIQUETA_CANAL[casoSeleccionado.canal] : '—'}</Fila>
                  <Fila etiqueta="Fecha">{formatoFechaHora(casoSeleccionado.fecha)}</Fila>
                  <Fila etiqueta="Motivo">{etiquetaMotivo(casoSeleccionado.motivo)}</Fila>
                  <Fila etiqueta="Autorización">
                    <Pastilla color={COLOR_AUTORIZACION[casoSeleccionado.autorizacion]} mayusculas={false}>{casoSeleccionado.autorizacion}</Pastilla>
                  </Fila>
                  <Fila etiqueta="Solicitud">
                    <Pastilla color={COLOR_SOLICITUD[casoSeleccionado.solicitud]}>{casoSeleccionado.solicitud}</Pastilla>
                  </Fila>
                </Stack>
              </Card>

              <Card p="md" shadow="xs">
                <Title order={3} size="h4">
                  Resultado / efectos
                </Title>
                <Divider my="sm" />
                <Stack gap="xs">
                  <Fila etiqueta="Estado del pedido">{casoSeleccionado.efectos.estadoPedido}</Fila>
                  <Fila etiqueta="Stock">{casoSeleccionado.efectos.stock}</Fila>
                  <Fila etiqueta="Despacho">{casoSeleccionado.efectos.despacho}</Fila>
                  <Fila etiqueta="Reembolso">{casoSeleccionado.efectos.reembolso}</Fila>
                </Stack>
              </Card>

              <Card p="md" shadow="xs">
                <Title order={3} size="h4">
                  Acciones disponibles
                </Title>
                <Divider my="sm" />
                <Stack gap="sm">
                  {casoSeleccionado.solicitud === 'PENDIENTE' ? (
                    <>
                      <Text size="sm" c="dimmed">
                        El pedido está en preparación: la anulación necesita tu autorización como Gestor.
                      </Text>
                      {decisionesBloqueadas && (
                        <Alert color="yellow" p="xs">
                          <Text size="sm">
                            No hay una consulta confirmada del servidor. Reintenta la carga antes de decidir.
                          </Text>
                        </Alert>
                      )}
                      <Button
                        onClick={() => setModalAprobarAbierto(true)}
                        loading={procesandoAccion}
                        disabled={decisionesBloqueadas}
                      >
                        Aprobar anulación
                      </Button>
                      <Button
                        color="red"
                        variant="outline"
                        onClick={() => setModalRechazarAbierto(true)}
                        loading={procesandoAccion}
                        disabled={decisionesBloqueadas}
                      >
                        Rechazar solicitud
                      </Button>
                    </>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Esta solicitud ya ha sido resuelta ({casoSeleccionado.solicitud}). No requiere una nueva decisión.
                    </Text>
                  )}
                  <Button
                    variant="default"
                    onClick={() => navegar(`/admin/pedidos/${encodeURIComponent(casoSeleccionado.pedidoId)}`)}
                  >
                    Volver al pedido
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        )}
      </Grid>

      {/* Modal Confirmación Aprobación */}
      <ModalConfirmacion
        abierto={modalAprobarAbierto}
        titulo="Confirmar aprobación"
        textoConfirmar="Confirmar aprobación"
        procesando={procesandoAccion}
        confirmarDeshabilitado={comentarioAprobacion.trim() === '' || decisionesBloqueadas}
        mensaje={
          <Text size="sm">
            ¿Confirmas la aprobación de la anulación para el pedido{' '}
            <Text span fw={700}>
              {casoSeleccionado?.pedidoId}
            </Text>
            ? El pedido pasará al estado <Text span fw={700}>ANULADO</Text>, se liberará la reserva de inventario y se
            originará la solicitud de reembolso financiero en F4.
          </Text>
        }
        onConfirmar={() => resolver('APROBADA', comentarioAprobacion)}
        onCerrar={() => setModalAprobarAbierto(false)}
      >
        <TextInput
          label="Justificación / Comentario"
          placeholder="Ingrese justificación de la aprobación"
          value={comentarioAprobacion}
          onChange={(e) => setComentarioAprobacion(e.currentTarget.value)}
          required
          mt="xs"
        />
      </ModalConfirmacion>

      {/* Modal Confirmación Rechazo */}
      <ModalConfirmacion
        abierto={modalRechazarAbierto}
        titulo="Confirmar rechazo"
        textoConfirmar="Confirmar rechazo"
        colorConfirmar="red"
        procesando={procesandoAccion}
        confirmarDeshabilitado={comentarioRechazo.trim() === '' || decisionesBloqueadas}
        mensaje={
          <Text size="sm">
            ¿Confirmas el rechazo de la solicitud{' '}
            <Text span fw={700}>
              {casoSeleccionado?.solicitudAnulacionId}
            </Text>
            ? El pedido{' '}
            <Text span fw={700}>
              {casoSeleccionado?.pedidoId}
            </Text>{' '}
            permanecerá en su estado actual ({casoSeleccionado?.estadoPedido ?? "sin dato"}) sin cancelaciones ni reembolsos.
          </Text>
        }
        onConfirmar={() => resolver('RECHAZADA', comentarioRechazo)}
        onCerrar={() => setModalRechazarAbierto(false)}
      >
        <Textarea
          label="Motivo o fundamento del rechazo (Obligatorio)"
          placeholder="Explique por qué se rechaza la anulación..."
          value={comentarioRechazo}
          onChange={(e) => setComentarioRechazo(e.currentTarget.value)}
          required
          mt="xs"
        />
      </ModalConfirmacion>

      {/* Modal Iniciar Solicitud de Anulación (1.7) */}
      <Modal
        opened={modalSolicitarAbierto}
        onClose={cerrarModalSolicitar}
        title={<Text fw={700} size="lg">Iniciar anulación</Text>}
        size="md"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Ingresa el código del pedido y selecciona el motivo formal tipificado en el catálogo para registrar la anulación.
          </Text>

          <TextInput
            label="Código de Pedido"
            placeholder="Ej. PED-2026-1041"
            value={pedidoIdSolicitud}
            onChange={(e) => setPedidoIdSolicitud(e.currentTarget.value)}
            required
          />

          <Select
            label="Motivo de anulación (Catálogo cerrado)"
            data={OPCIONES_MOTIVO_GESTOR}
            value={motivoSolicitud}
            onChange={(val) => {
              if (val) setMotivoSolicitud(val as MotivoAnulacion);
            }}
            required
          />

          <Textarea
            label="Comentario explicativo (Opcional)"
            placeholder="Detalles adicionales sobre la anulación..."
            value={comentarioSolicitud}
            onChange={(e) => setComentarioSolicitud(e.currentTarget.value)}
            minRows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={cerrarModalSolicitar} disabled={solicitandoAnulacion}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarSolicitudAnulacion}
              loading={solicitandoAnulacion}
              disabled={!pedidoIdSolicitud.trim() || !motivoSolicitud}
            >
              Enviar solicitud
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
