// Contrato M2 — api-postventas.md 2.7 (F5)
import type { Canal } from './comun';

/** Marketplace solo envía 1, 3 o 5 (acuerdo H-04). */
export type Puntuacion = 1 | 2 | 3 | 4 | 5;

/** 2.7 POST /api/v2/csat — lo llama el canal; el Gestor solo consulta resultados. */
export interface RegistrarCsatRequest {
  pedidoId: string;
  clienteId: string;
  canal: Canal;
  puntuacion: Puntuacion;
  comentario?: string;
}
