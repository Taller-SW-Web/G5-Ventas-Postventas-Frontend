// F5 — api-postventas.md 2.7 (Johan)
import { apiPostventa } from './api';
import type { RegistrarCsatRequest } from '@/types/calificacion';
import type { FiltrosCalificaciones, ListadoCalificaciones } from '@/types/consultaCalificaciones';

/**
 * 2.7 POST /api/v2/csat — lo usa la vista pública de encuesta, no el Gestor.
 * El portal del Gestor consulta resultados mediante listarCalificaciones.
 */
export async function registrarCsat(body: RegistrarCsatRequest): Promise<void> {
  await apiPostventa.post('/api/v2/csat', body);
}

/** Consulta del Gestor: el resumen abarca todo el filtro, aunque la lista esté paginada. */
export async function listarCalificaciones(filtros: FiltrosCalificaciones): Promise<ListadoCalificaciones> {
  const { data } = await apiPostventa.get<ListadoCalificaciones>('/api/v2/csat', { params: filtros });
  return data;
}
