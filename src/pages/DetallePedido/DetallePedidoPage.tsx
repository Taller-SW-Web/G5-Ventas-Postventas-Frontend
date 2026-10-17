// Mockup 03 — Detalle del pedido (F1). Responsable: Michael
// Endpoints: GET /api/v1/pedidos/{pedidoId} (1.3), POST .../preparacion y POST .../despacho (acciones del Gestor).
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { EstadoBadge } from '@/components/EstadoBadge';
import { EstadoCarga } from '@/components/EstadoCarga';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { useConsulta } from '@/hooks/useConsulta';
import { ApiError } from '@/services/api';
import { iniciarPreparacion, obtenerPedido, sellarPaquete } from '@/services/pedidos';
import type { EstadoPedido, PedidoDetalle } from '@/types/pedido';
import {
  ETIQUETA_ACTOR,
  ETIQUETA_CANAL,
  ETIQUETA_ESTADO,
  admiteAnulacion,
  formatoFecha,
  formatoFechaHora,
  formatoMonto,
} from '@/pages/Pedidos/formato';

/** Recorrido normal de un pedido con despacho. RETAIL salta de PAGADO a ENTREGADO (acuerdo G4). */
const FLUJO: EstadoPedido[] = ['CREADO', 'PAGADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'];
const FLUJO_RETAIL: EstadoPedido[] = ['PAGADO', 'ENTREGADO'];

type Accion = 'preparacion' | 'despacho';

function Tarjeta({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <Card withBorder radius="md" p="md">
      <Text size="sm" c="dimmed">
        {etiqueta}
      </Text>
      <Text component="div" fw={700} size="lg" mt={4}>
        {children}
      </Text>
    </Card>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card withBorder radius="md" p="md">
      <Title order={3}>{titulo}</Title>
      <Divider my="sm" />
      {children}
    </Card>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <Group gap="xs" wrap="nowrap" align="flex-start">
      <Text size="sm" c="dimmed" w={150} style={{ flexShrink: 0 }}>
        {etiqueta}
      </Text>
      <Text component="div" size="sm" fw={500}>
        {children}
      </Text>
    </Group>
  );
}

