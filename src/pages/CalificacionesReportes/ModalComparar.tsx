// Modal_Comparar_reportes (Mockup 09, 5.4): periodo aplicado frente al periodo anterior de la misma duración.
import { Badge, Button, Group, Modal, Stack, Table, Text, Title } from '@mantine/core';
import { diferencia, variacionPorcentual } from '../Dashboard/metricas';
import { FiltrosAplicados } from './FiltrosAplicados';
import { indicadores, textoRango, type ContextoReporte, type Indicador } from './reportes';

interface Props {
  abierto: boolean;
  contexto: ContextoReporte | null;
  onCerrar: () => void;
}

/** CSAT se compara en puntos; el resto en %. */
function textoVariacion(actual: Indicador, anterior: Indicador): string {
  if (actual.clave === 'CSAT') {
    const d = diferencia(actual.numero, anterior.numero);
    return d === null ? '—' : `${d > 0 ? '+' : ''}${d.toFixed(2)} pts`;
  }
  const v = variacionPorcentual(actual.numero, anterior.numero);
  return v === null ? '—' : `${v > 0 ? '+' : ''}${v.toLocaleString('es-PE', { maximumFractionDigits: 1 })}%`;
}

export function ModalComparar({ abierto, contexto, onCerrar }: Props) {
  return (
    <Modal opened={abierto} onClose={onCerrar} size="xl" title={<Title order={3}>Comparar resultados</Title>}>
      {contexto && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Comparación del periodo actual frente al periodo anterior equivalente
          </Text>
          <FiltrosAplicados
            columnas={[
              { titulo: 'Periodo actual', valor: `${contexto.periodo} (${textoRango(contexto.rango)})` },
              { titulo: 'Periodo anterior', valor: textoRango(contexto.rangoAnterior) },
              { titulo: 'Canal', valor: contexto.canal },
            ]}
          />
          <ComparacionContenido contexto={contexto} />
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

function ComparacionContenido({ contexto }: { contexto: ContextoReporte }) {
  const actuales = indicadores(contexto.actual);
  const anteriores = indicadores(contexto.anterior);
  const rapida = actuales.filter((i) => i.clave === 'PEDIDOS' || i.clave === 'ENTREGADOS' || i.clave === 'CSAT');

  return (
    <>
      <div>
        <Text size="xs" fw={700} tt="uppercase" mb={6}>
          Lectura rápida
        </Text>
        <Group gap="xs">
          {rapida.map((i) => (
            <Badge key={i.clave} variant="light" color="orange" size="lg" tt="none">
              {i.etiqueta}: {i.texto}
            </Badge>
          ))}
        </Group>
      </div>
      <Table verticalSpacing="xs" striped>
        <Table.Thead bg="cloud.2">
          <Table.Tr>
            <Table.Th>Indicador</Table.Th>
            <Table.Th ta="right">Actual</Table.Th>
            <Table.Th ta="right">Anterior</Table.Th>
            <Table.Th ta="right">Variación</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {actuales.map((a, i) => (
            <Table.Tr key={a.clave}>
              <Table.Td>{a.etiqueta}</Table.Td>
              <Table.Td ta="right" fw={600}>
                {a.texto}
              </Table.Td>
              <Table.Td ta="right" c="dimmed">
                {anteriores[i].texto}
              </Table.Td>
              <Table.Td ta="right">{textoVariacion(a, anteriores[i])}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
