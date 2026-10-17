// F4 — api-postventas.md 2.6 (Luis Alejandro)
import { apiPostventa } from './api';
import type { DetalleReembolsoResponse, FiltrosReembolsos, ListadoReembolsosResponse, ReembolsoResponse, SolicitudReembolsoRequest } from '@/types/reembolso';

/** Genera la clave UNA vez por intento de envío; reutilizarla en reintentos (RNF-08). */
export function nuevaClaveIdempotencia(): string {
  return crypto.randomUUID();
}

/** 2.6 POST /api/v2/reembolsos — idempotente por X-Idempotency-Key */
export async function procesarReembolso(
  body: SolicitudReembolsoRequest,
  claveIdempotencia: string,
): Promise<ReembolsoResponse> {
  const { data } = await apiPostventa.post<ReembolsoResponse>('/api/v2/reembolsos', body, {
    headers: { 'X-Idempotency-Key': claveIdempotencia },
  });
  return data;
}

export async function listarReembolsos(filtros: FiltrosReembolsos): Promise<ListadoReembolsosResponse> {
  const { data } = await apiPostventa.get<ListadoReembolsosResponse>('/api/v2/reembolsos', { params: filtros });
  return data;
}

export async function obtenerDetalleReembolso(reembolsoId: string): Promise<DetalleReembolsoResponse> {
  const { data } = await apiPostventa.get<DetalleReembolsoResponse>(`/api/v2/reembolsos/${reembolsoId}`);
  return data;
}
