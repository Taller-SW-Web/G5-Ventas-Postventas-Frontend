import { useState, useMemo, useCallback } from 'react';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { EstadoBadge } from '@/components/EstadoBadge';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import { listarAnulacionesPendientes, resolverAnulacion } from '@/services/anulaciones';
import { CASOS_MOCKUP_04, type ItemBandejaAnulacion } from './datosMockup04';
import type { ListadoAnulacionesPendientes } from '@/types/pedido';

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
  // Estado de filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string | null>('Todos');
  const [filtroCanal, setFiltroCanal] = useState<string | null>('Todos');
  const [orden, setOrden] = useState<string | null>('recientes');

  // Paginación local
  const [pagina, setPagina] = useState(1);
  const elementosPorPagina = 5;

  // Lista local para visualización / fallback
  const [casosLocales, setCasosLocales] = useState<ItemBandejaAnulacion[]>(CASOS_MOCKUP_04);

  // Caso actualmente seleccionado para revisión en el panel lateral
  const [casoSeleccionado, setCasoSeleccionado] = useState<ItemBandejaAnulacion | null>(null);

  // Modales de confirmación
  const [modalAprobarAbierto, setModalAprobarAbierto] = useState(false);
  const [modalRechazarAbierto, setModalRechazarAbierto] = useState(false);
  const [comentarioRechazo, setComentarioRechazo] = useState('');
  const [comentarioAprobacion, setComentarioAprobacion] = useState('Motivo validado con el cliente');
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // Consulta al backend (1.8 GET /api/v1/pedidos/anulaciones/pendientes)
  const consultaBackend = useCallback(async (): Promise<ListadoAnulacionesPendientes> => {
    return await listarAnulacionesPendientes({ pagina: pagina - 1, tamano: elementosPorPagina });
  }, [pagina]);

  const { datos: datosBackend, cargando, error, recargar } = useConsulta(consultaBackend, [consultaBackend]);

  // Si el backend responde datos, se mapean; si no hay conexión o falla, se opera con los datos locales
  const usandoDatosEnVivo = Boolean(datosBackend && datosBackend.contenido !== undefined);

  const casosMostrar: ItemBandejaAnulacion[] = useMemo(() => {
    if (usandoDatosEnVivo && datosBackend?.contenido) {
      return datosBackend.contenido.map((item) => ({
        solicitudAnulacionId: item.solicitudAnulacionId,
        pedidoId: item.pedidoId,
        fecha: item.fechaSolicitud,
        cliente: 'Cliente Registrado',
        estadoPedido: 'EN_PREPARACION',
        canal: 'MARKETPLACE',
        motivo: item.motivo,
        autorizacion: 'Pendiente',
        solicitud: 'PENDIENTE',
        solicitante: 'Cliente',
        efectos: {
          estadoPedido: 'Pendiente de decisión',
          stock: 'Reintegrar si se aprueba',
          despacho: 'Cancelar si se aprueba',
          reembolso: 'Originar F4 si se aprueba',
        },
      }));
    }
    return casosLocales;
  }, [usandoDatosEnVivo, datosBackend, casosLocales]);

  // Filtrado y ordenamiento
  const casosFiltrados = useMemo(() => {
    const filtrados = casosMostrar.filter((c) => {
      const matchBusqueda =
        busqueda.trim() === '' ||
        c.pedidoId.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.cliente.toLowerCase().includes(busqueda.toLowerCase());

      const matchEstado =
        filtroEstado === 'Todos' ||
        (filtroEstado === 'Pendiente' && c.solicitud === 'PENDIENTE') ||
        (filtroEstado === 'Aprobada' && c.solicitud === 'APROBADA') ||
        (filtroEstado === 'Rechazada' && c.solicitud === 'RECHAZADA') ||
        (filtroEstado === 'Ejecutada' && c.solicitud === 'EJECUTADA');

      const matchCanal = filtroCanal === 'Todos' || c.canal === filtroCanal;

      return matchBusqueda && matchEstado && matchCanal;
    });

    return [...filtrados].sort((a, b) => {
      const timeA = parsearFecha(a.fecha);
      const timeB = parsearFecha(b.fecha);
      return orden === 'antiguos' ? timeA - timeB : timeB - timeA;
    });
  }, [casosMostrar, busqueda, filtroEstado, filtroCanal, orden]);

  // Paginado
  const totalPaginas = usandoDatosEnVivo
    ? datosBackend?.totalPaginas || 1
    : Math.ceil(casosFiltrados.length / elementosPorPagina) || 1;

  const casosPaginados = useMemo(() => {
    if (usandoDatosEnVivo) return casosFiltrados;
    const inicio = (pagina - 1) * elementosPorPagina;
    return casosFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [usandoDatosEnVivo, casosFiltrados, pagina]);

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setBusqueda('');
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
          autorizadorId: 'ADMIN_VENTAS',
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
      notifications.show({
        title: 'Error al aprobar',
        message: 'No se pudo comunicar la decisión al servidor.',
        color: 'red',
      });
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
          autorizadorId: 'ADMIN_VENTAS',
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
        message: 'No se pudo comunicar el rechazo al servidor.',
        color: 'red',
      });
    } finally {
      setProcesandoAccion(false);
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
      </Group>

      {/* Alerta de conexión */}
      {error && (
        <Alert color="orange" title="Modo Demostración / Backend no conectado">
          No se detectó el backend activo en el puerto configurado. La vista está operando con datos locales del Mockup 04.
        </Alert>
      )}

      {/* Barra de Filtros */}
      <Paper p="md" radius="md" withBorder>
        <Grid gutter="md" align="flex-end">
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
              value={filtroEstado}
              onChange={(val) => {
                setFiltroEstado(val);
                setPagina(1);
              }}
              data={['Todos', 'Pendiente', 'Aprobada', 'Rechazada', 'Ejecutada']}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Canal"
              value={filtroCanal}
              onChange={(val) => {
                setFiltroCanal(val);
                setPagina(1);
              }}
              data={['Todos', 'MARKETPLACE', 'CHATBOT', 'RETAIL']}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Orden"
              value={orden}
              onChange={(val) => {
                setOrden(val);
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
      <Grid gutter="md">
        {/* Bandeja de Solicitudes (Tabla) */}
        <Grid.Col span={casoSeleccionado ? { base: 12, lg: 7 } : 12}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4} c="ink.9">
                Solicitudes de Anulación
              </Title>
              <Text size="xs" c="dimmed">
                Mostrando {casosPaginados.length} de {casosFiltrados.length} solicitudes
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
                    <Pagination total={totalPaginas} value={pagina} onChange={setPagina} color="orange" />
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
            permanecerá en su estado actual (EN_PREPARACION) sin cancelaciones ni reembolsos.
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
    </Stack>
  );
}
