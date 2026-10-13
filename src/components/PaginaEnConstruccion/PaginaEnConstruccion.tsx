// Marcador temporal de las pantallas de Fase 0. Cada responsable lo reemplaza por su pantalla.
import { Alert, Stack, Text, Title } from '@mantine/core';

interface PaginaEnConstruccionProps {
  titulo: string;
  mockup: string;
  funcionalidad: string;
  responsable: string;
  endpoints: string;
}

export function PaginaEnConstruccion({
  titulo,
  mockup,
  funcionalidad,
  responsable,
  endpoints,
}: PaginaEnConstruccionProps) {
  return (
    <Stack>
      <Title order={1}>{titulo}</Title>
      <Alert color="orange" title="Pantalla pendiente">
        <Text size="sm">
          {mockup} · {funcionalidad} · Responsable: {responsable}
        </Text>
        <Text size="sm">Endpoints: {endpoints}</Text>
      </Alert>
    </Stack>
  );
}
