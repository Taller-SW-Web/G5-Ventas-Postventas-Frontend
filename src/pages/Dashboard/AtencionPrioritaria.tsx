// Panel "Atención prioritaria" del Dashboard (Mockup 01, 7.2): muestra los casos más urgentes.
// "Ver" abre la pantalla Atención prioritaria filtrada por el tipo del caso, con su detalle abierto (7.3);
// "Ver todas" la abre sin filtro (7.4). La lista se arma en pages/AtencionPrioritaria/casos.ts.
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Group, Paper, Stack, Table, Text, Title } from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import {
  ETIQUETA_SITUACION,
  ETIQUETA_TIPO_CASO,
  RUTA_ATENCION_PRIORITARIA,
  cargarCasosPrioritarios,
  contarPorTipo,
  textoConteo,
  type ResultadoCasos,
} from '../AtencionPrioritaria/casos';
import { dia } from '../Reclamos/formato';
import type { TipoCaso } from '@/types/reclamo';

const MAXIMO = 5;
const TIPOS: TipoCaso[] = ['RECLAMO', 'DEVOLUCION', 'CAMBIO'];

export function AtencionPrioritaria() {
  const navigate = useNavigate();
  const consulta = useConsulta(cargarCasosPrioritarios, []);

  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Group justify="space-between" align="flex-start" mb="xs" wrap="nowrap">
        <div>
          <Title order={3}>Atención prioritaria</Title>
          <Text size="sm" c="dimmed">
            Reclamos por SLA y expedientes de postventa pendientes
          </Text>
        </div>
        <Button size="xs" variant="subtle" onClick={() => navigate(RUTA_ATENCION_PRIORITARIA)}>
          Ver todas →
        </Button>
      </Group>
      <EstadoCarga
        cargando={consulta.cargando}
        error={consulta.error}
        datos={consulta.datos}
        onReintentar={consulta.recargar}
        esVacio={(r: ResultadoCasos) => r.casos.length === 0}
        mensajeVacio="No hay casos que requieran atención prioritaria."
      >
        {({ casos }) => {
          const conteo = contarPorTipo(casos);
          return (
            <Stack gap="sm">
              <Group gap="xs">
                {TIPOS.map((t) => (
                  <Badge key={t} variant="light" color="orange" tt="none">
                    {textoConteo(conteo[t], t)}
                  </Badge>
                ))}
              </Group>
              <Table verticalSpacing="xs" highlightOnHover>
                <Table.Thead bg="cloud.2">
                  <Table.Tr>
                    <Table.Th>Código</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Fecha límite</Table.Th>
                    <Table.Th>Acción</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {casos.slice(0, MAXIMO).map((c) => (
                    <Table.Tr key={c.codigo}>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {c.codigo}
                        </Text>
                      </Table.Td>
                      <Table.Td>{ETIQUETA_TIPO_CASO[c.tipo]}</Table.Td>
                      <Table.Td>
                        <EstadoBadge
                          entidad="situacion"
                          estado={c.situacion}
                          texto={ETIQUETA_SITUACION[c.situacion]}
                          size="sm"
                          tt="none"
                        />
                      </Table.Td>
                      <Table.Td>{c.fechaLimite ? dia(c.fechaLimite.slice(0, 10)) : '—'}</Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="default"
                          onClick={() =>
                            navigate(
                              `${RUTA_ATENCION_PRIORITARIA}?tipo=${c.tipo}&codigo=${encodeURIComponent(c.codigo)}`,
                            )
                          }
                        >
                          Ver
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          );
        }}
      </EstadoCarga>
    </Paper>
  );
}
