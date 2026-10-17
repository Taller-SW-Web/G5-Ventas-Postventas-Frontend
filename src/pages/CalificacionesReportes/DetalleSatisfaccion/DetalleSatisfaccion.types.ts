import type { FiltrosCalificacionesProps, ResumenSatisfaccion } from '../calificaciones.types';

export interface DetalleSatisfaccionProps extends FiltrosCalificacionesProps {
  abierto: boolean;
  resumen: ResumenSatisfaccion;
  onCerrar: () => void;
}

