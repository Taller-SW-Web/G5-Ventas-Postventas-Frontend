import type { Puntuacion } from '@/types/calificacion';
import type { Canal } from '@/types/comun';

// Modelos de presentación del Mockup 09; no representan una respuesta de API.
export interface ContextoCalificaciones {
  /** Etiqueta del periodo activo, compartida por el panel y sus ventanas. */
  periodo: string;
  canal: Canal | 'TODOS';
}

export interface DistribucionCalificacion {
  puntuacion: Puntuacion;
  porcentaje: number;
}

export interface ResumenSatisfaccion {
  promedio: number | null;
  distribucion: readonly DistribucionCalificacion[];
}

export interface ComentarioCliente {
  pedidoId: string;
  /** Fecha ISO (AAAA-MM-DD); el componente la presenta sin convertir de zona horaria. */
  fecha: string;
  canal: Canal;
  puntuacion: Puntuacion;
  comentario: string;
}

/** El padre aplica el filtro y entrega los datos de esa misma selección. */
export interface FiltrosCalificacionesProps {
  contexto: ContextoCalificaciones;
  opcionesPeriodos: readonly string[];
  onCambiarContexto: (contexto: ContextoCalificaciones) => void;
}
