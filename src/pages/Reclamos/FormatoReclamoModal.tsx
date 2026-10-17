// Overlay_PDF_reclamo (Mockup 07, 8.2): vista previa del formato del reclamo.
// Igual que el mockup, no descarga un archivo; "Imprimir" usa el diálogo del navegador (permite guardar como PDF)
// y solo imprime el formato, no el resto del portal (ver FormatoReclamoModal.css).
import { Button, Divider, Group, Modal, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import './FormatoReclamoModal.css';
import type { ReclamoDetalle } from '@/types/reclamo';
import { ETIQUETA_CANAL, ETIQUETA_MOTIVO, ETIQUETA_TIPO, fecha, fechaHora } from './formato';

interface Props {
  reclamo: ReclamoDetalle;
  /** Respuesta guardada en pantalla que todavía no se envió (se muestra como borrador). */
  borrador: string;
  abierto: boolean;
  onCerrar: () => void;
}

function Campo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed" fw={600}>
        {titulo}
      </Text>
      <Text size="sm">{valor}</Text>
    </div>
  );
}

export function FormatoReclamoModal({ reclamo, borrador, abierto, onCerrar }: Props) {
  const respuesta = reclamo.respuestaVisibleCliente ?? (borrador ? `${borrador} (borrador, sin enviar)` : null);

  return (
    <Modal opened={abierto} onClose={onCerrar} size="lg" title={<Text fw={700}>Formato del reclamo</Text>}>
      <Stack gap="md" className="formato-reclamo-imprimible">
        <div>
          <Title order={4}>Libro de Reclamaciones</Title>
          <Text size="sm" c="dimmed">
            {ETIQUETA_TIPO[reclamo.tipo]} {reclamo.codigoSeguimiento}
          </Text>
        </div>
        <SimpleGrid cols={2}>
          <Campo titulo="Código de seguimiento" valor={reclamo.codigoSeguimiento} />
          <Campo titulo="Pedido" valor={reclamo.pedidoId ?? 'Sin pedido asociado'} />
          <Campo titulo="Consumidor" valor={reclamo.consumidor?.nombreCompleto ?? '—'} />
          <Campo titulo="Documento" valor={reclamo.consumidor?.documento ?? '—'} />
          <Campo titulo="Canal" valor={ETIQUETA_CANAL[reclamo.canal]} />
          <Campo titulo="Motivo" valor={ETIQUETA_MOTIVO[reclamo.motivo]} />
          <Campo titulo="Fecha de registro" valor={fechaHora(reclamo.fechaRegistro)} />
          <Campo titulo="Fecha límite de respuesta" valor={fecha(reclamo.fechaLimiteSLA)} />
          <Campo titulo="Estado" valor={reclamo.estado} />
          <Campo titulo="Fecha de atención" valor={fechaHora(reclamo.fechaAtencion)} />
        </SimpleGrid>
        <Divider />
        <Campo titulo="Detalle del consumidor" valor={reclamo.detalle} />
        <Campo titulo="Respuesta visible al cliente" valor={respuesta ?? 'Pendiente de respuesta formal'} />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button color="dark" onClick={onCerrar}>
            Cerrar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
