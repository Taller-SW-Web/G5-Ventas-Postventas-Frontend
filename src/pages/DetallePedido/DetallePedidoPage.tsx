// Mockup 03 — Detalle del pedido (F1). Responsable: Michael
// Endpoints: GET /api/v1/pedidos/{pedidoId} (1.3), POST .../preparacion y POST .../despacho (acciones del Gestor).
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Box,
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
import {
  IconBuildingStore,
  IconCalendar,
  IconCash,
  IconCircleCheck,
  IconCreditCard,
  IconHash,
  IconId,
  IconMail,
  IconMapPin,
  IconPhone,
  IconTruckDelivery,
  IconUser,
  type Icon,
} from '@tabler/icons-react';
import { BotonVolver } from '@/components/BotonVolver';
import { EstadoCarga } from '@/components/EstadoCarga';
import { IconoTarjeta } from '@/components/IconoTarjeta';
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

/** Situación logística que muestra el bloque Despacho para cada estado del pedido (Mockup 03, 6.3). */
const ESTADO_LOGISTICO: Record<EstadoPedido, string> = {
  CREADO: 'Pendiente de pago',
  PAGADO: 'Pendiente de preparación',
  EN_PREPARACION: 'En preparación',
  DESPACHADO: 'Despachado',
  ENTREGADO: 'Entregado',
  ANULADO: 'Sin despacho (pedido anulado)',
};

