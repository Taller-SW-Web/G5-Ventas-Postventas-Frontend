// Overlay_Resumen (Mockup 09): consolidación de las métricas contractuales para el periodo y canal aplicados.
import { Button, Divider, Group, Modal, Stack, Text } from '@mantine/core';
import { ESTILO_TITULO_MODAL } from './compartido/tituloModal';
import { indicadores, textoRango, type ContextoReporte } from './reportes';

interface Props {
  abierto: boolean;
  contexto: ContextoReporte | null;
  onCerrar: () => void;
}

export function ModalResumen({ abierto, contexto, onCerrar }: Props) {
  return (
    <Modal opened={abierto} onClose={onCerrar} size="md" title="Resumen del reporte" styles={ESTILO_TITULO_MODAL}>
      {contexto && (
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            Consolidación de las métricas contractuales para {contexto.periodo} ({textoRango(contexto.rango)}) ·{' '}
            {contexto.canal}
          </Text>
          {indicadores(contexto.actual).map((i) => (
            <div key={i.clave}>
              <Group justify="space-between" py={4}>
                <Text size="sm">{i.etiqueta}</Text>
                <Text size="sm" fw={600}>
                  {i.texto}
                </Text>
              </Group>
              <Divider />
            </div>
          ))}
          <Group justify="flex-end" mt="sm">
            <Button color="dark" onClick={onCerrar}>
              Cerrar
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
