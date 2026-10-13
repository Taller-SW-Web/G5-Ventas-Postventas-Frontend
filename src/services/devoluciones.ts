// F3 — api-postventas.md 2.1 a 2.5 (Joseph)
import { apiPostventa } from './api';
import type {
  DevolucionDetalle,
  EvidenciaSubida,
  FiltrosDevoluciones,
  ListadoDevoluciones,
  RegistrarDevolucionRequest,
  RegistrarDevolucionResponse,
  ResolverDevolucionRequest,
  ResolverDevolucionResponse,
} from '@/types/devolucion';

/** 2.1 POST /api/v2/devoluciones/evidencias/upload (multipart) */
export async function subirEvidencia(archivo: File): Promise<EvidenciaSubida> {
  const formData = new FormData();
  formData.append('file', archivo);
  const { data } = await apiPostventa.post<EvidenciaSubida>(
    '/api/v2/devoluciones/evidencias/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

/** 2.2 POST /api/v2/devoluciones */
export async function registrarDevolucion(
  body: RegistrarDevolucionRequest,
): Promise<RegistrarDevolucionResponse> {
  const { data } = await apiPostventa.post<RegistrarDevolucionResponse>('/api/v2/devoluciones', body);
  return data;
}

/** 2.3 GET /api/v2/devoluciones/{devolucionId} — si está SOLICITADA pasa a EN_EVALUACION */
export async function obtenerDevolucion(devolucionId: string): Promise<DevolucionDetalle> {
  const { data } = await apiPostventa.get<DevolucionDetalle>(
    `/api/v2/devoluciones/${encodeURIComponent(devolucionId)}`,
  );
  return data;
}

/** 2.4 GET /api/v2/devoluciones (rol ADMIN_VENTAS) */
export async function listarDevoluciones(filtros: FiltrosDevoluciones): Promise<ListadoDevoluciones> {
  const { data } = await apiPostventa.get<ListadoDevoluciones>('/api/v2/devoluciones', {
    params: filtros,
  });
  return data;
}

/** 2.5 PATCH /api/v2/devoluciones/{devolucionId}/resolucion (rol ADMIN_VENTAS) */
export async function resolverDevolucion(
  devolucionId: string,
  body: ResolverDevolucionRequest,
): Promise<ResolverDevolucionResponse> {
  const { data } = await apiPostventa.patch<ResolverDevolucionResponse>(
    `/api/v2/devoluciones/${encodeURIComponent(devolucionId)}/resolucion`,
    body,
  );
  return data;
}
