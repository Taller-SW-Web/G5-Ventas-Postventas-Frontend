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
  telefono?: string | null;
}

export interface PagoPedido {
  total: number;
  moneda: Moneda;
  metodoPago: string | null;
}

/** En RETAIL solo viene tiendaId (acuerdo G4); en los demás canales, la dirección. */
export interface EnvioPedido {
  modalidad: string | null;
  direccion: string | null;
  distrito: string | null;
  tiendaId: string | null;
  departamento: string | null;
  provincia: string | null;
  referencia: string | null;
  /** La fija Despacho (G2) al reprogramar. */
  fechaEstimadaEntrega: string | null;
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
  motivo: string | null;
}

/** 1.3 GET /api/v1/pedidos/{pedidoId} */
export interface PedidoDetalle {
  pedidoId: string;
  canal: Canal;
  estado: EstadoPedido;
  contacto: ContactoPedido;
  pago: PagoPedido;
  envio: EnvioPedido | null;
  items: ItemPedido[];
  fechaCreacion: string;
  ultimaActualizacion: string;
  historialEstados: HistorialEstado[];
}

/** Fila del listado 1.4. nombreCliente va además del contrato (bandeja del Mockup 02). */
export interface PedidoResumen {
  pedidoId: string;
  canal: Canal;
  estado: EstadoPedido;
  total: number;
  moneda: Moneda;
  fechaCreacion: string;
  nombreCliente: string | null;
}

/** 1.4 GET /api/v1/pedidos. clienteId es null cuando la bandeja lista todos los pedidos. */
export interface ListadoPedidos extends Paginado<PedidoResumen> {
  clienteId: string | null;
}

export type OrdenPedidos = 'RECIENTES' | 'ANTIGUOS';

/** Filtros de 1.4, todos opcionales. canal, buscar y orden van además del contrato (Mockup 02). */
export interface FiltrosPedidos extends ParametrosPaginacion {
  clienteId?: string;
  estado?: EstadoPedido;
  canal?: Canal;
  /** Código PED-AAAA-NNNNN, número de documento o parte del nombre del cliente. */
  buscar?: string;
  /** YYYY-MM-DD, inclusivo. */
  desde?: string;
  hasta?: string;
  orden?: OrdenPedidos;
}

/** Respuesta de "Pasar a preparación" y "Paquete sellado". idDespacho solo en el segundo. */
export interface AccionPedidoResponse {
  pedidoId: string;
  estado: EstadoPedido;
  idDespacho: string | null;
  mensaje: string | null;
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

/** Fila de 1.8 GET /api/v1/pedidos/anulaciones */
export interface AnulacionPendiente {
  solicitudAnulacionId: string;
  pedidoId: string;
  motivo: MotivoAnulacion;
  fechaSolicitud: string;
  estado?: EstadoAnulacion;
  /** Datos del pedido para la bandeja (mockup 04). */
  canal?: Canal;
  nombreCliente?: string | null;
  estadoPedido?: EstadoPedido;
}

export type ListadoAnulacionesPendientes = Paginado<AnulacionPendiente>;

/** Filtros delegados para 1.8 GET /api/v1/pedidos/anulaciones */
export interface FiltrosListadoAnulaciones {
  estado?: EstadoAnulacion;
  canal?: Canal;
  busqueda?: string;
  page?: number;
  size?: number;
  sort?: string;
  pagina?: number;
  tamano?: number;
}

/** 1.9 PATCH /api/v1/pedidos/{pedidoId}/anulaciones/{anulacionId} */
export interface ResolverAnulacionRequest {
  decision: 'APROBADA' | 'RECHAZADA';
  autorizadorId: string;
  /** Obligatorio en ambas decisiones (el backend lo valida con @NotBlank). */
  comentario: string;
}

export interface ResolverAnulacionResponse {
  pedidoId: string;
  estadoPedido: EstadoPedido;
  estadoAnulacion: EstadoAnulacion;
}
