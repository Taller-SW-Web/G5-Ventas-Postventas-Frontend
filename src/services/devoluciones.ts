// F3 — api-postventas.md 2.1 a 2.5b (Joseph)
import { apiPostventa } from './api';
import { listarPedidos, obtenerPedido } from './pedidos';
import type {
  ConfirmarRecepcionRequest,
  ConfirmarRecepcionResponse,
  DevolucionDetalle,
  EvidenciaSubida,
  FiltrosDevoluciones,
  DevolucionResumen,
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

/** 2.4 GET /api/v2/devoluciones (rol ADMIN_VENTAS). Sin clienteId lista todos los expedientes. */
export async function listarDevoluciones(filtros: FiltrosDevoluciones): Promise<ListadoDevoluciones> {
  if (filtros.clienteId) {
    const { data } = await apiPostventa.get<ListadoDevoluciones>('/api/v2/devoluciones', {
      params: filtros,
    });
    return data;
  }
  return listarDevolucionesDeTodos(filtros);
}

/*
 * PROVISIONAL hasta desplegar el backend con clienteId opcional en 2.4 (hoy responde 400 "Falta el parámetro
 * clienteId"). Una devolución solo existe sobre un pedido ENTREGADO: se toman los clientes de esos pedidos (1.4 y
 * 1.5), se pide 2.4 por cada cliente y se filtra, ordena y pagina aquí. Se cachea 1 minuto para el Hub.
 */
let cacheClientes: { cuando: number; ids: Promise<string[]> } | null = null;

function clientesConEntregas(): Promise<string[]> {
  if (cacheClientes && Date.now() - cacheClientes.cuando < 60_000) return cacheClientes.ids;
  const ids = (async () => {
    const codigos: string[] = [];
    for (let pagina = 0, totalPaginas = 1; pagina < totalPaginas; pagina++) {
      const r = await listarPedidos({ estado: 'ENTREGADO', pagina, tamano: 50 });
      codigos.push(...r.contenido.map((p) => p.pedidoId));
      totalPaginas = r.totalPaginas;
    }
    const detalles = await Promise.all(codigos.map((c) => obtenerPedido(c)));
    return [...new Set(detalles.map((d) => d.contacto?.clienteId).filter((id): id is string => Boolean(id)))];
  })();
  cacheClientes = { cuando: Date.now(), ids };
  ids.catch(() => {
    cacheClientes = null;
  });
  return ids;
}

async function listarDevolucionesDeTodos(filtros: FiltrosDevoluciones): Promise<ListadoDevoluciones> {
  const { estado, tipo, buscar, desde, hasta, orden, pagina = 0, tamano = 10 } = filtros;
  const clientes = await clientesConEntregas();
  const listas = await Promise.all(
    clientes.map((clienteId) =>
      apiPostventa
        .get<ListadoDevoluciones>('/api/v2/devoluciones', { params: { clienteId, estado, tipo, pagina: 0, tamano: 100 } })
        .then((r) => r.data.contenido),
    ),
  );
  const texto = buscar?.trim().toUpperCase();
  const dia = (fecha: string) => fecha.slice(0, 10);
  let todas: DevolucionResumen[] = listas.flat().filter(
    (d) =>
      (!texto || d.devolucionId.toUpperCase() === texto || d.pedidoId.toUpperCase() === texto) &&
      (!desde || dia(d.fechaRegistro) >= desde) &&
      (!hasta || dia(d.fechaRegistro) <= hasta),
  );
  todas = todas.sort((a, b) =>
    orden === 'ANTIGUOS' ? a.fechaRegistro.localeCompare(b.fechaRegistro) : b.fechaRegistro.localeCompare(a.fechaRegistro),
  );
  return {
    clienteId: null,
    contenido: todas.slice(pagina * tamano, (pagina + 1) * tamano),
    pagina,
    totalPaginas: Math.ceil(todas.length / tamano),
    totalElementos: todas.length,
  };
}

/** Cantidad de expedientes con esos filtros (usa totalElementos de 2.4 con una página de 1). */
export async function contarDevoluciones(filtros: FiltrosDevoluciones): Promise<number> {
  const { totalElementos } = await listarDevoluciones({ ...filtros, pagina: 0, tamano: 1 });
  return totalElementos;
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

/** 2.5b PATCH /api/v2/devoluciones/{devolucionId}/recepcion (rol ADMIN_VENTAS). Recién aquí se reintegra stock. */
export async function confirmarRecepcion(
  devolucionId: string,
  body: ConfirmarRecepcionRequest,
): Promise<ConfirmarRecepcionResponse> {
  const { data } = await apiPostventa.patch<ConfirmarRecepcionResponse>(
    `/api/v2/devoluciones/${encodeURIComponent(devolucionId)}/recepcion`,
    body,
  );
  return data;
}
