// Icono en recuadro de color suave de las tarjetas de resumen (Mockups 02 y 03): solo decorativo, el texto
// de la tarjeta es el que informa.
import { ThemeIcon } from '@mantine/core';
import type { Icon } from '@tabler/icons-react';

export function IconoTarjeta({ icono: Icono, color, tamano = 40 }: { icono: Icon; color: string; tamano?: number }) {
  return (
    <ThemeIcon
      variant="light"
      color={color}
      c={color === 'volt' ? 'volt.9' : undefined}
      size={tamano}
      radius="md"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <Icono size={20} stroke={2} />
    </ThemeIcon>
  );
}
