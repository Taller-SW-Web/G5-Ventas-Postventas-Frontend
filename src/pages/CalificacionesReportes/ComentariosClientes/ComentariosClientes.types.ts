import type { ComentarioCliente, FiltrosCalificacionesProps } from '../calificaciones.types';

export interface ComentariosClientesProps extends FiltrosCalificacionesProps {
  abierto: boolean;
  comentarios: readonly ComentarioCliente[];
  onCerrar: () => void;
}

