// Panel "Atención prioritaria" del Dashboard (Mockup 01, 7.2): muestra los casos más urgentes.
// La lista y la pantalla completa son las del Hub Postventa (Mockup 05, Joseph): una sola fuente para las dos.
// "Ver" abre esa pantalla filtrada por el tipo del caso (7.3); "Ver todas", sin filtro (7.4).
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Group, Paper, Stack, Table, Text, Title } from '@mantine/core';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import {
  ETIQUETA_SITUACION,
  ETIQUETA_TIPO_CASO,
  obtenerCasosPrioritarios,
  type CasosPrioritarios,
  type SituacionCaso,
  type TipoCaso,
} from '../AtencionPrioritaria/casosPrioritarios';
import { dia } from '../Reclamos/formato';

const RUTA_PRIORITARIOS = '/admin/postventa/prioritarios';
const MAXIMO = 5;
const TIPOS: TipoCaso[] = ['RECLAMO', 'DEVOLUCION', 'CAMBIO'];

/** Valor del filtro "Tipo" que entiende la pantalla de Atención prioritaria (?tipo=...). */
const FILTRO_POR_TIPO: Record<TipoCaso, string> = {
  RECLAMO: 'RECLAMOS',
  DEVOLUCION: 'DEVOLUCIONES',
  CAMBIO: 'CAMBIOS',
};

/** Mismos colores que la pantalla de Atención prioritaria. */
const COLOR_SITUACION: Record<SituacionCaso, string> = {
  VENCIDO: 'red',
  PROXIMO_A_VENCER: 'yellow',
  PENDIENTE_EVALUACION: 'yellow',
  EN_EVALUACION: 'signal',
};

function textoConteo(cantidad: number, tipo: TipoCaso): string {
  const singular = ETIQUETA_TIPO_CASO[tipo].toLowerCase();
  const plural = tipo === 'DEVOLUCION' ? 'devoluciones' : `${singular}s`;
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

export function AtencionPrioritaria() {
  const navigate = useNavigate();
  const consulta = useConsulta(obtenerCasosPrioritarios, []);

  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Group justify="space-between" align="flex-start" mb="xs" wrap="nowrap">
        <div>
          <Title order={3}>Atención prioritaria</Title>
          <Text size="sm" c="dimmed">
            Reclamos por SLA y expedientes de postventa pendientes
          </Text>
        </div>
        <Button size="xs" variant="subtle" onClick={() => navigate(RUTA_PRIORITARIOS)}>
          Ver todas →
        </Button>
      </Group>
      <EstadoCarga
        cargando={consulta.cargando}
        error={consulta.error}
        datos={consulta.datos}
        onReintentar={consulta.recargar}
        esVacio={(r: CasosPrioritarios) => r.casos.length === 0 && r.avisos.length === 0}
        mensajeVacio="No hay casos que requieran atención prioritaria."
      >
        {({ casos, avisos }: CasosPrioritarios) => (
          <Stack gap="sm">
            {/* Módulos que no respondieron: se muestra lo que sí llegó, sin romper el panel. */}
            {avisos.map((aviso) => (
              <Alert key={aviso} color="yellow" variant="light" p="xs">
                <Text size="xs">{aviso}</Text>
              </Alert>
            ))}
            <Group gap="xs">
              {TIPOS.map((t) => (
                <Badge key={t} variant="light" color="orange" tt="none">
                  {textoConteo(casos.filter((c) => c.tipo === t).length, t)}
                </Badge>
              ))}
            </Group>
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead bg="cloud.2">
                <Table.Tr>
                  <Table.Th>Código</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Fecha</Table.Th>
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
                      <Badge color={COLOR_SITUACION[c.situacion]} variant="light" tt="none" radius="xl" size="sm">
                        {ETIQUETA_SITUACION[c.situacion]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{dia(c.fecha)}</Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => navigate(`${RUTA_PRIORITARIOS}?tipo=${FILTRO_POR_TIPO[c.tipo]}`)}
                      >
                        Ver
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        )}
      </EstadoCarga>
    </Paper>
  );
}
