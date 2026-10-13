// Contrato M1 — api-ventas.md (F1 pedidos y F2 anulaciones)
import type { Canal, Moneda, Paginado, ParametrosPaginacion } from './comun';

export type EstadoPedido =
  | 'CREADO'
  | 'PAGADO'
  | 'EN_PREPARACION'
  | 'DESPACHADO'
  | 'ENTREGADO'
  | 'ANULADO';

export type ActorHistorial =
  | 'CLIENTE'
  | 'GESTOR'
  | 'CANAL_CHATBOT'
  | 'PASARELA_PAGOS'
  | 'SISTEMA_LOGISTICA'
  | 'SISTEMA_PRODUCTOS';

export interface ContactoPedido {
  clienteId: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
  telefono?: string;
}

export interface PagoPedido {
  total: number;
  moneda: Moneda;
  metodoPago: string;
}

export interface EnvioPedido {
  modalidad: string;
  direccion: string;
  distrito: string;
}

export interface ItemPedido {
  productoId: string;
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface HistorialEstado {
  estado: EstadoPedido;
  fecha: string;
  actor: ActorHistorial;
  motivo: string;
}

/** 1.3 GET /api/v1/pedidos/{pedidoId} */
export interface PedidoDetalle {
  pedidoId: string;
  canal: Canal;
  estado: EstadoPedido;
  contacto: ContactoPedido;
  pago: PagoPedido;
  /** Opcional en RETAIL (usa tiendaId). */
  envio?: EnvioPedido;
  tiendaId?: string;
  items: ItemPedido[];
  fechaCreacion: string;
  ultimaActualizacion: string;
  historialEstados: HistorialEstado[];
}

/** Fila del listado 1.4 */
export interface PedidoResumen {
  pedidoId: string;
  canal: Canal;
  estado: EstadoPedido;
  total: number;
  moneda: Moneda;
  fechaCreacion: string;
}

/** 1.4 GET /api/v1/pedidos */
export interface ListadoPedidos extends Paginado<PedidoResumen> {
  clienteId: string;
}

export interface FiltrosPedidos extends ParametrosPaginacion {
  clienteId?: string;
  estado?: EstadoPedido;
  desde?: string;
  hasta?: string;
}

// ---------- F2: Anulaciones ----------

export type EstadoAnulacion = 'PENDIENTE_AUTORIZACION' | 'EJECUTADA' | 'RECHAZADA';

/** Catálogo ESP-05 (guía backend 6.1). */
export type MotivoAnulacion =
  | 'PAGO_NO_COMPLETADO'
  | 'ERROR_SELECCION_PRODUCTO'
  | 'ARREPENTIMIENTO_COMPRA'
  | 'SOLICITUD_CLIENTE'
  | 'ERROR_DATOS_ENVIO'
  | 'DUPLICADO'
  | 'ENTREGA_FALLIDA_DEFINITIVA'
  | 'STOCK_NO_DISPONIBLE'
  | 'CUPON_RECHAZADO';

/** Motivos que el Gestor puede elegir: sin los automáticos de pasarela, Productos ni Despacho. */
export const MOTIVOS_ANULACION_GESTOR = [
  'ERROR_SELECCION_PRODUCTO',
  'ARREPENTIMIENTO_COMPRA',
  'SOLICITUD_CLIENTE',
  'ERROR_DATOS_ENVIO',
  'DUPLICADO',
] as const satisfies readonly MotivoAnulacion[];

/** 1.7 POST /api/v1/pedidos/{pedidoId}/anulaciones */
export interface SolicitudAnulacionRequest {
  motivo: MotivoAnulacion;
  comentario?: string;
}

export type SolicitudAnulacionResponse =
  | {
      pedidoId: string;
      estadoPedido: EstadoPedido;
      autorizacionRequerida: false;
      solicitudReembolsoGenerada: boolean;
      timestamp: string;
    }
  | {
      pedidoId: string;
      estadoPedido: EstadoPedido;
      solicitudAnulacionId: string;
      autorizacionRequerida: true;
      mensaje: string;
    };

/** Fila de 1.8 GET /api/v1/pedidos/anulaciones/pendientes */
export interface AnulacionPendiente {
  solicitudAnulacionId: string;
  pedidoId: string;
  motivo: MotivoAnulacion;
  fechaSolicitud: string;
}

export type ListadoAnulacionesPendientes = Paginado<AnulacionPendiente>;

/** 1.9 PATCH /api/v1/pedidos/{pedidoId}/anulaciones/{anulacionId} */
export interface ResolverAnulacionRequest {
  decision: 'APROBADA' | 'RECHAZADA';
  autorizadorId: string;
  /** Obligatorio si decision = RECHAZADA. */
  comentario?: string;
}

export interface ResolverAnulacionResponse {
  pedidoId: string;
  estadoPedido: EstadoPedido;
  estadoAnulacion: EstadoAnulacion;
}
