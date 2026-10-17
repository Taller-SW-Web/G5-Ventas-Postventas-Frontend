import { Button, Group, Paper, Table, Text, Title } from '@mantine/core';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useCalificaciones } from './ProveedorCalificaciones';
import { comentariosClientes } from './consultaCalificaciones';
import { etiquetaCanal, fechaCorta } from './reportes';

export function SeccionComentarios() {
  const { consulta, abrir } = useCalificaciones();
  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Group justify="space-between" mb="md">
        <Title order={3}>Comentarios recientes</Title>
        <Button variant="default" size="xs" onClick={() => abrir('comentarios')}>Ver todos</Button>
      </Group>
      <EstadoCarga {...consulta} onReintentar={consulta.recargar}
        mensajeVacio="No hay respuestas para este periodo y canal.">
        {(datos) => (
          <Table.ScrollContainer minWidth={540}>
            <Table verticalSpacing="sm">
              <Table.Thead><Table.Tr>
                <Table.Th>Fecha</Table.Th><Table.Th>Canal</Table.Th><Table.Th>Puntuación</Table.Th>
                <Table.Th ta="center">Comentario</Table.Th><Table.Th>Acción</Table.Th>
              </Table.Tr></Table.Thead>
              <Table.Tbody>{comentariosClientes(datos).map((fila) => (
                <Table.Tr key={fila.pedidoId}>
                  <Table.Td>{fechaCorta(fila.fecha)}</Table.Td>
                  <Table.Td>{etiquetaCanal(fila.canal)}</Table.Td>
                  <Table.Td><Text size="sm" c={fila.puntuacion >= 4 ? 'green' : fila.puntuacion === 3 ? 'yellow.9' : 'red'}>
                    {fila.puntuacion} ★
                  </Text></Table.Td>
                  <Table.Td ta="center">{fila.comentario}</Table.Td>
                  <Table.Td><Button variant="default" size="xs" onClick={() => abrir('comentarios')}>Ver</Button></Table.Td>
                </Table.Tr>
              ))}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </EstadoCarga>
    </Paper>
  );
}
