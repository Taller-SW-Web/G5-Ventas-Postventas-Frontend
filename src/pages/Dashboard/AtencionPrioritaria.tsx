// Atención prioritaria (Mockup 01, 7.2): reclamos vencidos y por vencer, desde la bandeja 2.10.
// Devoluciones y cambios se sumarán cuando F3 tenga un listado general (2.4 hoy exige clienteId).
import { useNavigate } from 'react-router-dom';
import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import { EstadoCarga } from '@/components/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import { listarReclamos } from '@/services/reclamos';
import type { ReclamoResumen } from '@/types/reclamo';
import { ETIQUETA_MOTIVO, textoSlaCorto } from '../Reclamos/formato';

const MAXIMO = 5;

async function cargarPrioritarios(): Promise<ReclamoResumen[]> {
  // Los más antiguos primero: son los que vencieron (o vencen) antes
  const [vencidos, porVencer] = await Promise.all([
    listarReclamos({ sla: 'VENCIDO', orden: 'ANTIGUOS', tamano: MAXIMO }),
    listarReclamos({ sla: 'POR_VENCER', orden: 'ANTIGUOS', tamano: MAXIMO }),
  ]);
  return [...vencidos.contenido, ...porVencer.contenido].slice(0, MAXIMO);
}

export function AtencionPrioritaria() {
  const navigate = useNavigate();
  const consulta = useConsulta(cargarPrioritarios, []);

  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Group justify="space-between" mb="sm">
        <Title order={3}>Atención prioritaria</Title>
        <Button size="xs" variant="subtle" onClick={() => navigate('/admin/postventa/reclamos?sla=POR_VENCER')}>
          Ver todas
        </Button>
      </Group>
      <EstadoCarga
        cargando={consulta.cargando}
        error={consulta.error}
        datos={consulta.datos}
        onReintentar={consulta.recargar}
        mensajeVacio="No hay reclamos vencidos ni por vencer."
      >
        {(reclamos) => (
          <Stack gap="xs">
            {reclamos.map((r) => (
              <Group key={r.codigoSeguimiento} justify="space-between" wrap="nowrap" gap="sm">
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600}>
                    Reclamo {r.codigoSeguimiento}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {r.nombreConsumidor ?? '—'} · {ETIQUETA_MOTIVO[r.motivo]}
                  </Text>
                </Stack>
                <Group gap="xs" wrap="nowrap">
                  {r.estadoSla && (
                    <EstadoBadge
                      entidad="sla"
                      estado={r.estadoSla}
                      texto={textoSlaCorto(r.estadoSla, r.diasHabilesRestantes)}
                      size="sm"
                      tt="none"
                    />
                  )}
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => navigate(`/admin/postventa/reclamos?codigo=${r.codigoSeguimiento}`)}
                  >
                    Ver
                  </Button>
                </Group>
              </Group>
            ))}
          </Stack>
        )}
      </EstadoCarga>
    </Paper>
  );
}
