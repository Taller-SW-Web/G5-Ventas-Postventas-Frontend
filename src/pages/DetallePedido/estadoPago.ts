// Estado del pago del Detalle del pedido (bloque "Pago"). Desde 2026-11-04 M1 lo envía en 1.3 (pago.estado) y es
// independiente del estado del pedido: un pedido ANULADO puede tener el cobro CONFIRMADO si la pasarela lo confirmó
// después de la anulación (api-ventas.md 1.2). El reembolso es otro dato (M2): aquí nunca se dice "Reembolsado".
import type { EstadoPago, PedidoDetalle } from '@/types/pedido';

export interface PresentacionPago {
  texto: string;
  color: string;
}

const PRESENTACION: Record<EstadoPago, PresentacionPago> = {
  PENDIENTE: { texto: 'Pendiente', color: 'yellow' },
  CONFIRMADO: { texto: 'Confirmado', color: 'volt' },
  RECHAZADO: { texto: 'Rechazado', color: 'red' },
};

export const SIN_INFORMACION: PresentacionPago = { texto: 'Sin información', color: 'gray' };

/**
 * Con pago.estado manda ese valor; null (el pedido no tiene registro de pago, p. ej. una orden de reemplazo) es
 * "Sin información". Si el campo no viene (M1 anterior al 2026-11-04) se deduce solo lo que el historial asegura:
 * - un PAGADO en el historial: el cobro se confirmó;
 * - el pedido sigue CREADO: el cobro está pendiente;
 * - la pasarela lo anuló por PAGO_NO_COMPLETADO sin haber pasado por PAGADO: el cobro se rechazó.
 * Cualquier otro caso (por ejemplo, un ANULADO por el cliente antes del cobro, que pudo cobrarse después) queda
 * "Sin información" en lugar de suponer un estado.
 */
export function estadoPago(pedido: Pick<PedidoDetalle, 'estado' | 'pago' | 'historialEstados'>): PresentacionPago {
  const informado = pedido.pago.estado;
  if (informado !== undefined) {
    return informado === null ? SIN_INFORMACION : (PRESENTACION[informado] ?? SIN_INFORMACION);
  }
  const historial = pedido.historialEstados ?? [];
  if (historial.some((h) => h.estado === 'PAGADO')) return PRESENTACION.CONFIRMADO;
  if (pedido.estado === 'CREADO') return PRESENTACION.PENDIENTE;
  const rechazadoPorPasarela = historial.some(
    (h) => h.estado === 'ANULADO' && h.actor === 'PASARELA_PAGOS' && h.motivo === 'PAGO_NO_COMPLETADO',
  );
  if (pedido.estado === 'ANULADO' && rechazadoPorPasarela) return PRESENTACION.RECHAZADO;
  return SIN_INFORMACION;
}
