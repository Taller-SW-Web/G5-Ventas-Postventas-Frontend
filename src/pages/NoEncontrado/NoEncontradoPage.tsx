import { Link } from 'react-router-dom';
import { Button, Center, Stack, Text, Title } from '@mantine/core';

export function NoEncontradoPage() {
  return (
    <Center mih="60vh" p="md">
      <Stack align="center" gap="sm" ta="center">
        <Title order={1}>Página no encontrada</Title>
        <Text c="dimmed">La dirección que buscas no existe.</Text>
        <Button component={Link} to="/admin/dashboard">
          Ir al Dashboard
        </Button>
      </Stack>
    </Center>
  );
}
