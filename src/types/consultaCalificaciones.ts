import type { Canal } from './comun';
import type { Puntuacion } from './calificacion';

/** GET /api/v2/csat: nombres de campos de ListadoCalificacionesResponse en M2. */
export interface FiltrosCalificaciones {
  canal?: Canal;
  desde?: string;
  hasta?: string;
  pagina?: number;
  tamano?: number;
}

export interface ListadoCalificaciones {
  contenido: {
    pedidoId: string;
    puntaje: Puntuacion;
    comentario: string | null;
    canal: Canal;
    fecha: string;
  }[];
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
  resumen: {
    total: number;
    promedio: number | null;
    distribucion: Record<Puntuacion, number>;
  };
}
