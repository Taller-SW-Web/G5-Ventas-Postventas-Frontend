// Overlay_Detalle_Operacion (Mockup 09, 8.1): desglose de pedidos y postventa de la consulta aplicada.
import { Box, Button, Group, Modal, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { FiltrosAplicados } from './FiltrosAplicados';
import { indicadores, textoRango, type ContextoReporte, type Indicador } from './reportes';

interface Props {
  abierto: boolean;
  contexto: ContextoReporte | null;
  onCerrar: () => void;
}

function Columna({ titulo, subtitulo, filas, nota }: { titulo: string; subtitulo: string; filas: Indicador[]; nota?: string }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text fw={700} tt="uppercase">
        {titulo}
      </Text>
      <Text size="xs" c="dimmed" mb="sm">
        {subtitulo}
      </Text>
      <Stack gap="sm">
        {filas.map((f) => (
          <div key={f.clave}>
            <Text size="sm" c="dimmed">
              {f.etiqueta}
            </Text>
            <Text fz={22} fw={700}>
              {f.texto}
            </Text>
          </div>
        ))}
      </Stack>
      {nota && (
        <Box bg="cloud.2" p={6} mt="sm" style={{ borderRadius: 'var(--mantine-radius-sm)' }}>
          <Text size="xs" c="dimmed" ta="center">
            {nota}
          </Text>
        </Box>
      )}
    </Paper>
  );
}

export function ModalDetalleOperativo({ abierto, contexto, onCerrar }: Props) {
  const filas = contexto ? indicadores(contexto.actual) : [];
  return (
    <Modal opened={abierto} onClose={onCerrar} size="xl" title={<Title order={3}>Detalle operativo</Title>}>
      {contexto && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Desglose consolidado de Ventas y Postventa para los filtros seleccionados
          </Text>
          <FiltrosAplicados
            columnas={[
              { titulo: 'Periodo', valor: `${contexto.periodo} (${textoRango(contexto.rango)})` },
              { titulo: 'Canal', valor: contexto.canal },
            ]}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Columna
              titulo="Pedidos"
              subtitulo="Volumen y estados finales del periodo"
              filas={filas.filter((f) => f.grupo === 'PEDIDOS')}
              nota="Los pedidos se consolidan como registros únicos"
            />
            <Columna
              titulo="Postventa"
              subtitulo="Seguimiento de devoluciones, reembolsos y atención"
              filas={filas.filter((f) => f.grupo === 'POSTVENTA')}
            />
          </SimpleGrid>
          <Box bg="cloud.2" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
            <Text size="xs" fw={700}>
              Fuente de consulta
            </Text>
            <Text size="xs" c="dimmed">
              Los valores corresponden a agregados precalculados del periodo y canal aplicados, sin recalcular los datos
              transaccionales en cada consulta.
            </Text>
          </Box>
          <Group justify="flex-end">
            <Button color="dark" onClick={onCerrar}>
              Cerrar
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
