// Confirmación obligatoria para acciones irreversibles (stack-frontend.md 8.1):
// anular, aprobar/rechazar devolución, ejecutar reembolso, marcar reclamo atendido.
// El mensaje debe decir exactamente qué se va a hacer, nunca un "¿estás seguro?" genérico.
import type { ReactNode } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export interface ModalConfirmacionProps {
  abierto: boolean;
  titulo: string;
  /** Descripción explícita de la acción y su efecto. */
  mensaje: ReactNode;
  textoConfirmar: string;
  textoCancelar?: string;
  /** `red` para acciones destructivas. */
  colorConfirmar?: string;
  /** Mientras la operación está en curso: deshabilita el botón (evita doble envío). */
  procesando?: boolean;
  /** Deshabilita confirmar (ej. falta un campo obligatorio dentro de `children`). */
  confirmarDeshabilitado?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
  /** Campos adicionales: comentario, fundamento, etc. */
  children?: ReactNode;
  /** Ícono opcional junto al título (los modales del Figma lo llevan en un recuadro de color). */
  icono?: ReactNode;
}

export function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  textoCancelar = 'Cancelar',
  colorConfirmar,
  procesando = false,
  confirmarDeshabilitado = false,
  onConfirmar,
  onCerrar,
  children,
  icono,
}: ModalConfirmacionProps) {
  const textoTitulo = (
    <Text fw={700} size="lg">
      {titulo}
    </Text>
  );
  return (
    <Modal
      opened={abierto}
      onClose={procesando ? () => undefined : onCerrar}
      title={
        icono ? (
          <Group gap="md" wrap="nowrap">
            {icono}
            {textoTitulo}
          </Group>
        ) : (
          textoTitulo
        )
      }
      closeOnClickOutside={!procesando}
      closeOnEscape={!procesando}
    >
      <Stack>
        {typeof mensaje === 'string' ? <Text size="sm">{mensaje}</Text> : mensaje}
        {children}
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onCerrar} disabled={procesando}>
            {textoCancelar}
          </Button>
          <Button
            color={colorConfirmar}
            onClick={onConfirmar}
            loading={procesando}
            disabled={confirmarDeshabilitado}
          >
            {textoConfirmar}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
