// F6 — api-postventas.md 2.8 a 2.12 (Fabrizio)
import { apiPostventa } from './api';
import type {
  FiltrosMetricas,
  FiltrosReclamos,
  ListadoReclamos,
  MetricasDashboard,
  ReclamoDetalle,
  RegistrarReclamoRequest,
  RegistrarReclamoResponse,
  ResponderReclamoRequest,
  ResponderReclamoResponse,
} from '@/types/reclamo';

/** 2.8 POST /api/v2/reclamos — normalmente desde el canal, no desde el Gestor */
export async function registrarReclamo(
  body: RegistrarReclamoRequest,
): Promise<RegistrarReclamoResponse> {
  const { data } = await apiPostventa.post<RegistrarReclamoResponse>('/api/v2/reclamos', body);
  return data;
}

/** 2.9 GET /api/v2/reclamos/{codigoSeguimiento} */
export async function obtenerReclamo(codigoSeguimiento: string): Promise<ReclamoDetalle> {
  const { data } = await apiPostventa.get<ReclamoDetalle>(
    `/api/v2/reclamos/${encodeURIComponent(codigoSeguimiento)}`,
  );
  return data;
}

/** 2.10 GET /api/v2/reclamos (rol ADMIN_VENTAS) */
export async function listarReclamos(filtros: FiltrosReclamos = {}): Promise<ListadoReclamos> {
  const { data } = await apiPostventa.get<ListadoReclamos>('/api/v2/reclamos', { params: filtros });
  return data;
}

/** 2.11 PATCH /api/v2/reclamos/{reclamoId}/respuesta (rol ADMIN_VENTAS) */
export async function responderReclamo(
  reclamoId: string,
  body: ResponderReclamoRequest,
): Promise<ResponderReclamoResponse> {
  const { data } = await apiPostventa.patch<ResponderReclamoResponse>(
    `/api/v2/reclamos/${encodeURIComponent(reclamoId)}/respuesta`,
    body,
  );
  return data;
}

/** 2.12 GET /api/v2/dashboard/metricas — Dashboard (01) y Reportes (09) */
export async function obtenerMetricas(filtros: FiltrosMetricas): Promise<MetricasDashboard> {
  const { data } = await apiPostventa.get<MetricasDashboard>('/api/v2/dashboard/metricas', {
    params: filtros,
  });
  return data;
}
