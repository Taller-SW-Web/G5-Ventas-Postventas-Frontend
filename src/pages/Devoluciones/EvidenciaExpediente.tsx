// Bloque "Evidencia" del Mockup 06 y sus vistas previas (Overlay / Evidencia Foto y Evidencia PDF).
import { useState, type ReactNode } from 'react';
import { Anchor, Box, Button, Center, Group, Image, Modal, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import iconoDocumento from '@/assets/devoluciones/documento.svg';
import iconoFotoGrande from '@/assets/devoluciones/foto-grande.svg';
import iconoFoto from '@/assets/devoluciones/foto.svg';
import iconoPdf from '@/assets/devoluciones/pdf.svg';
import type { Evidencia } from '@/types/devolucion';
import type { Expediente } from './expediente';
import { TarjetaPanel } from './PanelesExpediente';
import { dia } from './formato';

function Recuadro({ fondo, tamano, radio = 12, children }: { fondo: string; tamano: number; radio?: number; children: ReactNode }) {
  return (
    <Center bg={fondo} w={tamano} h={tamano} style={{ borderRadius: radio, flexShrink: 0 }}>
      {children}
    </Center>
  );
}

function TarjetaEvidencia({ evidencia, onAbrir }: { evidencia: Evidencia; onAbrir: () => void }) {
  const esImagen = evidencia.tipo === 'IMAGEN';
  return (
    <Paper withBorder radius="md" p="md" shadow="xs">
      <Group gap="sm" wrap="nowrap" mb="lg">
        <Recuadro fondo={esImagen ? 'orange.1' : 'signal.1'} tamano={48}>
          <img src={esImagen ? iconoFoto : iconoPdf} width={26} height={26} alt="" />
        </Recuadro>
        <Stack gap={0}>
          <Text fw={600}>{esImagen ? 'Foto del producto' : 'Comprobante adjunto'}</Text>
          <Text size="xs" c="dimmed">
            {esImagen ? 'Evidencia visual · imagen' : 'Documento de respaldo · PDF'}
          </Text>
        </Stack>
      </Group>
      <Button fullWidth variant={esImagen ? 'filled' : 'default'} onClick={onAbrir}>
        {esImagen ? 'Ver foto' : 'Abrir PDF'}
      </Button>
    </Paper>
  );
}

/** Lo que se ve cuando el archivo no se puede mostrar (almacén de evidencias no disponible). */
function MarcadorFoto() {
  return (
    <Stack align="center" gap={6} py={48}>
      <Recuadro fondo="orange.1" tamano={100} radio={24}>
        <img src={iconoFotoGrande} width={34} height={34} alt="" />
      </Recuadro>
      <Text fw={600} mt="sm">
        Foto del producto reportado
      </Text>
      <Text size="xs" c="dimmed">
        Evidencia visual vinculada al expediente
      </Text>
    </Stack>
  );
}

function MarcadorPdf({ expediente: { devolucion: e, pedido } }: { expediente: Expediente }) {
  const filas: [string, string][] = [
    ['Pedido', e.pedidoId],
    ['Cliente', pedido?.contacto.nombreCompleto ?? '—'],
    ['Fecha', dia(e.fechaRegistro)],
  ];
  return (
    <Paper withBorder radius="xs" p="lg" maw={376} mx="auto">
      <Group gap="md" mb="lg" wrap="nowrap">
        <Recuadro fondo="signal.1" tamano={48}>
          <img src={iconoDocumento} width={34} height={34} alt="" />
        </Recuadro>
        <Text fw={700}>COMPROBANTE DE COMPRA</Text>
      </Group>
      <Stack gap="sm">
        {filas.map(([etiqueta, valor]) => (
          <Group key={etiqueta} gap={0} wrap="nowrap">
            <Text size="xs" c="dimmed" w={106}>
              {etiqueta}
            </Text>
            <Text size="xs" fw={600}>
              {valor}
            </Text>
          </Group>
        ))}
      </Stack>
      <Stack gap={12} mt="xl">
        {['100%', '87%', '94%'].map((ancho) => (
          <Box key={ancho} h={8} w={ancho} bg="cloud.4" style={{ borderRadius: 4 }} />
        ))}
      </Stack>
      <Text size="xs" c="dimmed" ta="center" mt="xl">
        Documento de respaldo asociado al expediente
      </Text>
    </Paper>
  );
}

function VistaPrevia({
  evidencia,
  expediente,
  onCerrar,
}: {
  evidencia: Evidencia | null;
  expediente: Expediente;
  onCerrar: () => void;
}) {
  const [fallo, setFallo] = useState(false);
  const esImagen = evidencia?.tipo === 'IMAGEN';
  const conArchivo = Boolean(evidencia?.url) && !fallo;

  return (
    <Modal
      opened={evidencia !== null}
      onClose={onCerrar}
      size={560}
      withCloseButton={false}
      title={
        <Text ff="Oswald, sans-serif" fw={700} size="xl" tt="uppercase">
          {esImagen ? 'Vista previa de evidencia' : 'Comprobante adjunto'}
        </Text>
      }
    >
      {evidencia &&
        (esImagen ? (
          <Box bg="cloud.2" bd="1px solid var(--mantine-color-gray-3)" style={{ borderRadius: 12 }}>
            {conArchivo ? (
              <Image src={evidencia.url} alt="Foto del producto reportado" fit="contain" mah={420} onError={() => setFallo(true)} />
            ) : (
              <MarcadorFoto />
            )}
          </Box>
        ) : conArchivo ? (
          <iframe src={evidencia.url} title="Comprobante adjunto" style={{ width: '100%', height: 420, border: 0 }} onError={() => setFallo(true)} />
        ) : (
          <MarcadorPdf expediente={expediente} />
        ))}
      <Group justify={evidencia?.url ? 'space-between' : 'flex-end'} mt="lg">
        {evidencia?.url && (
          <Anchor href={evidencia.url} target="_blank" rel="noreferrer" size="sm">
            Abrir el archivo original
          </Anchor>
        )}
        <Button color="ink" w={180} onClick={onCerrar}>
          Cerrar
        </Button>
      </Group>
    </Modal>
  );
}

export function EvidenciaExpediente({ expediente }: { expediente: Expediente }) {
  const [abierta, setAbierta] = useState<Evidencia | null>(null);
  const evidencias = expediente.devolucion.evidencias ?? [];

  return (
    <TarjetaPanel titulo="Evidencia">
      <Text size="xs" c="dimmed" mb="sm">
        Referencias verificables adjuntas por el cliente
      </Text>
      <Box bg="cloud.2" p="lg" bd="1px solid var(--mantine-color-gray-3)" style={{ borderRadius: 12 }}>
        {evidencias.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            El cliente no adjuntó evidencia.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {evidencias.map((ev, i) => (
              <TarjetaEvidencia key={`${ev.tipo}-${i}`} evidencia={ev} onAbrir={() => setAbierta(ev)} />
            ))}
          </SimpleGrid>
        )}
      </Box>
      <VistaPrevia
        key={abierta?.url ?? 'cerrada'}
        evidencia={abierta}
        expediente={expediente}
        onCerrar={() => setAbierta(null)}
      />
    </TarjetaPanel>
  );
}
