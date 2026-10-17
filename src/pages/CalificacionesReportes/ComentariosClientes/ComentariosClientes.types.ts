import type { ComentarioCliente, FiltrosCalificacionesProps } from '../calificaciones.types';

import type { ResultadoConsulta } from '@/hooks/useConsulta';

export interface ComentariosClientesProps extends FiltrosCalificacionesProps {
  abierto: boolean;
  estado?: ResultadoConsulta<unknown>;
  comentarios: readonly ComentarioCliente[];
  onCerrar: () => void;
  pagina?: number;
  totalPaginas?: number;
  onCambiarPagina?: (pagina: number) => void;
}