/** "DOMICILIO" → "Domicilio", "RECOJO_TIENDA" → "Recojo tienda": texto legible del código de modalidad. */
function legible(codigo: string): string {
  const texto = codigo.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function direccionDe(envio: PedidoDetalle['envio']): string {
  return [envio?.direccion, envio?.distrito, envio?.provincia].filter(Boolean).join(', ') || '—';
}

function Tarjeta({ etiqueta, icono, color, children }: { etiqueta: string; icono: Icon; color: string; children: ReactNode }) {
  return (
    <Card withBorder radius="md" p="md" shadow="xs">
      <Group gap="sm" wrap="nowrap">
        <IconoTarjeta icono={icono} color={color} tamano={36} />
        <div style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed">
            {etiqueta}
          </Text>
          <Text component="div" fw={700} size="md" style={{ overflowWrap: 'anywhere' }}>
            {children}
          </Text>
        </div>
      </Group>
    </Card>
  );
}

/** Bloque del detalle; con icono, este va a la izquierda del contenido (Pago y Despacho, Mockup 03). */
function Seccion({ titulo, icono, color, children }: { titulo: string; icono?: Icon; color?: string; children: ReactNode }) {
  return (
    <Card withBorder radius="md" p="md" shadow="xs" h="100%">
      <Title order={3} size="h4">
        {titulo}
      </Title>
      <Divider my="sm" />
      {icono ? (
        <Group gap="md" wrap="nowrap" align="flex-start">
          <IconoTarjeta icono={icono} color={color ?? 'orange'} />
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </Group>
      ) : (
        children
      )}
    </Card>
  );
}

function Dato({ etiqueta, icono: Icono, children }: { etiqueta: string; icono?: Icon; children: ReactNode }) {
  return (
    <Group gap="xs" wrap="nowrap" align="flex-start">
      {Icono && (
        <Icono size={16} stroke={2} color="var(--mantine-color-gray-6)" aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
      )}
      <Text size="sm" c="dimmed" w={Icono ? 128 : 140} style={{ flexShrink: 0 }}>
        {etiqueta}
      </Text>
      <Text component="div" size="sm" fw={500}>
        {children}
      </Text>
    </Group>
  );
}

/**
 * Recorrido del pedido con la etapa actual destacada en naranja y la etiqueta "Estado actual" (Mockup 03, 7).
 * Las etapas ya pasadas muestran su fecha del historial; las siguientes, solo su nombre.
 */
function HistorialEstados({ pedido }: { pedido: PedidoDetalle }) {
  const anulado = pedido.estado === 'ANULADO';
  const pasos = anulado
    ? pedido.historialEstados.map((h) => h.estado)
    : pedido.canal === 'RETAIL'
      ? FLUJO_RETAIL
      : FLUJO;
  const fechaDe = (estado: EstadoPedido) => pedido.historialEstados.find((h) => h.estado === estado)?.fecha;
  const activo = pasos.lastIndexOf(pedido.estado);
  const colorActual = anulado ? 'red' : 'orange';

  return (
    <Timeline active={-1} bulletSize={16} lineWidth={2}>
      {pasos.map((estado, i) => {
        const fecha = fechaDe(estado);
        const actual = i === activo;
        return (
          <Timeline.Item
            key={`${estado}-${i}`}
            lineVariant="dashed"
            color={actual ? colorActual : 'gray'}
            bullet={actual ? <Box w={8} h={8} bg={`${colorActual}.7`} style={{ borderRadius: '50%' }} /> : null}
            title={
              <Group gap="xs" justify="space-between" wrap="nowrap">
                <Text size="sm" fw={600} tt="uppercase">
                  {ETIQUETA_ESTADO[estado]}
                </Text>
                {actual && (
                  <Badge size="sm" variant="light" color={colorActual} tt="none">
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

/** Estado del pago derivado del estado del pedido (1.3 no trae uno propio). */
function estadoPago(estado: EstadoPedido): { texto: string; color: string } {
  if (estado === 'CREADO') return { texto: 'Pendiente', color: 'yellow' };
  if (estado === 'ANULADO') return { texto: 'Anulado', color: 'red' };
  return { texto: 'Confirmado', color: 'volt' };
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
        <Tarjeta etiqueta="Código" icono={IconHash} color="orange">
          {pedido.pedidoId}
        </Tarjeta>
        <Tarjeta etiqueta="Estado" icono={IconCircleCheck} color="signal">
          <Text component="span" inherit tt="uppercase">
            {ETIQUETA_ESTADO[pedido.estado]}
          </Text>
        </Tarjeta>
        <Tarjeta etiqueta="Canal" icono={IconBuildingStore} color="signal">
          {ETIQUETA_CANAL[pedido.canal]}
        </Tarjeta>
        <Tarjeta etiqueta="Fecha" icono={IconCalendar} color="yellow">
          {formatoFecha(pedido.fechaCreacion)}
        </Tarjeta>
        <Tarjeta etiqueta="Total" icono={IconCash} color="volt">
          {formatoMonto(pedido.pago.total)}
        </Tarjeta>
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="lg">
            <Seccion titulo="Datos del pedido">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs">
                <Dato etiqueta="Cliente" icono={IconUser}>
                  {pedido.contacto.nombreCompleto}
                </Dato>
                <Dato etiqueta="Fecha de registro" icono={IconCalendar}>
                  {formatoFechaHora(pedido.fechaCreacion)}
                </Dato>
                <Dato etiqueta="Documento" icono={IconId}>
                  {pedido.contacto.tipoDocumento} {pedido.contacto.numeroDocumento}
                </Dato>
                <Dato etiqueta="Correo" icono={IconMail}>
                  {pedido.contacto.email}
                </Dato>
                <Dato etiqueta="Canal" icono={IconBuildingStore}>
                  {ETIQUETA_CANAL[pedido.canal]}
                </Dato>
                <Dato etiqueta="Teléfono" icono={IconPhone}>
                  {pedido.contacto.telefono ?? '—'}
                </Dato>
                <Dato etiqueta={retail ? 'Tienda' : 'Dirección de entrega'} icono={IconMapPin}>
                  {retail ? (envio?.tiendaId ?? '—') : direccionDe(envio)}
                </Dato>
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
                <Group gap="xl" bg="cloud.4" px="md" py="xs" style={{ borderRadius: 'var(--mantine-radius-sm)' }}>
                  <Text fw={700}>Total</Text>
                  <Text fw={700}>{formatoMonto(pedido.pago.total)}</Text>
                </Group>
              </Stack>
            </Seccion>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <Seccion titulo="Pago" icono={IconCreditCard} color="signal">
                <Stack gap="xs">
                  <Dato etiqueta="Método">{pedido.pago.metodoPago ?? '—'}</Dato>
                  <Dato etiqueta="Estado del pago">
                    <Badge
                      variant="light"
                      color={estadoPago(pedido.estado).color}
                      c={estadoPago(pedido.estado).color === 'volt' ? 'volt.9' : undefined}
                      tt="none"
                    >
                      {estadoPago(pedido.estado).texto}
                    </Badge>
                  </Dato>
                  <Dato etiqueta="Monto">{formatoMonto(pedido.pago.total)}</Dato>
                </Stack>
              </Seccion>

              <Seccion titulo={retail ? 'Entrega en tienda' : 'Despacho'} icono={IconTruckDelivery} color="ink">
                <Stack gap="xs">
                  {retail ? (
                    <Dato etiqueta="Tienda">{envio?.tiendaId ?? '—'}</Dato>
                  ) : (
                    <>
                      <Dato etiqueta="Estado logístico">{ESTADO_LOGISTICO[pedido.estado]}</Dato>
                      <Dato etiqueta="Modalidad">{envio?.modalidad ? legible(envio.modalidad) : '—'}</Dato>
                      <Dato etiqueta="Fecha estimada">
                        {envio?.fechaEstimadaEntrega ? formatoFecha(envio.fechaEstimadaEntrega) : '—'}
                      </Dato>
                      <Dato etiqueta="Dirección">{direccionDe(envio)}</Dato>
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
                {puedeSellar && (
                  <Text size="xs" c="dimmed">
                    Pasa a Despachado cuando Despacho confirme la salida del paquete.
                  </Text>
                )}
                {pedido.estado === 'ENTREGADO' && (
                  <Alert color="green" variant="light" p="sm" title="Pedido entregado">
                    <Text size="xs">La atención posterior continúa por los procesos de postventa.</Text>
                  </Alert>
                )}
                {puedeAnular ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navegar(`/admin/anulaciones?pedidoId=${encodeURIComponent(pedido.pedidoId)}`)}
                    >
                      Iniciar anulación
                    </Button>
                    {pedido.estado === 'EN_PREPARACION' && (
                      <Text size="xs" c="dimmed">
                        En preparación la anulación requiere tu autorización como Gestor.
                      </Text>
                    )}
                  </>
                ) : (
                  <Alert color="gray" variant="light" p="sm" title="Anulación no disponible">
                    <Text size="xs">
                      {pedido.estado === 'ANULADO'
                        ? 'El pedido ya está anulado.'
                        : `Un pedido ${ETIQUETA_ESTADO[pedido.estado].toLowerCase()} ya no se puede anular.`}
                    </Text>
                  </Alert>
                )}
              </Stack>
            </Seccion>

            <Seccion titulo="Notas / Trazabilidad">
              <Stack gap="xs">
                <Dato etiqueta="Última actualización">{formatoFechaHora(pedido.ultimaActualizacion)}</Dato>
                {ultimo && (
                  <>
                    <Dato etiqueta="Usuario responsable">{ETIQUETA_ACTOR[ultimo.actor]}</Dato>
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
  const consulta = useConsulta(() => obtenerPedido(pedidoId), [pedidoId]);
  const noExiste = consulta.error instanceof ApiError && consulta.error.status === 404;

  return (
    <Stack gap="lg">
      <Group>
        <BotonVolver a="/admin/pedidos" etiqueta="Volver a pedidos" />
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
