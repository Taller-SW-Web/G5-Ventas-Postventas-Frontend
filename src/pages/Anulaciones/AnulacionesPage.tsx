import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { CASOS_MOCKUP_04, type ItemBandejaAnulacion } from './datosMockup04';
import type { Canal } from '@/types/comun';
import type { EstadoAnulacion, ListadoAnulacionesPendientes, MotivoAnulacion } from '@/types/pedido';

const OPCIONES_MOTIVO_GESTOR: { value: MotivoAnulacion; label: string }[] = [
  { value: 'SOLICITUD_CLIENTE', label: 'Solicitud del cliente (arrepentimiento / cambio de opinión)' },
  { value: 'ARREPENTIMIENTO_COMPRA', label: 'Arrepentimiento de compra' },
  { value: 'ERROR_SELECCION_PRODUCTO', label: 'Error de selección de producto' },
  { value: 'ERROR_DATOS_ENVIO', label: 'Error en datos de envío' },
  { value: 'DUPLICADO', label: 'Pedido duplicado' },
];

function parsearFecha(f?: string): number {
  if (!f) return 0;
  if (f.includes('/')) {
    const [fechaParte, horaParte = '00:00'] = f.split(' ');
    const partesFecha = fechaParte.split('/');
    if (partesFecha.length === 3) {
      const d = parseInt(partesFecha[0], 10);
      const m = parseInt(partesFecha[1], 10);
      const y = parseInt(partesFecha[2], 10);
      const [hh = '0', mm = '0'] = horaParte.split(':');
      return new Date(y, m - 1, d, parseInt(hh, 10), parseInt(mm, 10)).getTime();
    }
  }
  const timestamp = new Date(f).getTime();
  return isNaN(timestamp) ? 0 : timestamp;
}

