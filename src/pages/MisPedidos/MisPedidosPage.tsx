// Pantalla de consulta de compras para el comprador autenticado (rol CLIENTE).
// Consume GET /api/v1/pedidos/me (api-ventas.md 1.4b).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { cerrarSesion, sesionActual } from '@/services/auth';
import { listarMisPedidos } from '@/services/pedidos';
import type { PedidoResumen } from '@/types/pedido';

const COLORES_ESTADO: Record<string, string> = {
  CREADO: 'gray',
  PAGADO: 'blue',
  EN_PREPARACION: 'yellow',
  DESPACHADO: 'cyan',
  EN_CAMINO: 'indigo',
  ENTREGADO: 'green',
  ANULADO: 'red',
};

export function MisPedidosPage() {
  const navegar = useNavigate();
  const sesion = sesionActual();

  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const respuesta = await listarMisPedidos();
        setPedidos(respuesta.contenido || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar tus pedidos. Asegúrate de tener una sesión activa.',
        );
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  function handleCerrarSesion() {
    cerrarSesion();
    navegar('/ingresar', { replace: true });
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Cabecera de la vista del cliente */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="blue.9">Mis Pedidos</Title>
            <Text size="sm" c="dimmed">
              Historial de tus compras realizadas en la plataforma (Usuario: {sesion.usuarioId || 'Cliente'})
            </Text>
          </div>
          <Button variant="light" color="red" size="xs" onClick={handleCerrarSesion}>
            Cerrar sesión
          </Button>
        </Group>

        {error && (
          <Alert color="red" title="Error al consultar pedidos">
            {error}
          </Alert>
        )}

        {cargando ? (
          <Paper p="xl" withBorder ta="center">
            <Loader size="md" />
            <Text size="sm" c="dimmed" mt="xs">
              Consultando tus pedidos en el servidor de Ventas...
            </Text>
          </Paper>
        ) : pedidos.length === 0 ? (
          <Paper p="xl" withBorder ta="center" radius="md">
            <Text fw={500} size="lg">
              No tienes pedidos registrados
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
              Cuando realices compras en Marketplace, Chatbot o Retail, tus órdenes aparecerán aquí.
            </Text>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {pedidos.map((p) => {
              const colorBadge = COLORES_ESTADO[p.estado] || 'gray';
              const fecha = p.fechaCreacion
                ? new Date(p.fechaCreacion).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—';

              return (
                <Card key={p.pedidoId} withBorder shadow="sm" radius="md" p="md">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={600} size="md" c="blue.8">
                        {p.pedidoId}
                      </Text>
                      <Badge color={colorBadge} variant="light">
                        {p.estado}
                      </Badge>
                    </Group>

                    <Text size="xs" c="dimmed">
                      Fecha: {fecha}
                    </Text>

                    <Group justify="space-between" mt="sm">
                      <Text size="sm">Canal: <b>{p.canal}</b></Text>
                      <Text fw={700} size="md" c="dark.4">
                        S/ {Number(p.total).toFixed(2)}
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
