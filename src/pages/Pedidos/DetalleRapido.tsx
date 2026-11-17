// Panel "Detalle rápido" del Mockup 02 (7.5-8.3): se muestra a la derecha del listado al seleccionar un pedido.
import { useNavigate } from 'react-router-dom';
import { ActionIcon, Alert, Button, Card, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { EstadoBadge } from '@/components/EstadoBadge';
import type { PedidoResumen } from '@/types/pedido';
import { ETIQUETA_CANAL, admiteAnulacion, formatoFecha, formatoMonto } from './formato';

interface DetalleRapidoProps {
  pedido: PedidoResumen;
  onCerrar: () => void;
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
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
    <Card p="md" shadow="xs" aria-label="Detalle rápido">
      <Group justify="space-between" wrap="nowrap">
        <Title order={3} size="h4">
          Detalle rápido
        </Title>
        <ActionIcon variant="subtle" color="gray" onClick={onCerrar} aria-label="Cerrar detalle rápido">
          <IconX size={20} aria-hidden />
        </ActionIcon>
      </Group>
      <Divider my="sm" />
      <Stack gap="sm">
        <Dato etiqueta="Código">{pedido.pedidoId}</Dato>
        <Dato etiqueta="Estado">
          <EstadoBadge entidad="pedido" estado={pedido.estado} />
        </Dato>
        <Dato etiqueta="Canal">{ETIQUETA_CANAL[pedido.canal]}</Dato>
        <Dato etiqueta="Cliente">{pedido.nombreCliente ?? '—'}</Dato>
        <Dato etiqueta="Total">{formatoMonto(pedido.total)}</Dato>
        {/* 1.4 no trae la última actualización (Mockup 02, 7.5): se muestra la fecha de registro */}
        <Dato etiqueta="Fecha de registro">{formatoFecha(pedido.fechaCreacion)}</Dato>
      </Stack>

      <Stack gap="sm" mt="lg">
        <Button onClick={() => navegar(`/admin/pedidos/${encodeURIComponent(pedido.pedidoId)}`)}>
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
          <Alert color="gray" variant="light" p="sm" title="Anulación no disponible">
            <Text size="xs">
              {pedido.estado === 'ANULADO'
                ? 'El pedido ya está anulado.'
                : 'El pedido ya salió a reparto o se entregó. Si el cliente lo pide, continúa por postventa.'}
            </Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