export function AnulacionesPage() {
  // Query param ?pedidoId= desde DetallePedido o navegación externa
  const [searchParams, setSearchParams] = useSearchParams();
  const pedidoIdParam = searchParams.get('pedidoId');

  // Estado de filtros
  const [busqueda, setBusqueda] = useState(pedidoIdParam || '');
  const [filtroEstado, setFiltroEstado] = useState<string | null>('Todos');
  const [filtroCanal, setFiltroCanal] = useState<string | null>('Todos');
  const [orden, setOrden] = useState<string | null>('recientes');

  // Modal Iniciar Anulación (Endpoint 1.7)
  const [modalSolicitarAbierto, setModalSolicitarAbierto] = useState(false);
  const [pedidoIdSolicitud, setPedidoIdSolicitud] = useState(pedidoIdParam || '');
  const [motivoSolicitud, setMotivoSolicitud] = useState<MotivoAnulacion>('SOLICITUD_CLIENTE');
  const [comentarioSolicitud, setComentarioSolicitud] = useState('');
  const [solicitandoAnulacion, setSolicitandoAnulacion] = useState(false);

  useEffect(() => {
    if (pedidoIdParam) {
      setBusqueda(pedidoIdParam);
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
  };

  // Debounce para búsqueda textual (350 ms)
  const [busquedaDebounced, setBusquedaDebounced] = useState(busqueda);
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda);
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Paginación (base 1 para la UI, base 0 para el backend)
  const [pagina, setPagina] = useState(1);
  const elementosPorPagina = 5;

  // Resetear a página 1 cuando cambian filtros, orden o búsqueda
  useEffect(() => {
    setPagina(1);
    setCasoSeleccionado(null);
  }, [busquedaDebounced, filtroEstado, filtroCanal, orden]);

  // Lista local para visualización / fallback offline
  const [casosLocales, setCasosLocales] = useState<ItemBandejaAnulacion[]>(CASOS_MOCKUP_04);

  // Caso actualmente seleccionado para revisión en el panel lateral
  const [casoSeleccionado, setCasoSeleccionado] = useState<ItemBandejaAnulacion | null>(null);

  // Modales de confirmación
  const [modalAprobarAbierto, setModalAprobarAbierto] = useState(false);
  const [modalRechazarAbierto, setModalRechazarAbierto] = useState(false);
  const [comentarioRechazo, setComentarioRechazo] = useState('');
  const [comentarioAprobacion, setComentarioAprobacion] = useState('Motivo validado con el cliente');
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // Helper para mapear el estado de la anulación al formato visual de la bandeja
  const mapearEstadoAnulacion = (estado?: string): { autorizacion: 'Pendiente' | 'No requerida' | 'Aprobada' | 'Rechazada'; solicitud: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EJECUTADA' } => {
    switch (estado) {
      case 'EJECUTADA':
        return { autorizacion: 'Aprobada', solicitud: 'APROBADA' };
      case 'RECHAZADA':
        return { autorizacion: 'Rechazada', solicitud: 'RECHAZADA' };
      case 'PENDIENTE_AUTORIZACION':
      default:
        return { autorizacion: 'Pendiente', solicitud: 'PENDIENTE' };
    }
  };

  const mapearEfectosAnulacion = (estado?: string) => {
    switch (estado) {
      case 'EJECUTADA':
        return {
          estadoPedido: 'ANULADO',
          stock: 'Reintegrar inventario',
          despacho: 'Cancelar despacho si aplica',
          reembolso: 'Originar reembolso en F4',
        };
      case 'RECHAZADA':
        return {
          estadoPedido: 'EN_PREPARACION (sin cambios)',
          stock: 'Sin cambios',
          despacho: 'Continúa despacho',
          reembolso: 'No aplica',
        };
      case 'PENDIENTE_AUTORIZACION':
      default:
        return {
          estadoPedido: 'Pendiente de decisión',
          stock: 'Reintegrar si se aprueba',
          despacho: 'Cancelar si se aprueba',
          reembolso: 'Originar F4 si se aprueba',
        };
    }
  };

  // Conversión de filtros visuales a enums de backend
  const estadoBackend: EstadoAnulacion | undefined = useMemo(() => {
    if (!filtroEstado || filtroEstado === 'Todos') return undefined;
    if (filtroEstado === 'Pendiente') return 'PENDIENTE_AUTORIZACION';
    if (filtroEstado === 'Aprobada' || filtroEstado === 'Ejecutada') return 'EJECUTADA';
    if (filtroEstado === 'Rechazada') return 'RECHAZADA';
    return undefined;
  }, [filtroEstado]);

  const canalBackend: Canal | undefined = useMemo(() => {
    if (!filtroCanal || filtroCanal === 'Todos') return undefined;
    return filtroCanal as Canal;
  }, [filtroCanal]);

  // Consulta al backend con Server-Side Filtering, Sorting y Pagination delegados
  const consultaBackend = useCallback(async (): Promise<ListadoAnulacionesPendientes> => {
    const listado = await listarAnulaciones({
      estado: estadoBackend,
      canal: canalBackend,
      busqueda: busquedaDebounced.trim() || undefined,
      page: pagina - 1,
      size: elementosPorPagina,
      sort: orden === 'antiguos' ? 'fecha,asc' : 'fecha,desc',
    });

    // Si algún item vino sin datos enriquecidos, se completa con el detalle de pedidos
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
  }, [estadoBackend, canalBackend, busquedaDebounced, pagina, orden, elementosPorPagina]);

  const { datos: datosBackend, cargando, error, recargar } = useConsulta(consultaBackend, [consultaBackend]);

  const usandoDatosEnVivo = Boolean(datosBackend && datosBackend.contenido !== undefined);

  // Mapeo de items para la vista
  const casosMostrar: ItemBandejaAnulacion[] = useMemo(() => {
    if (usandoDatosEnVivo && datosBackend?.contenido) {
      return datosBackend.contenido.map((item) => {
        const estadoMapeado = mapearEstadoAnulacion(item.estado);
        const efectosMapeados = mapearEfectosAnulacion(item.estado);
        return {
          solicitudAnulacionId: item.solicitudAnulacionId,
          pedidoId: item.pedidoId,
          fecha: item.fechaSolicitud,
          cliente: item.nombreCliente ?? '—',
          estadoPedido: item.estadoPedido ?? (item.estado === 'EJECUTADA' ? 'ANULADO' : 'EN_PREPARACION'),
          canal: item.canal ?? 'MARKETPLACE',
          motivo: item.motivo,
          autorizacion: estadoMapeado.autorizacion,
          solicitud: estadoMapeado.solicitud,
          solicitante: item.nombreCliente ?? 'Cliente',
          efectos: efectosMapeados,
        };
      });
    }

    // Modo fallback offline (filtrado en memoria solo para demo sin backend)
    let filtrados = casosLocales;
    if (busquedaDebounced.trim()) {
      const q = busquedaDebounced.toLowerCase();
      filtrados = filtrados.filter((c) => c.pedidoId.toLowerCase().includes(q) || c.cliente.toLowerCase().includes(q));
    }
    if (filtroEstado && filtroEstado !== 'Todos') {
      filtrados = filtrados.filter((c) =>
        (filtroEstado === 'Pendiente' && c.solicitud === 'PENDIENTE') ||
        (filtroEstado === 'Aprobada' && c.solicitud === 'APROBADA') ||
        (filtroEstado === 'Rechazada' && c.solicitud === 'RECHAZADA') ||
        (filtroEstado === 'Ejecutada' && (c.solicitud === 'EJECUTADA' || c.solicitud === 'APROBADA'))
      );
    }
    if (filtroCanal && filtroCanal !== 'Todos') {
      filtrados = filtrados.filter((c) => c.canal === filtroCanal);
    }
    return [...filtrados].sort((a, b) => {
      const timeA = parsearFecha(a.fecha);
      const timeB = parsearFecha(b.fecha);
      return orden === 'antiguos' ? timeA - timeB : timeB - timeA;
    });
  }, [usandoDatosEnVivo, datosBackend, casosLocales, busquedaDebounced, filtroEstado, filtroCanal, orden]);

  // Total de páginas exacto provisto por el backend (COUNT de BD) o calculado en fallback
  const totalPaginas = Math.max(
    1,
    usandoDatosEnVivo
      ? datosBackend?.totalPaginas || 1
      : Math.ceil(casosMostrar.length / elementosPorPagina) || 1
  );

  // En datos en vivo, el backend ya aplicó LIMIT y OFFSET; en fallback, cortamos la página
  const casosPaginados = useMemo(() => {
    if (usandoDatosEnVivo) return casosMostrar;
    const inicio = (pagina - 1) * elementosPorPagina;
    return casosMostrar.slice(inicio, inicio + elementosPorPagina);
  }, [usandoDatosEnVivo, casosMostrar, pagina, elementosPorPagina]);

  // Total de solicitudes para el contador (server-side totalElementos o fallback local)
  const totalSolicitudes = usandoDatosEnVivo
    ? (datosBackend?.totalElementos ?? 0)
    : casosMostrar.length;

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setBusquedaDebounced('');
    setFiltroEstado('Todos');
    setFiltroCanal('Todos');
    setOrden('recientes');
    setPagina(1);
    setCasoSeleccionado(null);
  };

  // Confirmar Aprobación (1.9 PATCH /api/v1/pedidos/{pedidoId}/anulaciones/{anulacionId})
  const handleConfirmarAprobacion = async () => {
    if (!casoSeleccionado) return;
    setProcesandoAccion(true);

    try {
      if (usandoDatosEnVivo) {
        await resolverAnulacion(casoSeleccionado.pedidoId, casoSeleccionado.solicitudAnulacionId, {
          decision: 'APROBADA',
          autorizadorId: sesionActual().usuarioId ?? 'ADMIN_VENTAS',
          comentario: comentarioAprobacion,
        });
        recargar();
      }

      const actualizado: ItemBandejaAnulacion = {
        ...casoSeleccionado,
        autorizacion: 'Aprobada',
        solicitud: 'APROBADA',
        estadoPedido: 'ANULADO',
        efectos: {
          estadoPedido: 'ANULADO',
          stock: 'Reintegrar inventario',
          despacho: 'Cancelar despacho si aplica',
          reembolso: 'Originar reembolso en F4',
        },
      };

      setCasosLocales((prev) =>
        prev.map((c) => (c.solicitudAnulacionId === actualizado.solicitudAnulacionId ? actualizado : c))
      );
      setCasoSeleccionado(actualizado);
      setModalAprobarAbierto(false);

      notifications.show({
        title: 'Anulación Aprobada',
        message: `La solicitud ${actualizado.solicitudAnulacionId} del pedido ${actualizado.pedidoId} ha sido aprobada exitosamente.`,
        color: 'green',
      });
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        setModalAprobarAbierto(false);
        notifications.show({
          title: 'Solicitud Rechazada por Conflicto (409)',
          message: e.message || 'El pedido ya no se encuentra en preparación (ha sido despachado). La anulación fue marcada como RECHAZADA.',
          color: 'orange',
        });
        if (casoSeleccionado) {
          const actualizadoRechazado: ItemBandejaAnulacion = {
            ...casoSeleccionado,
            autorizacion: 'Rechazada',
            solicitud: 'RECHAZADA',
            efectos: {
              estadoPedido: 'Pedido sin cambios (DESPACHADO)',
              stock: 'Sin cambios',
              despacho: 'Sin cambios',
              reembolso: 'No aplica',
            },
          };
          setCasoSeleccionado(actualizadoRechazado);
          setCasosLocales((prev) =>
            prev.map((c) => (c.solicitudAnulacionId === actualizadoRechazado.solicitudAnulacionId ? actualizadoRechazado : c))
          );
        }
        recargar();
      } else {
        notifications.show({
          title: 'Error al aprobar',
          message: e instanceof ApiError ? e.message : 'No se pudo comunicar la decisión al servidor.',
          color: 'red',
        });
      }
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Confirmar Rechazo (1.9 PATCH /api/v1/pedidos/{pedidoId}/anulaciones/{anulacionId})
  const handleConfirmarRechazo = async () => {
    if (!casoSeleccionado) return;
    setProcesandoAccion(true);

    try {
      if (usandoDatosEnVivo) {
        await resolverAnulacion(casoSeleccionado.pedidoId, casoSeleccionado.solicitudAnulacionId, {
          decision: 'RECHAZADA',
          autorizadorId: sesionActual().usuarioId ?? 'ADMIN_VENTAS',
          comentario: comentarioRechazo,
        });
        recargar();
      }

      const actualizado: ItemBandejaAnulacion = {
        ...casoSeleccionado,
        autorizacion: 'Rechazada',
        solicitud: 'RECHAZADA',
        efectos: {
          estadoPedido: `${casoSeleccionado.estadoPedido} (sin cambios)`,
          stock: 'Sin cambios',
          despacho: 'Sin cambios',
          reembolso: 'No aplica',
        },
      };

      setCasosLocales((prev) =>
        prev.map((c) => (c.solicitudAnulacionId === actualizado.solicitudAnulacionId ? actualizado : c))
      );
      setCasoSeleccionado(actualizado);
      setModalRechazarAbierto(false);
      setComentarioRechazo('');

      notifications.show({
        title: 'Solicitud Rechazada',
        message: `La solicitud ${actualizado.solicitudAnulacionId} ha sido rechazada. El pedido continúa en su estado actual.`,
        color: 'red',
      });
    } catch (e: unknown) {
      notifications.show({
        title: 'Error al rechazar',
        message: e instanceof ApiError ? e.message : 'No se pudo comunicar el rechazo al servidor.',
        color: 'red',
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Enviar Solicitud de Anulación (Endpoint 1.7 POST /api/v1/pedidos/{pedidoId}/anulaciones)
  const handleEnviarSolicitudAnulacion = async () => {
    if (!pedidoIdSolicitud.trim() || !motivoSolicitud) return;
    setSolicitandoAnulacion(true);

    try {
      if (usandoDatosEnVivo) {
        const resp = await solicitarAnulacion(pedidoIdSolicitud.trim(), {
          motivo: motivoSolicitud,
          comentario: comentarioSolicitud.trim() || undefined,
        });

        if (resp.autorizacionRequerida) {
          notifications.show({
            title: 'Solicitud Registrada (202 Accepted)',
            message: `El pedido ${resp.pedidoId} se encuentra en preparación. Se generó la solicitud ${resp.solicitudAnulacionId} para evaluación del Gestor.`,
            color: 'blue',
          });
        } else {
          notifications.show({
            title: 'Anulación Directa Exitosa (200 OK)',
            message: `El pedido ${resp.pedidoId} fue anulado exitosamente. ${resp.solicitudReembolsoGenerada ? 'Se originó solicitud de reembolso en F4.' : ''}`,
            color: 'green',
          });
        }
        recargar();
      } else {
        // En modo demostración local
        const nuevoCaso: ItemBandejaAnulacion = {
          solicitudAnulacionId: `ANUL-${Math.floor(1000 + Math.random() * 9000)}`,
          pedidoId: pedidoIdSolicitud.trim(),
          fecha: new Date().toLocaleDateString('es-PE'),
          cliente: 'Cliente Demostración',
          estadoPedido: 'EN_PREPARACION',
          canal: 'MARKETPLACE',
          motivo: motivoSolicitud,
          autorizacion: 'Pendiente',
          solicitud: 'PENDIENTE',
          solicitante: 'Cliente',
          efectos: {
            estadoPedido: 'Pendiente de decisión',
            stock: 'Reintegrar si se aprueba',
            despacho: 'Cancelar si se aprueba',
            reembolso: 'Originar F4 si se aprueba',
          },
        };
        setCasosLocales((prev) => [nuevoCaso, ...prev]);
        notifications.show({
          title: 'Solicitud Creada (Modo Demostración)',
          message: `Se registró la solicitud para el pedido ${pedidoIdSolicitud.trim()} con motivo ${motivoSolicitud}.`,
          color: 'blue',
        });
      }

      cerrarModalSolicitar();



    } catch (e: unknown) {
      notifications.show({
        title: 'Error al solicitar anulación',
        message: e instanceof ApiError ? e.message : 'No se pudo comunicar la solicitud al servidor.',
        color: 'red',
      });
    } finally {
      setSolicitandoAnulacion(false);
    }
  };

  return (
    <Stack gap="lg">
      {/* Encabezado */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} c="ink.9">
            Anulaciones
          </Title>
          <Text size="sm" c="dimmed">
            Bandeja administrativa para evaluar y autorizar solicitudes de cancelación de pedidos (F2 - Mockup 04)
          </Text>
        </div>
        <Button color="orange" onClick={() => setModalSolicitarAbierto(true)}>
          Iniciar anulación
        </Button>
      </Group>

      {/* Alerta de conexión */}
      {Boolean(error) && (
        <Alert color="orange" title="Modo Demostración / Backend no conectado">
          No se detectó el backend activo en el puerto configurado. La vista está operando con datos locales del Mockup 04.
        </Alert>
      )}

      {/* Barra de Filtros */}
      <Paper p="md" radius="md" withBorder>
        <Grid gap="md" align="flex-end">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <TextInput
              label="Buscar"
              placeholder="Ej. PED-2026-1041 o cliente"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.currentTarget.value);
                setPagina(1);
              }}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Estado de solicitud"
              allowDeselect={false}
              value={filtroEstado}
              onChange={(val) => {
                setFiltroEstado(val || 'Todos');
                setPagina(1);
              }}
              data={['Todos', 'Pendiente', 'Aprobada', 'Rechazada', 'Ejecutada']}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Canal"
              allowDeselect={false}
              value={filtroCanal}
              onChange={(val) => {
                setFiltroCanal(val || 'Todos');
                setPagina(1);
              }}
              data={['Todos', 'MARKETPLACE', 'CHATBOT', 'RETAIL']}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Orden"
              allowDeselect={false}
              value={orden}
              onChange={(val) => {
                setOrden(val || 'recientes');
                setPagina(1);
              }}
              data={[
                { value: 'recientes', label: 'Más recientes' },
                { value: 'antiguos', label: 'Más antiguos' },
              ]}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 12, md: 3 }}>
            <Group justify="flex-end">
              <Button variant="default" onClick={handleLimpiarFiltros}>
                Limpiar
              </Button>
              <Button color="orange" onClick={() => setPagina(1)}>
                Aplicar filtros
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Contenido Principal: Bandeja + Panel Lateral */}
      <Grid gap="md">
        {/* Bandeja de Solicitudes (Tabla) */}
        <Grid.Col span={casoSeleccionado ? { base: 12, lg: 7 } : 12}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4} c="ink.9">
                Solicitudes de Anulación
              </Title>
              <Text size="xs" c="dimmed">
                Mostrando {casosPaginados.length} de {totalSolicitudes} solicitudes
              </Text>
            </Group>

            <EstadoCarga cargando={cargando && usandoDatosEnVivo} error={null} datos={casosPaginados}>
              {(items) => (
                <>
                  <Table.ScrollContainer minWidth={600}>
                    <Table striped highlightOnHover verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Pedido / Fecha</Table.Th>
                          <Table.Th>Cliente</Table.Th>
                          <Table.Th>Estado Pedido</Table.Th>
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
                              style={{
                                backgroundColor: isSelected ? 'var(--mantine-color-orange-0)' : undefined,
                                cursor: 'pointer',
                              }}
                              onClick={() => setCasoSeleccionado(item)}
                            >
                              <Table.Td>
                                <Text fw={700} size="sm">
                                  {item.pedidoId}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {item.fecha}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{item.cliente}</Text>
                                <Badge size="xs" variant="outline" color="gray">
                                  {item.canal}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <EstadoBadge entidad="pedido" estado={item.estadoPedido} />
                              </Table.Td>
                              <Table.Td>
                                <Text size="xs" lineClamp={2}>
                                  {item.motivo}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  size="sm"
                                  variant="light"
                                  color={
                                    item.autorizacion === 'Pendiente'
                                      ? 'yellow'
                                      : item.autorizacion === 'Aprobada'
                                      ? 'green'
                                      : item.autorizacion === 'Rechazada'
                                      ? 'red'
                                      : 'gray'
                                  }
                                >
                                  {item.autorizacion}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  size="sm"
                                  color={
                                    item.solicitud === 'PENDIENTE'
                                      ? 'yellow'
                                      : item.solicitud === 'APROBADA' || item.solicitud === 'EJECUTADA'
                                      ? 'green'
                                      : 'red'
                                  }
                                >
                                  {item.solicitud}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Button
                                  size="xs"
                                  variant={isSelected ? 'filled' : 'light'}
                                  color="orange"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCasoSeleccionado(item);
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

                  <Group justify="center" mt="md">
                    <Pagination total={totalPaginas} value={pagina} onChange={setPagina} boundaries={1} siblings={1} color="orange" />
                  </Group>
                </>
              )}
            </EstadoCarga>
          </Paper>
        </Grid.Col>

        {/* Panel Lateral: Detalle, Resultado / Efectos y Acciones */}
        {casoSeleccionado && (
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Stack gap="md">
              {/* Tarjeta de Detalle */}
              <Card p="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Title order={4} c="ink.9">
                    Detalle de Solicitud
                  </Title>
                  <ActionIcon variant="subtle" color="gray" onClick={() => setCasoSeleccionado(null)}>
                    ✕
                  </ActionIcon>
                </Group>
                <Divider mb="sm" />

                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Solicitud ID:
                    </Text>
                    <Text size="xs" fw={700}>
                      {casoSeleccionado.solicitudAnulacionId}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Pedido:
                    </Text>
                    <Text size="xs" fw={700} c="orange">
                      {casoSeleccionado.pedidoId}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Estado actual pedido:
                    </Text>
                    <EstadoBadge entidad="pedido" estado={casoSeleccionado.estadoPedido} />
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Cliente:
                    </Text>
                    <Text size="xs">{casoSeleccionado.cliente}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Canal:
                    </Text>
                    <Badge size="xs" variant="outline" color="blue">
                      {casoSeleccionado.canal}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Solicitante:
                    </Text>
                    <Text size="xs">{casoSeleccionado.solicitante}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Fecha:
                    </Text>
                    <Text size="xs">{casoSeleccionado.fecha}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Motivo declarado:
                    </Text>
                    <Text size="xs" fw={600}>
                      {casoSeleccionado.motivo}
                    </Text>
                  </Group>
                </Stack>
              </Card>

              {/* Tarjeta de Efectos y Resultados Previstos */}
              <Card p="md" radius="md" withBorder>
                <Title order={5} c="ink.9" mb="xs">
                  Resultado / Efectos Previstos
                </Title>
                <Divider mb="sm" />

                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Estado del pedido:
                    </Text>
                    <Badge size="xs" variant="light" color="orange">
                      {casoSeleccionado.efectos.estadoPedido}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Stock / Reserva:
                    </Text>
                    <Text size="xs">{casoSeleccionado.efectos.stock}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Despacho:
                    </Text>
                    <Text size="xs">{casoSeleccionado.efectos.despacho}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Reembolso (F4):
                    </Text>
                    <Text size="xs">{casoSeleccionado.efectos.reembolso}</Text>
                  </Group>
                </Stack>
              </Card>

              {/* Tarjeta de Acciones Disponibles */}
              <Card p="md" radius="md" withBorder>
                <Title order={5} c="ink.9" mb="xs">
                  Acciones Disponibles
                </Title>
                <Divider mb="sm" />

                {casoSeleccionado.solicitud === 'PENDIENTE' ? (
                  <Stack gap="sm">
                    <Text size="xs" c="dimmed">
                      El pedido se encuentra en preparación. Como Gestor de Ventas, puedes autorizar o rechazar esta
                      solicitud de anulación.
                    </Text>
                    <Group grow>
                      <Button color="green" onClick={() => setModalAprobarAbierto(true)} loading={procesandoAccion}>
                        Aprobar anulación
                      </Button>
                      <Button
                        color="red"
                        variant="outline"
                        onClick={() => setModalRechazarAbierto(true)}
                        loading={procesandoAccion}
                      >
                        Rechazar solicitud
                      </Button>
                    </Group>
                  </Stack>
                ) : (
                  <Stack gap="sm">
                    <Text size="xs" c="dimmed">
                      Esta solicitud ya ha sido resuelta ({casoSeleccionado.solicitud}). No requiere acciones
                      adicionales de autorización.
                    </Text>
                    <Button variant="default" onClick={() => setCasoSeleccionado(null)}>
                      Volver a la lista
                    </Button>
                  </Stack>
                )}
              </Card>
            </Stack>
          </Grid.Col>
        )}
      </Grid>

      {/* Modal Confirmación Aprobación */}
      <ModalConfirmacion
        abierto={modalAprobarAbierto}
        titulo="Confirmar Aprobación de Anulación"
        textoConfirmar="Confirmar aprobación"
        colorConfirmar="green"
        procesando={procesandoAccion}
        confirmarDeshabilitado={comentarioAprobacion.trim() === ''}
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
        onConfirmar={handleConfirmarAprobacion}
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
        titulo="Confirmar Rechazo de Anulación"
        textoConfirmar="Confirmar rechazo"
        colorConfirmar="red"
        procesando={procesandoAccion}
        confirmarDeshabilitado={comentarioRechazo.trim() === ''}
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
            permanecerá en su estado actual ({casoSeleccionado?.estadoPedido}) sin cancelaciones ni reembolsos.
          </Text>
        }
        onConfirmar={handleConfirmarRechazo}
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
        title="Iniciar Solicitud de Anulación (F2 - 1.7)"
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
              color="orange"
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
