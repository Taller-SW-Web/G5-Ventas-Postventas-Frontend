import { Button, Group, Paper, Progress, RingProgress, Stack, Text, Title } from '@mantine/core';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useCalificaciones } from './ProveedorCalificaciones';
import { resumenSatisfaccion } from './consultaCalificaciones';
import { csat } from './reportes';

export function SeccionSatisfaccion() {
  const { consulta, abrir } = useCalificaciones();
  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Group justify="space-between" mb="md">
        <Title order={3}>Satisfacción del cliente</Title>
        <Button variant="default" size="xs" onClick={() => abrir('satisfaccion')}>Ver detalle</Button>
      </Group>
      <EstadoCarga {...consulta} onReintentar={consulta.recargar}
        esVacio={(d) => d.resumen.total === 0} mensajeVacio="No hay calificaciones para este periodo y canal.">
        {(datos) => {
          const resumen = resumenSatisfaccion(datos);
          return (
            <Group align="center" wrap="wrap" gap="lg">
              <Stack gap="sm" style={{ flex: '1 1 180px' }}>
                {resumen.distribucion.map(({ puntuacion, porcentaje }) => (
                  <Group key={puntuacion} gap="sm" wrap="nowrap">
                    <Text size="sm" w={26}>{puntuacion} ★</Text>
                    <Progress value={porcentaje} color="orange.7" style={{ flex: 1 }}
                      aria-label={puntuacion + ' estrellas: ' + porcentaje + '%'} />
                    <Text size="xs" c="dimmed" w={42} ta="right">{porcentaje}%</Text>
                  </Group>
                ))}
              </Stack>
              <RingProgress size={150} thickness={12}
                sections={[{ value: (resumen.promedio ?? 0) / 5 * 100, color: 'orange.7' }]}
                label={<Text ta="center" fw={700}>{csat(resumen.promedio)}</Text>} />
            </Group>
          );
        }}
      </EstadoCarga>
    </Paper>
  );
}
