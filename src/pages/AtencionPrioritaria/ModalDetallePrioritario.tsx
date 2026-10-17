// Modal_Detalle_prioritario (Mockup 01, 7.3 y 7.4): resumen del caso con acceso a su expediente.
// Se cierra con × y deja al usuario en la bandeja.
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Group, Modal, SimpleGrid, Stack, Text } from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import { dia, fechaHora } from '../Reclamos/formato';
import {
  ETIQUETA_PRIORIDAD,
  ETIQUETA_SITUACION,
  ETIQUETA_TIPO_CASO,
  rutaExpediente,
  type CasoPrioritario,
} from './casos';

interface Props {
  caso: CasoPrioritario | null;
  onCerrar: () => void;
}

function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed" fw={600}>
        {titulo}
      </Text>
      {typeof children === 'string' ? <Text size="sm">{children}</Text> : children}
    </div>
  );
}

export function ModalDetallePrioritario({ caso, onCerrar }: Props) {
  const navigate = useNavigate();

  return (
    <Modal
      opened={caso !== null}
      onClose={onCerrar}
      size="lg"
      title={<Text fw={700}>{caso ? `${ETIQUETA_TIPO_CASO[caso.tipo]} ${caso.codigo}` : ''}</Text>}
    >
      {caso && (
        <Stack gap="md">
          <Group gap="xs">
            <EstadoBadge
              entidad="situacion"
              estado={caso.situacion}
              texto={ETIQUETA_SITUACION[caso.situacion]}
              tt="none"
            />
            <EstadoBadge
              entidad="prioridad"
              estado={caso.prioridad}
              texto={`Prioridad ${ETIQUETA_PRIORIDAD[caso.prioridad].toLowerCase()}`}
              tt="none"
            />
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Campo titulo="Cliente">{caso.cliente ?? '—'}</Campo>
            <Campo titulo="Pedido asociado">{caso.pedidoId ?? 'Sin pedido asociado'}</Campo>
            <Campo titulo="Contexto">{caso.contexto}</Campo>
            <Campo titulo="Fecha de registro">{fechaHora(caso.fecha)}</Campo>
            <Campo titulo="Fecha límite">{caso.fechaLimite ? dia(caso.fechaLimite.slice(0, 10)) : 'Sin plazo legal'}</Campo>
          </SimpleGrid>
          <Text size="sm" c="dimmed">
            {caso.tipo === 'RECLAMO'
              ? 'El reclamo se atiende desde su expediente: ahí se registra la respuesta visible al cliente.'
              : 'El expediente se evalúa y resuelve desde Devoluciones y cambios.'}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={onCerrar}>
              Cerrar
            </Button>
            <Button onClick={() => navigate(rutaExpediente(caso))}>Ir al expediente</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
