// Expediente que ve el Gestor: la devolución (2.3 de M2) más su pedido (1.3 de M1).
// M2 no guarda canal, cliente ni fecha de entrega (RNF-07): se leen del pedido, igual que hace el backend.
import { obtenerDevolucion } from '@/services/devoluciones';
import { obtenerPedido } from '@/services/pedidos';
import type { DevolucionDetalle } from '@/types/devolucion';
import type { PedidoDetalle } from '@/types/pedido';

export interface Expediente {
  devolucion: DevolucionDetalle;
  /** null si M1 no respondió: el expediente se puede revisar igual, sin los datos del pedido. */
  pedido: PedidoDetalle | null;
}

export async function obtenerExpediente(devolucionId: string): Promise<Expediente> {
  const devolucion = await obtenerDevolucion(devolucionId);
  const pedido = await obtenerPedido(devolucion.pedidoId).catch(() => null);
  return { devolucion, pedido };
}

/** Cuándo se entregó el pedido: el último paso a ENTREGADO de su historial. */
export function fechaEntrega(pedido: PedidoDetalle | null): string | null {
  const entregas = (pedido?.historialEstados ?? []).filter((h) => h.estado === 'ENTREGADO');
  return entregas.length > 0 ? entregas[entregas.length - 1].fecha : null;
}

export interface LineaDevuelta {
  productoId: string;
  /** null si el pedido no se pudo consultar o no tiene esa línea: sin sku no se puede confirmar la recepción. */
  sku: string | null;
  descripcion: string;
  cantidad: number;
  /** Unidades ya recibidas en almacén (2.5b). */
  recibidas: number;
}

/** Unidades del expediente con su sku del pedido original (2.5b pide el sku, nunca el productoId). */
export function lineasDevueltas({ devolucion, pedido }: Expediente): LineaDevuelta[] {
  const recepciones = devolucion.recepciones ?? [];
  return devolucion.items.map((item) => {
    const linea = pedido?.items.find((i) => i.productoId === item.productoId);
    return {
      productoId: item.productoId,
      sku: linea?.sku ?? null,
      descripcion: linea?.descripcion ?? item.productoId,
      cantidad: item.cantidad,
      recibidas: recepciones
        .filter((r) => r.productoId === item.productoId)
        .reduce((total, r) => total + r.cantidadRecibida, 0),
    };
  });
}

/** El expediente espera la recepción física y todavía faltan unidades por llegar. */
export function faltaRecepcion(expediente: Expediente): boolean {
  const { devolucion } = expediente;
  if (devolucion.estado !== 'APROBADA') return false;
  if (devolucion.resolucion?.requiereDevolucionFisica === false) return false;
  return lineasDevueltas(expediente).some((l) => l.recibidas < l.cantidad);
}
