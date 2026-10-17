// Piezas compartidas por los modales del Mockup 06.
import { Center } from '@mantine/core';
import iconoCheck from '@/assets/devoluciones/check.svg';
import iconoRechazo from '@/assets/devoluciones/rechazo.svg';
import { ApiError } from '@/services/api';

export function IconoModal({ tipo }: { tipo: 'check' | 'rechazo' }) {
  return (
    <Center bg={tipo === 'check' ? 'volt.2' : 'red.1'} w={46} h={46} style={{ borderRadius: 12, flexShrink: 0 }}>
      <img src={tipo === 'check' ? iconoCheck : iconoRechazo} width={24} height={24} alt="" />
    </Center>
  );
}

export function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.noImplementado) return 'Esta acción todavía no está disponible en el servidor.';
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}
