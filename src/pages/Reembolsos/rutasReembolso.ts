// Enlaces entre Reembolsos (Mockup 08, 9.6), el pedido de M1 y el expediente que originó el reembolso.
// Cada pantalla destino lee estos parámetros para abrir el caso concreto, no solo su bandeja.
import type { OrigenReembolso } from '@/types/reembolso';

/** Detalle del pedido (Mockup 03). */
export function rutaPedido(pedidoId: string): string {
  return `/admin/pedidos/${encodeURIComponent(pedidoId)}`;
}

/**
 * Expediente que originó el reembolso. Devolución: Mockup 06 con ?expediente=. Anulación: la bandeja de F2 buscando
 * el pedido y con la solicitud seleccionada (?buscar=&solicitud=).
 */
export function rutaExpedienteOrigen(origen: OrigenReembolso, origenId: string, pedidoId: string): string {
  if (origen === 'DEVOLUCION') {
    return `/admin/postventa/devoluciones?${new URLSearchParams({ expediente: origenId })}`;
  }
  return `/admin/anulaciones?${new URLSearchParams({ buscar: pedidoId, solicitud: origenId })}`;
}

/** Un reembolso concreto en la bandeja de F4 (por ejemplo, desde su devolución). */
export function rutaReembolso(reembolsoId: string): string {
  return `/admin/postventa/reembolsos?${new URLSearchParams({ reembolso: reembolsoId })}`;
}
