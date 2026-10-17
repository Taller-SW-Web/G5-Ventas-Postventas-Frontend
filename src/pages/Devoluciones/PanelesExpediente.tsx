// Paneles de revisión del Mockup 06: "Detalle del expediente" y "Resolución / evaluación".
import type { ReactNode } from 'react';
import { ActionIcon, Box, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import iconoCerrar from '@/assets/devoluciones/cerrar.svg';
import { EstadoBadge } from '@/components/EstadoBadge';
import type { DevolucionDetalle } from '@/types/devolucion';
import {
  ETIQUETA_CANAL,
  ETIQUETA_TIPO,
  cantidadArchivos,
  dia,
  plazoDevolucion,
  resumenEvaluacion,
  textoMotivo,
} from './formato';

export function TarjetaPanel({
  titulo,
  accion,
  children,
}: {
  titulo: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper withBorder radius="md" p="md" shadow="xs">
      <Group justify="space-between" wrap="nowrap" mb={6}>
        <Title order={3} size="h4" ff="Oswald, sans-serif" tt="uppercase">
          {titulo}
        </Title>
        {accion}
      </Group>
      <Divider mb="sm" />
      {children}
    </Paper>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <>
      <Text size="sm" c="dimmed">
        {etiqueta}
      </Text>
      <Text size="sm" fw={500} component="div">
        {children}
      </Text>
    </>
  );
}

const GRILLA_DATOS = { display: 'grid', gridTemplateColumns: '7.5rem 1fr', gap: '8px 12px' } as const;

export function DetalleExpediente({
  expediente: e,
  onCerrar,
}: {
  expediente: DevolucionDetalle;
  onCerrar: () => void;
}) {
  const plazo = plazoDevolucion(e);

  return (
    <TarjetaPanel
      titulo="Detalle del expediente"
      accion={
        <ActionIcon variant="light" color="gray" onClick={onCerrar} aria-label="Cerrar detalle">
          <img src={iconoCerrar} width={18} height={18} alt="" />
        </ActionIcon>
      }
    >
      <Box style={GRILLA_DATOS}>
        <Dato etiqueta="Expediente">
          <Text span size="sm" fw={700}>
            {e.devolucionId}
          </Text>
        </Dato>
        <Dato etiqueta="Pedido">{e.pedidoId}</Dato>
        <Dato etiqueta="Estado">
          <EstadoBadge entidad="devolucion" estado={e.estado} size="sm" />
        </Dato>
        <Dato etiqueta="Tipo">{ETIQUETA_TIPO[e.tipo]}</Dato>
        <Dato etiqueta="Cliente">{e.nombreCliente ?? '—'}</Dato>
        <Dato etiqueta="Canal">{e.canal ? ETIQUETA_CANAL[e.canal] : '—'}</Dato>
        <Dato etiqueta="Fecha entrega">{e.fechaEntrega ? dia(e.fechaEntrega) : '—'}</Dato>
        <Dato etiqueta="Plazo">
          {plazo ? (
            <Text span size="sm" fw={500} c={plazo.dentroDePlazo ? undefined : 'red.8'}>
              Hasta el {dia(plazo.limite)} ·{' '}
              {plazo.dentroDePlazo ? 'solicitud dentro de plazo' : 'solicitud fuera de plazo'}
            </Text>
          ) : (
            'Sin fecha de entrega'
          )}
        </Dato>
        <Dato etiqueta="Motivo">{textoMotivo(e.motivo, e.descripcion)}</Dato>
        <Dato etiqueta="Evidencia">{cantidadArchivos(e)}</Dato>
        {e.resolucion?.fundamento && <Dato etiqueta="Fundamento">{e.resolucion.fundamento}</Dato>}
      </Box>
    </TarjetaPanel>
  );
}

export function EvaluacionExpediente({ expediente }: { expediente: DevolucionDetalle }) {
  const r = resumenEvaluacion(expediente);
  return (
    <TarjetaPanel titulo="Resolución / evaluación">
      <Stack gap={0}>
        <Box style={GRILLA_DATOS}>
          <Dato etiqueta="Resolución">{r.resolucion}</Dato>
          <Dato etiqueta="Stock cambio">{r.stock}</Dato>
          <Dato etiqueta="Logística">{r.logistica}</Dato>
          <Dato etiqueta="Reembolso">{r.reembolso}</Dato>
        </Box>
      </Stack>
    </TarjetaPanel>
  );
}
