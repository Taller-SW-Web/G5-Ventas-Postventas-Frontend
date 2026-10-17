// Modal_Exportar_reporte + Overlay_Exportacion_completada (Mockup 09, 5.5).
// Descarga un CSV con los indicadores de la consulta aplicada (ESP-16, sección 8), generado en el navegador: no
// vuelve a llamar al backend ni recalcula nada. Cerrar → sale sin descargar; Descargar → "Exportación completada".
import { useState } from 'react';
import { Badge, Box, Button, Center, Group, Modal, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FiltrosAplicados } from './FiltrosAplicados';
import { csvReporte, indicadores, nombreArchivoReporte, textoRango, type ContextoReporte, type Indicador } from './reportes';

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

  function descargar() {
    if (!contexto) return;
    const url = URL.createObjectURL(new Blob([csvReporte(contexto)], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivoReporte(contexto);
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    setPreparado(true);
    notifications.show({
      title: 'Reporte descargado',
      message: 'El CSV conserva exactamente los filtros y métricas visibles.',
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
                Formato: CSV (se abre en Excel)
              </Text>
              <Group gap="sm">
                <Button variant="default" onClick={onCerrar}>
                  Cerrar
                </Button>
                <Button onClick={descargar}>Descargar CSV</Button>
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
          <Title order={3}>Exportación completada</Title>
          <Text size="sm" c="dimmed" ta="center">
            Se descargó el CSV con los filtros y métricas que revisaste
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
