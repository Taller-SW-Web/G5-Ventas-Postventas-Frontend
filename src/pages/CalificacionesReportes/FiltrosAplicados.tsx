// Recuadro "Periodo / Canal" que encabeza los modales de Reportes (Figma): muestra lo aplicado, no lo elegido.
import type { ReactNode } from 'react';
import { Box, SimpleGrid, Text } from '@mantine/core';

interface Props {
  columnas: { titulo: string; valor: string }[];
  nota?: ReactNode;
}

export function FiltrosAplicados({ columnas, nota }: Props) {
  return (
    <Box bg="cloud.2" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
      <SimpleGrid cols={{ base: 1, sm: columnas.length }}>
        {columnas.map((c) => (
          <div key={c.titulo}>
            <Text size="xs" c="dimmed">
              {c.titulo}
            </Text>
            <Text size="sm" fw={600}>
              {c.valor}
            </Text>
          </div>
        ))}
      </SimpleGrid>
      {nota && (
        <Text size="xs" c="dimmed" mt="xs">
          {nota}
        </Text>
      )}
    </Box>
  );
}
