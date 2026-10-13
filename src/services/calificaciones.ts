// F5 — api-postventas.md 2.7 (Johan)
import { apiPostventa } from './api';
import type { RegistrarCsatRequest } from '@/types/calificacion';

/**
 * 2.7 POST /api/v2/csat — lo usa la vista pública de encuesta, no el Gestor.
 * El portal del Gestor solo consulta resultados (vía métricas 2.12 por ahora).
 */
export async function registrarCsat(body: RegistrarCsatRequest): Promise<void> {
  await apiPostventa.post('/api/v2/csat', body);
}
