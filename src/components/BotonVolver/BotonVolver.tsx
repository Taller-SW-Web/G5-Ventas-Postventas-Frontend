// Flecha de regreso junto al título de una pantalla (Mockups 03, 04, 06-08). Solo cambia la pantalla consultada.
import { ActionIcon } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export function BotonVolver({ a, etiqueta }: { a: string; etiqueta: string }) {
  const navegar = useNavigate();
  return (
    <ActionIcon variant="default" size="lg" onClick={() => navegar(a)} aria-label={etiqueta}>
      <IconArrowLeft size={20} stroke={2} aria-hidden />
    </ActionIcon>
  );
}
