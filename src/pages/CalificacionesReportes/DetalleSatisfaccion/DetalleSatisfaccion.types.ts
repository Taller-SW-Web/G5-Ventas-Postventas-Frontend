import type { FiltrosCalificacionesProps, ResumenSatisfaccion } from '../calificaciones.types';

import type { ResultadoConsulta } from '@/hooks/useConsulta';

export interface DetalleSatisfaccionProps extends FiltrosCalificacionesProps {
  abierto: boolean;
  estado?: ResultadoConsulta<unknown>;
  resumen: ResumenSatisfaccion;
  onCerrar: () => void;
}

