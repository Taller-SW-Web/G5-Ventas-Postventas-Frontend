// F1 — api-ventas.md 1.3, 1.4 (Michael)
import { apiVentas } from './api';
import type { FiltrosPedidos, ListadoPedidos, PedidoDetalle } from '@/types/pedido';

/** 1.4 GET /api/v1/pedidos (rol ADMIN_VENTAS) */
export async function listarPedidos(filtros: FiltrosPedidos): Promise<ListadoPedidos> {
  const { data } = await apiVentas.get<ListadoPedidos>('/api/v1/pedidos', { params: filtros });
  return data;
}

/** 1.3 GET /api/v1/pedidos/{pedidoId} */
export async function obtenerPedido(pedidoId: string): Promise<PedidoDetalle> {
  const { data } = await apiVentas.get<PedidoDetalle>(
    `/api/v1/pedidos/${encodeURIComponent(pedidoId)}`,
  );
  return data;
}
