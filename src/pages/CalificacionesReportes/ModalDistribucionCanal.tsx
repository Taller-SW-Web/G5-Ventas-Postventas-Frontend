// Overlay_Distribucion_por_canal (Mockup 09, 9.2): pedidos, participación, CSAT y monto reembolsado por canal.
import { Button, Group, Modal, Stack, Table, Text, Title } from '@mantine/core';
import type { Canal } from '@/types/comun';
import type { MetricasDashboard } from '@/types/reclamo';
import { entero, soles } from '../Dashboard/metricas';
import { ETIQUETA_CANAL } from '../Reclamos/formato';
import { FiltrosAplicados } from './FiltrosAplicados';
import { csat, porcentaje, textoRango, type ContextoReporte } from './reportes';

interface Props {
  abierto: boolean;
  contexto: ContextoReporte | null;
  porCanal: { canal: Canal; metricas: MetricasDashboard }[] | null;
  onCerrar: () => void;
}

export function ModalDistribucionCanal({ abierto, contexto, porCanal, onCerrar }: Props) {
  const total = porCanal?.reduce((s, c) => s + c.metricas.pedidos.total, 0) ?? 0;
  return (
    <Modal opened={abierto} onClose={onCerrar} size="xl" title={<Title order={3}>Distribución por canal</Title>}>
      {contexto && (
        <Stack gap="md">
          <FiltrosAplicados
            columnas={[
              { titulo: 'Periodo', valor: `${contexto.periodo} (${textoRango(contexto.rango)})` },
              { titulo: 'Pedidos del periodo', valor: entero(total) },
            ]}
          />
          {porCanal ? (
            <Table verticalSpacing="sm" striped>
              <Table.Thead bg="cloud.2">
                <Table.Tr>
                  <Table.Th>Canal</Table.Th>
                  <Table.Th ta="right">Pedidos</Table.Th>
                  <Table.Th ta="right">Participación</Table.Th>
                  <Table.Th ta="right">CSAT</Table.Th>
                  <Table.Th ta="right">Monto reembolsado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {porCanal.map(({ canal, metricas }) => (
                  <Table.Tr key={canal}>
                    <Table.Td fw={600}>{ETIQUETA_CANAL[canal]}</Table.Td>
                    <Table.Td ta="right">{entero(metricas.pedidos.total)}</Table.Td>
                    <Table.Td ta="right">
                      {porcentaje(total > 0 ? (metricas.pedidos.total / total) * 100 : null)}
                    </Table.Td>
                    <Table.Td ta="right">{csat(metricas.postventa.csatPromedio)}</Table.Td>
                    <Table.Td ta="right">{soles(metricas.postventa.montoReembolsadoPEN)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text size="sm" c="dimmed">
              El reporte está filtrado a un solo canal ({contexto.canal}). Elige "Todos" para comparar la participación.
            </Text>
          )}
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
