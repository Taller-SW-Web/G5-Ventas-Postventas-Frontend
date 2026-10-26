// F2 — api-ventas.md 1.7 a 1.9 (Luis Arroyo)
import { apiVentas } from './api';
import type { ParametrosPaginacion } from '@/types/comun';
import type {
  FiltrosListadoAnulaciones,
  ListadoAnulacionesPendientes,
  ResolverAnulacionRequest,
  ResolverAnulacionResponse,
  SolicitudAnulacionRequest,
  SolicitudAnulacionResponse,
} from '@/types/pedido';

/** 1.7 POST /api/v1/pedidos/{pedidoId}/anulaciones — 200 directa, 202 si requiere autorización */
export async function solicitarAnulacion(
  pedidoId: string,
  body: SolicitudAnulacionRequest,
): Promise<SolicitudAnulacionResponse> {
  const { data } = await apiVentas.post<SolicitudAnulacionResponse>(
    `/api/v1/pedidos/${encodeURIComponent(pedidoId)}/anulaciones`,
    body,
  );
  return data;
}

export interface ParametrosListarAnulaciones extends ParametrosPaginacion, FiltrosListadoAnulaciones {}

/** 1.8 GET /api/v1/pedidos/anulaciones (rol ADMIN_VENTAS) */
export async function listarAnulaciones(
  params: ParametrosListarAnulaciones = {},
): Promise<ListadoAnulacionesPendientes> {
  const { data } = await apiVentas.get<ListadoAnulacionesPendientes>(
    '/api/v1/pedidos/anulaciones',
    { params },
  );
  return data;
}

/** Retrocompatibilidad */
export const listarAnulacionesPendientes = listarAnulaciones;

/** 1.9 PATCH /api/v1/pedidos/{pedidoId}/anulaciones/{anulacionId} (rol ADMIN_VENTAS) */
export async function resolverAnulacion(
  pedidoId: string,
  anulacionId: string,
  body: ResolverAnulacionRequest,
): Promise<ResolverAnulacionResponse> {
  const { data } = await apiVentas.patch<ResolverAnulacionResponse>(
    `/api/v1/pedidos/${encodeURIComponent(pedidoId)}/anulaciones/${encodeURIComponent(anulacionId)}`,
    body,
  );
  return data;
}
