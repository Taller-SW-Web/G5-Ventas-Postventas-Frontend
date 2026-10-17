// Panel "Detalle rápido" del Mockup 02: se abre al seleccionar una fila de la bandeja.
import { useNavigate } from 'react-router-dom';
import { Button, Drawer, Group, Stack, Text } from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import type { PedidoResumen } from '@/types/pedido';
import { ETIQUETA_CANAL, admiteAnulacion, formatoFecha, formatoMonto } from './formato';

interface DetalleRapidoProps {
  pedido: PedidoResumen | null;
  onCerrar: () => void;
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {etiqueta}
      </Text>
      <Text component="div" size="sm" fw={500} ta="right">
        {children}
      </Text>
    </Group>
  );
}

export function DetalleRapido({ pedido, onCerrar }: DetalleRapidoProps) {
  const navegar = useNavigate();

  return (
    <Drawer
      opened={pedido !== null}
      onClose={onCerrar}
      position="right"
      title={<Text fw={700}>Detalle rápido</Text>}
    >
      {pedido && (
        <Stack>
          <Dato etiqueta="Código">{pedido.pedidoId}</Dato>
          <Dato etiqueta="Estado">
            <EstadoBadge entidad="pedido" estado={pedido.estado} />
          </Dato>
          <Dato etiqueta="Canal">{ETIQUETA_CANAL[pedido.canal]}</Dato>
          <Dato etiqueta="Cliente">{pedido.nombreCliente ?? '—'}</Dato>
          <Dato etiqueta="Total">{formatoMonto(pedido.total)}</Dato>
          <Dato etiqueta="Fecha">{formatoFecha(pedido.fechaCreacion)}</Dato>

          <Button mt="md" onClick={() => navegar(`/admin/pedidos/${pedido.pedidoId}`)}>
            Ver detalle completo
          </Button>
          {admiteAnulacion(pedido.estado) ? (
            <Button
              variant="outline"
              onClick={() => navegar(`/admin/anulaciones?pedidoId=${encodeURIComponent(pedido.pedidoId)}`)}
            >
              Iniciar anulación
            </Button>
          ) : (
            <Text size="xs" c="dimmed" ta="center">
              Anulación no disponible: el pedido ya salió a reparto o terminó. Si el cliente lo pide, va por
              devolución.
            </Text>
          )}
        </Stack>
      )}
    </Drawer>
  );
}
