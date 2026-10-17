// "Comentarios recientes" del Mockup 09 (tabla de comentarios y ventana Comentarios de clientes).
// Corresponde a F5 — Johan (guía frontend, sección 12). Espacio reservado: Johan reemplaza este archivo.
import { Alert, Button, Group, Paper, Title } from '@mantine/core';

export function SeccionComentarios() {
  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Group justify="space-between" align="flex-start" mb="md">
        <Title order={3}>Comentarios recientes</Title>
        <Button variant="default" size="xs" disabled>
          Ver todos
        </Button>
      </Group>
      <Alert color="blue" variant="light" title="Todavía no disponible">
        Sección de F5 (comentarios de las encuestas). Se completará cuando exista la consulta de calificaciones en el
        contrato.
      </Alert>
    </Paper>
  );
}
