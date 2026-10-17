// Modal_Exportar_reporte + Overlay_Exportacion_completada (Mockup 09, 5.5).
// Es una simulación: no genera archivo ni elige formato (ESP-16 todavía no está en el contrato). Cerrar → sale sin
// continuar; Preparar → "Exportación preparada"; Finalizar → vuelve a la consulta.
import { useState } from 'react';
import { Badge, Box, Button, Center, Group, Modal, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FiltrosAplicados } from './FiltrosAplicados';
import { indicadores, textoRango, type ContextoReporte, type Indicador } from './reportes';

interface Props {
  abierto: boolean;
  contexto: ContextoReporte | null;
  onCerrar: () => void;
}

const CONTENIDO_INCLUIDO = ['Periodo', 'Canal', 'Pedidos', 'Postventa', 'CSAT'];

function Grupo({ titulo, subtitulo, filas }: { titulo: string; subtitulo: string; filas: Indicador[] }) {
  return (
    <Paper withBorder radius="md" p="sm">
      <Text fw={700} tt="uppercase" size="sm">
        {titulo}
      </Text>
      <Text size="xs" c="dimmed" mb="xs">
        {subtitulo}
      </Text>
      <Stack gap={6}>
        {filas.map((f) => (
          <Group key={f.clave} justify="space-between" wrap="nowrap">
            <Text size="sm">{f.etiqueta}</Text>
            <Text size="sm" fw={600}>
              {f.texto}
            </Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

export function ModalExportar({ abierto, contexto, onCerrar }: Props) {
  const [preparado, setPreparado] = useState(false);

  function preparar() {
    setPreparado(true);
    notifications.show({
      title: 'Reporte preparado',
      message: 'Se conservan exactamente los filtros y métricas visibles.',
      color: 'dark',
    });
  }

  function finalizar() {
    setPreparado(false);
    onCerrar();
  }

  const filas = contexto ? indicadores(contexto.actual) : [];

  return (
    <>
      <Modal
        opened={abierto && !preparado}
        onClose={onCerrar}
        size="xl"
        title={<Title order={3}>Exportar reporte</Title>}
      >
        {contexto && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Confirma los filtros y datos que serán incluidos
            </Text>
            <FiltrosAplicados
              columnas={[
                { titulo: 'Periodo', valor: `${contexto.periodo} (${textoRango(contexto.rango)})` },
                { titulo: 'Canal', valor: contexto.canal },
              ]}
              nota="Los valores corresponden exactamente a la vista actual"
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Grupo titulo="Pedidos" subtitulo="Resumen operativo" filas={filas.filter((f) => f.grupo === 'PEDIDOS')} />
              <Grupo
                titulo="Postventa"
                subtitulo="Indicadores consolidados"
                filas={filas.filter((f) => f.grupo === 'POSTVENTA')}
              />
            </SimpleGrid>
            <Box bg="signal.0" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
              <Text size="xs" fw={700} c="signal.7" tt="uppercase">
                Contenido incluido
              </Text>
              <Text size="xs" c="dimmed" mb={6}>
                Se conservarán los filtros actuales y las métricas visibles del reporte
              </Text>
              <Group gap="xs">
                {CONTENIDO_INCLUIDO.map((c) => (
                  <Badge key={c} variant="white" color="signal" tt="none">
                    {c}
                  </Badge>
                ))}
              </Group>
            </Box>
            <Group justify="space-between" wrap="wrap">
              <Text size="xs" c="dimmed">
                El formato de descarga se definirá cuando esté formalizado en el contrato
              </Text>
              <Group gap="sm">
                <Button variant="default" onClick={onCerrar}>
                  Cerrar
                </Button>
                <Button onClick={preparar}>Preparar</Button>
              </Group>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal opened={abierto && preparado} onClose={finalizar} centered withCloseButton={false}>
        <Stack align="center" gap="sm" py="md">
          <Center w={72} h={72} bg="volt.1" style={{ borderRadius: '50%' }}>
            <Text fz={32} c="volt.9" aria-hidden>
              ✓
            </Text>
          </Center>
          <Title order={3}>Exportación preparada</Title>
          <Text size="sm" c="dimmed" ta="center">
            El reporte quedó listo con los filtros y métricas que revisaste
          </Text>
          <Box bg="cloud.2" p="sm" w="100%" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
            <Text size="xs" c="volt.9" ta="center" fw={600}>
              Proceso completado
            </Text>
          </Box>
          <Button color="dark" onClick={finalizar}>
            Finalizar
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
