// Bandeja de Anulaciones (Mockup 04, F2): pasa cada fila de 1.8 al formato de la pantalla. Solo usa lo que
// entrega el servidor: si falta un dato (canal, cliente, estado del pedido) queda null y se muestra "—".
import type { Canal } from '@/types/comun';
import type { AnulacionPendiente, EstadoAnulacion, EstadoPedido, MotivoAnulacion } from '@/types/pedido';

/** Texto de cada motivo del catálogo ESP-05 (la bandeja muestra el motivo legible, Mockup 04 5.6). */
export const ETIQUETA_MOTIVO_ANULACION: Record<MotivoAnulacion, string> = {
  PAGO_NO_COMPLETADO: 'Pago no completado',
  ERROR_SELECCION_PRODUCTO: 'Error de selección de producto',
  ARREPENTIMIENTO_COMPRA: 'Arrepentimiento de compra',
  SOLICITUD_CLIENTE: 'Solicitud del cliente',
  ERROR_DATOS_ENVIO: 'Error en datos de envío',
  DUPLICADO: 'Pedido duplicado',
  ENTREGA_FALLIDA_DEFINITIVA: 'Entrega fallida definitiva',
  STOCK_NO_DISPONIBLE: 'Stock no disponible',
  CUPON_RECHAZADO: 'Cupón rechazado',
};

/** Motivo legible; un código fuera del catálogo se muestra tal cual. */
export function etiquetaMotivo(motivo: string): string {
  return ETIQUETA_MOTIVO_ANULACION[motivo as MotivoAnulacion] ?? motivo;
}

export type Autorizacion = 'Pendiente' | 'Aprobada' | 'Rechazada';
/** Columna "Solicitud": el estado de la anulación del contrato (1.8), con PENDIENTE en lugar de PENDIENTE_AUTORIZACION. */
export type EstadoSolicitud = 'PENDIENTE' | 'EJECUTADA' | 'RECHAZADA';

export interface ItemBandejaAnulacion {
  solicitudAnulacionId: string;
  pedidoId: string;
  fecha: string;
  cliente: string | null;
  estadoPedido: EstadoPedido | null;
  canal: Canal | null;
  motivo: string;
  estado: EstadoAnulacion;
  autorizacion: Autorizacion;
  solicitud: EstadoSolicitud;
  /** Efectos que siguen a la decisión (texto explicativo de ESP-06, no un resultado consultado). */
  efectos: {
    estadoPedido: string;
    stock: string;
    despacho: string;
    reembolso: string;
  };
}

/** Filtro "Estado de solicitud" de la pantalla → valor de 1.8. "Aprobada" y "Ejecutada" son EJECUTADA. */
export function estadoDeFiltro(filtro: string | null): EstadoAnulacion | undefined {
  switch (filtro) {
    case 'Pendiente':
      return 'PENDIENTE_AUTORIZACION';
    case 'Aprobada':
    case 'Ejecutada':
      return 'EJECUTADA';
    case 'Rechazada':
      return 'RECHAZADA';
    default:
      return undefined;
  }
}

function efectos(estado: EstadoAnulacion, estadoPedido: EstadoPedido | null): ItemBandejaAnulacion['efectos'] {
  switch (estado) {
    case 'EJECUTADA':
      return {
        estadoPedido: 'ANULADO',
        stock: 'Reintegrar inventario',
        despacho: 'Cancelar despacho si aplica',
        reembolso: 'Originar reembolso en F4',
      };
    case 'RECHAZADA':
      return {
        estadoPedido: estadoPedido ? `${estadoPedido} (sin cambios)` : 'Sin cambios',
        stock: 'Sin cambios',
        despacho: 'Sin cambios',
        reembolso: 'No aplica',
      };
    case 'PENDIENTE_AUTORIZACION':
      return {
        estadoPedido: 'Pendiente de decisión',
        stock: 'Reintegrar si se aprueba',
        despacho: 'Cancelar si se aprueba',
        reembolso: 'Originar F4 si se aprueba',
      };
  }
}

/** Una fila de 1.8. 1.8 lista solicitudes, así que una fila sin `estado` está pendiente de autorización. */
export function aItemBandeja(a: AnulacionPendiente): ItemBandejaAnulacion {
  const estado: EstadoAnulacion = a.estado ?? 'PENDIENTE_AUTORIZACION';
  const estadoPedido = a.estadoPedido ?? null;
  return {
    solicitudAnulacionId: a.solicitudAnulacionId,
    pedidoId: a.pedidoId,
    fecha: a.fechaSolicitud,
    cliente: a.nombreCliente ?? null,
    estadoPedido,
    canal: a.canal ?? null,
    motivo: a.motivo,
    estado,
    autorizacion: estado === 'EJECUTADA' ? 'Aprobada' : estado === 'RECHAZADA' ? 'Rechazada' : 'Pendiente',
    solicitud: estado === 'PENDIENTE_AUTORIZACION' ? 'PENDIENTE' : estado,
    efectos: efectos(estado, estadoPedido),
  };
}
