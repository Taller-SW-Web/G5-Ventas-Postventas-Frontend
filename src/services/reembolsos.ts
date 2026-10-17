// F4 — api-postventas.md 2.6 y 2.6b (Luis Alejandro)
import { apiPostventa } from './api';
import type {
  DetalleReembolsoResponse,
  FiltrosReembolsos,
  ListadoReembolsos,
  ReembolsoResponse,
  SolicitudReembolsoRequest,
} from '@/types/reembolso';

/** Genera la clave una vez por intento; debe reutilizarse en reintentos (RNF-08). */
export function nuevaClaveIdempotencia(): string {
  return crypto.randomUUID();
}

/** 2.6 POST /api/v2/reembolsos — idempotente por X-Idempotency-Key. */
export async function procesarReembolso(
  body: SolicitudReembolsoRequest,
  claveIdempotencia: string,
): Promise<ReembolsoResponse> {
  const { data } = await apiPostventa.post<ReembolsoResponse>('/api/v2/reembolsos', body, {
    headers: { 'X-Idempotency-Key': claveIdempotencia },
  });
  return data;
}

/** 2.6b GET /api/v2/reembolsos: bandeja paginada, sin consultar M1 por cada fila. */
export async function listarReembolsos(filtros: FiltrosReembolsos = {}): Promise<ListadoReembolsos> {
  const { data } = await apiPostventa.get<ListadoReembolsos>('/api/v2/reembolsos', { params: filtros });
  return data;
}

/** 2.6c GET /api/v2/reembolsos/{id}: detalle puntual enriquecido con M1. */
export async function obtenerDetalleReembolso(reembolsoId: string): Promise<DetalleReembolsoResponse> {
  const { data } = await apiPostventa.get<DetalleReembolsoResponse>(`/api/v2/reembolsos/${reembolsoId}`);
  return data;
}
