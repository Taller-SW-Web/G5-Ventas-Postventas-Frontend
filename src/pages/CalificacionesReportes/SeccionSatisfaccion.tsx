// "Satisfacción del cliente" del Mockup 09 (distribución por estrellas, Detalle CSAT y vista Satisfacción).
// Corresponde a F5 — Johan (guía frontend, sección 12). Espacio reservado: Johan reemplaza este archivo.
// Necesita un endpoint de consulta de calificaciones (2.7 solo registra, POST).
import { Alert, Button, Group, Paper, Text, Title } from '@mantine/core';

export function SeccionSatisfaccion() {
  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={3}>Satisfacción del cliente</Title>
          <Text size="sm" c="dimmed">
            Distribución de calificaciones de 1 a 5
          </Text>
        </div>
        <Button variant="default" size="xs" disabled>
          Ver detalle
        </Button>
      </Group>
      <Alert color="blue" variant="light" title="Todavía no disponible">
        Sección de F5 (calificaciones). Se completará cuando exista la consulta de calificaciones en el contrato.
      </Alert>
    </Paper>
  );
}