function HistorialEstados({ pedido }: { pedido: PedidoDetalle }) {
  const anulado = pedido.estado === 'ANULADO';
  const pasos = anulado
    ? pedido.historialEstados.map((h) => h.estado)
    : pedido.canal === 'RETAIL'
      ? FLUJO_RETAIL
      : FLUJO;
  const fechaDe = (estado: EstadoPedido) => pedido.historialEstados.find((h) => h.estado === estado)?.fecha;
  const activo = pasos.lastIndexOf(pedido.estado);

  return (
    <Timeline active={activo} bulletSize={18} lineWidth={2} color={anulado ? 'red' : undefined}>
      {pasos.map((estado, i) => {
        const fecha = fechaDe(estado);
        return (
          <Timeline.Item
            key={`${estado}-${i}`}
            title={
              <Group gap="xs">
                <Text size="sm" fw={600}>
                  {ETIQUETA_ESTADO[estado]}
                </Text>
                {i === activo && (
                  <Badge size="xs" variant="light">
                    Estado actual
                  </Badge>
                )}
              </Group>
            }
          >
            {fecha && (
              <Text size="xs" c="dimmed">
                {formatoFechaHora(fecha)}
              </Text>
            )}
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}

function Detalle({ pedido, onActualizado }: { pedido: PedidoDetalle; onActualizado: () => void }) {
  const navegar = useNavigate();
  const [accion, setAccion] = useState<Accion | null>(null);
  const [procesando, setProcesando] = useState(false);

  const retail = pedido.canal === 'RETAIL';
  const envio = pedido.envio;
  const total = pedido.items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  // El movimiento que llevó al estado actual (el historial no garantiza orden).
  const ultimo =
    [...pedido.historialEstados].reverse().find((h) => h.estado === pedido.estado) ??
    pedido.historialEstados[pedido.historialEstados.length - 1];
  const puedePreparar = !retail && pedido.estado === 'PAGADO';
  const puedeSellar = !retail && pedido.estado === 'EN_PREPARACION';
  const puedeAnular = admiteAnulacion(pedido.estado);

  async function confirmar() {
    if (!accion) return;
    setProcesando(true);
    try {
      const r = accion === 'preparacion' ? await iniciarPreparacion(pedido.pedidoId) : await sellarPaquete(pedido.pedidoId);
      notifications.show({
        color: 'green',
        title: accion === 'preparacion' ? 'Pedido en preparación' : 'Despacho solicitado',
        message:
          accion === 'preparacion'
            ? `El pedido ${r.pedidoId} ya se puede armar.`
            : `Código de despacho: ${r.idDespacho ?? 'pendiente'}.`,
      });
      setAccion(null);
      onActualizado();
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo completar la acción',
        message: e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.',
      });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }}>
        <Tarjeta etiqueta="Código">{pedido.pedidoId}</Tarjeta>
        <Tarjeta etiqueta="Estado">
          <EstadoBadge entidad="pedido" estado={pedido.estado} size="lg" />
        </Tarjeta>
        <Tarjeta etiqueta="Canal">{ETIQUETA_CANAL[pedido.canal]}</Tarjeta>
        <Tarjeta etiqueta="Fecha">{formatoFecha(pedido.fechaCreacion)}</Tarjeta>
        <Tarjeta etiqueta="Total">{formatoMonto(pedido.pago.total)}</Tarjeta>
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="lg">
            <Seccion titulo="Datos del pedido">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs">
                <Dato etiqueta="Cliente">{pedido.contacto.nombreCompleto}</Dato>
                <Dato etiqueta="Fecha de registro">{formatoFechaHora(pedido.fechaCreacion)}</Dato>
                <Dato etiqueta="Documento">
                  {pedido.contacto.tipoDocumento} {pedido.contacto.numeroDocumento}
                </Dato>
                <Dato etiqueta="Correo">{pedido.contacto.email}</Dato>
                <Dato etiqueta="Canal">{ETIQUETA_CANAL[pedido.canal]}</Dato>
                <Dato etiqueta="Teléfono">{pedido.contacto.telefono ?? '—'}</Dato>
              </SimpleGrid>
            </Seccion>

            <Seccion titulo="Ítems del pedido">
              <Table.ScrollContainer minWidth={520}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Producto</Table.Th>
                      <Table.Th>SKU</Table.Th>
                      <Table.Th>Cant.</Table.Th>
                      <Table.Th>Precio unitario</Table.Th>
                      <Table.Th>Importe</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pedido.items.map((i, n) => (
                      <Table.Tr key={`${i.sku}-${n}`}>
                        <Table.Td>{i.descripcion}</Table.Td>
                        <Table.Td>{i.sku}</Table.Td>
                        <Table.Td>{i.cantidad}</Table.Td>
                        <Table.Td>{formatoMonto(i.precioUnitario)}</Table.Td>
                        <Table.Td>{formatoMonto(i.cantidad * i.precioUnitario)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
              <Stack gap={4} mt="sm" align="flex-end">
                <Group gap="xl">
                  <Text size="sm" c="dimmed">
                    Subtotal ítems
                  </Text>
                  <Text size="sm">{formatoMonto(total)}</Text>
                </Group>
                {Math.abs(pedido.pago.total - total) >= 0.005 && (
                  <Group gap="xl">
                    <Text size="sm" c="dimmed">
                      Envío y descuentos
                    </Text>
                    <Text size="sm">{formatoMonto(pedido.pago.total - total)}</Text>
                  </Group>
                )}
                <Group gap="xl">
                  <Text fw={700}>Total</Text>
                  <Text fw={700}>{formatoMonto(pedido.pago.total)}</Text>
                </Group>
              </Stack>
            </Seccion>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <Seccion titulo="Pago">
                <Stack gap="xs">
                  <Dato etiqueta="Método">{pedido.pago.metodoPago ?? '—'}</Dato>
                  <Dato etiqueta="Estado del pago">
                    {pedido.estado === 'CREADO' ? 'Pendiente' : pedido.estado === 'ANULADO' ? 'Anulado' : 'Confirmado'}
                  </Dato>
                  <Dato etiqueta="Monto">{formatoMonto(pedido.pago.total)}</Dato>
                </Stack>
              </Seccion>

              <Seccion titulo={retail ? 'Entrega en tienda' : 'Despacho'}>
                <Stack gap="xs">
                  {retail ? (
                    <Dato etiqueta="Tienda">{envio?.tiendaId ?? '—'}</Dato>
                  ) : (
                    <>
                      <Dato etiqueta="Estado logístico">{ETIQUETA_ESTADO[pedido.estado]}</Dato>
                      <Dato etiqueta="Modalidad">{envio?.modalidad ?? '—'}</Dato>
                      <Dato etiqueta="Fecha estimada">
                        {envio?.fechaEstimadaEntrega ? formatoFecha(envio.fechaEstimadaEntrega) : '—'}
                      </Dato>
                      <Dato etiqueta="Dirección">
                        {[envio?.direccion, envio?.distrito, envio?.provincia].filter(Boolean).join(', ') || '—'}
                      </Dato>
                      {envio?.referencia && <Dato etiqueta="Referencia">{envio.referencia}</Dato>}
                    </>
                  )}
                </Stack>
              </Seccion>
            </SimpleGrid>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="lg">
            <Seccion titulo="Historial de estados">
              <HistorialEstados pedido={pedido} />
            </Seccion>

            <Seccion titulo="Acciones disponibles">
              <Stack>
                {puedePreparar && <Button onClick={() => setAccion('preparacion')}>Pasar a preparación</Button>}
                {puedeSellar && <Button onClick={() => setAccion('despacho')}>Paquete sellado</Button>}
                {puedeAnular && (
                  <Button
                    variant="outline"
                    onClick={() => navegar(`/admin/anulaciones?pedidoId=${encodeURIComponent(pedido.pedidoId)}`)}
                  >
                    Iniciar anulación
                  </Button>
                )}
                {!puedePreparar && !puedeSellar && !puedeAnular && (
                  <Text size="sm" c="dimmed">
                    No hay acciones para un pedido {ETIQUETA_ESTADO[pedido.estado].toLowerCase()}.
                  </Text>
                )}
              </Stack>
            </Seccion>

            <Seccion titulo="Notas / Trazabilidad">
              <Stack gap="xs">
                <Dato etiqueta="Última actualización">{formatoFechaHora(pedido.ultimaActualizacion)}</Dato>
                {ultimo && (
                  <>
                    <Dato etiqueta="Responsable">{ETIQUETA_ACTOR[ultimo.actor]}</Dato>
                    <Dato etiqueta="Movimiento reciente">
                      {ETIQUETA_ESTADO[ultimo.estado]}
                      {ultimo.motivo ? ` — ${ultimo.motivo}` : ''}
                    </Dato>
                  </>
                )}
              </Stack>
            </Seccion>
          </Stack>
        </Grid.Col>
      </Grid>

      <ModalConfirmacion
        abierto={accion !== null}
        titulo={accion === 'preparacion' ? 'Pasar a preparación' : 'Confirmar paquete sellado'}
        mensaje={
          accion === 'preparacion'
            ? `El pedido ${pedido.pedidoId} pasará de Pagado a En preparación.`
            : `Se pedirá a Despacho que recoja el pedido ${pedido.pedidoId}. Pasará a Despachado cuando el repartidor salga.`
        }
        textoConfirmar={accion === 'preparacion' ? 'Pasar a preparación' : 'Solicitar despacho'}
        procesando={procesando}
        onConfirmar={confirmar}
        onCerrar={() => setAccion(null)}
      />
    </Stack>
  );
}

export function DetallePedidoPage() {
  const { pedidoId = '' } = useParams();
  const navegar = useNavigate();
  const consulta = useConsulta(() => obtenerPedido(pedidoId), [pedidoId]);
  const noExiste = consulta.error instanceof ApiError && consulta.error.status === 404;

  return (
    <Stack gap="lg">
      <Group>
        <ActionIcon variant="default" size="lg" onClick={() => navegar('/admin/pedidos')} aria-label="Volver a pedidos">
          ←
        </ActionIcon>
        <Title order={1}>Detalle del pedido</Title>
      </Group>

      {noExiste ? (
        <Text c="dimmed">No existe el pedido {pedidoId}.</Text>
      ) : (
        <EstadoCarga
          cargando={consulta.cargando && !consulta.datos}
          error={consulta.error}
          datos={consulta.datos}
          onReintentar={consulta.recargar}
        >
          {(pedido) => <Detalle pedido={pedido} onActualizado={consulta.recargar} />}
        </EstadoCarga>
      )}
    </Stack>
  );
}
