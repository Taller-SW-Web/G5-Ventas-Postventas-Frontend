// F1 — api-ventas.md 1.3, 1.4 y acciones del Gestor sobre el pedido (Michael)
import { apiVentas } from './api';
import type {
  AccionPedidoResponse,
  FiltrosPedidos,
  ListadoPedidos,
  PedidoDetalle,
} from '@/types/pedido';

/** 1.4 GET /api/v1/pedidos (rol ADMIN_VENTAS). Sin clienteId lista todos los pedidos. */
export async function listarPedidos(filtros: FiltrosPedidos): Promise<ListadoPedidos> {
  const { data } = await apiVentas.get<ListadoPedidos>('/api/v1/pedidos', { params: filtros });
  return data;
}

/** Cantidad de pedidos con esos filtros (usa totalElementos de 1.4 con una página de 1). */
export async function contarPedidos(filtros: FiltrosPedidos): Promise<number> {
  const { totalElementos } = await listarPedidos({ ...filtros, pagina: 0, tamano: 1 });
  return totalElementos;
}

/** 1.3 GET /api/v1/pedidos/{pedidoId} */
export async function obtenerPedido(pedidoId: string): Promise<PedidoDetalle> {
  const { data } = await apiVentas.get<PedidoDetalle>(
    `/api/v1/pedidos/${encodeURIComponent(pedidoId)}`,
  );
  return data;
}

/** "Pasar a preparación": PAGADO → EN_PREPARACION. */
export async function iniciarPreparacion(pedidoId: string): Promise<AccionPedidoResponse> {
  const { data } = await apiVentas.post<AccionPedidoResponse>(
    `/api/v1/pedidos/${encodeURIComponent(pedidoId)}/preparacion`,
  );
  return data;
}

/** "Paquete sellado": crea el despacho en Despacho (G2). El pedido pasa a DESPACHADO cuando G2 lo recoge. */
export async function sellarPaquete(pedidoId: string): Promise<AccionPedidoResponse> {
  const { data } = await apiVentas.post<AccionPedidoResponse>(
    `/api/v1/pedidos/${encodeURIComponent(pedidoId)}/despacho`,
  );
  return data;
}

/**
 * Detalle (1.5) de varios pedidos a la vez, para completar bandejas cuyo endpoint no trae cliente, canal ni
 * estado del pedido (1.8 anulaciones pendientes, 2.6b reembolsos). Un pedido que no se pudo leer se omite.
 */
export async function detallesDePedidos(codigos: string[]): Promise<Map<string, PedidoDetalle>> {
  const unicos = [...new Set(codigos)];
  const detalles = await Promise.all(unicos.map((c) => obtenerPedido(c).catch(() => null)));
  return new Map(detalles.filter((d): d is PedidoDetalle => d !== null).map((d) => [d.pedidoId, d]));
}
