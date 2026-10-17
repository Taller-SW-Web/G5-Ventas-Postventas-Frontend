// Contrato M2 — api-postventas.md 2.1 a 2.5b (F3)
import type { Moneda, Paginado, ParametrosPaginacion } from './comun';
import type { EstadoReembolso } from './reembolso';

export type TipoDevolucion = 'CAMBIO' | 'DEVOLUCION_DINERO';

export type MotivoDevolucion =
  | 'PRODUCTO_DEFECTUOSO'
  | 'PRODUCTO_DANADO'
  | 'PRODUCTO_INCORRECTO'
  | 'OTRO';

export type EstadoDevolucion =
  | 'SOLICITADA'
  | 'EN_EVALUACION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'COMPLETADA';

export type TipoResolucion = 'CAMBIO' | 'REEMBOLSO' | 'RECHAZO';

export type TipoEvidencia = 'IMAGEN' | 'DOCUMENTO';

// Validación en cliente antes de subir (el backend vuelve a validar).
export const EVIDENCIA_FORMATOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;
export const EVIDENCIA_TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
export const PLAZO_DEVOLUCION_DIAS_NATURALES = 7;

/** 2.1 POST /api/v2/devoluciones/evidencias/upload */
export interface EvidenciaSubida {
  tipo: TipoEvidencia;
  url: string;
  nombreArchivoOriginal: string;
  tamanioBytes: number;
  fechaSubida: string;
}

export interface Evidencia {
  tipo: TipoEvidencia;
  url: string;
}

export interface ItemDevolucion {
  productoId: string;
  cantidad: number;
}

/** 2.2 POST /api/v2/devoluciones */
export interface RegistrarDevolucionRequest {
  pedidoId: string;
  tipo: TipoDevolucion;
  motivo: MotivoDevolucion;
  descripcion: string;
  items: ItemDevolucion[];
  evidencias: Evidencia[];
}

export interface RegistrarDevolucionResponse {
  devolucionId: string;
  pedidoId: string;
  tipo: TipoDevolucion;
  estado: EstadoDevolucion;
  fechaRegistro: string;
}

export interface ReembolsoDeDevolucion {
  reembolsoId: string;
  estado: EstadoReembolso;
  monto: number;
  moneda: Moneda;
  transaccionPasarelaId: string | null;
  fechaEjecucion: string | null;
}

export interface ResolucionDevolucion {
  decision: 'APROBADA' | 'RECHAZADA';
  tipoResolucion: TipoResolucion;
  fundamento: string | null;
  autorizadorId: string | null;
  fechaResolucion: string;
  /** reembolsoId de F4 o el pedido de reemplazo de M1 (CAMBIO). null en un rechazo. */
  referenciaOperacion: string | null;
  // M2 los agrega además del contrato (pendiente reflejarlos en api-postventas.md)
  /** Si se espera la recepción física (2.5b) antes de completar. En CAMBIO siempre es true. */
  requiereDevolucionFisica?: boolean;
  reembolso?: ReembolsoDeDevolucion | null;
}

export type ActorDevolucion = 'CLIENTE' | 'CANAL' | 'GESTOR' | 'SISTEMA';

/** Un cambio de estado del expediente (RNF-03). estadoAnterior es null en el registro inicial. */
export interface HistorialDevolucion {
  estadoAnterior: EstadoDevolucion | null;
  estado: EstadoDevolucion;
  actor: ActorDevolucion;
  idActor: string | null;
  detalle: string | null;
  fecha: string;
}

/** PENDIENTE mientras Productos (G6) no aplica el reintegro de esa línea. */
export type EstadoReintegro = 'PENDIENTE' | 'COMPLETADO';

/** Una línea recibida en almacén (2.5b). */
export interface RecepcionDevolucion {
  sku: string;
  productoId: string;
  cantidadRecibida: number;
  cantidadApta: number;
  reintegroEstado: EstadoReintegro;
  idActor: string | null;
  fecha: string;
}

/** 2.3 GET /api/v2/devoluciones/{devolucionId}. Si estaba SOLICITADA y la abre el Gestor, pasa a EN_EVALUACION. */
export interface DevolucionDetalle {
  devolucionId: string;
  pedidoId: string;
  clienteId: string | null;
  tipo: TipoDevolucion;
  estado: EstadoDevolucion;
  motivo: MotivoDevolucion;
  descripcion: string | null;
  items: ItemDevolucion[];
  resolucion: ResolucionDevolucion | null;
  evidencias?: Evidencia[] | null;
  fechaRegistro: string;
  // M2 los agrega además del contrato (pendiente reflejarlos en api-postventas.md)
  historial?: HistorialDevolucion[];
  recepciones?: RecepcionDevolucion[];
}

/** Fila de 2.4 GET /api/v2/devoluciones */
export interface DevolucionResumen {
  devolucionId: string;
  pedidoId: string;
  tipo: TipoDevolucion;
  estado: EstadoDevolucion;
  motivo: MotivoDevolucion;
  /** Solo viene cuando la resolución fue un reembolso. */
  estadoReembolso: EstadoReembolso | null;
  fechaRegistro: string;
}

export interface ListadoDevoluciones extends Paginado<DevolucionResumen> {
  /** Solo viene cuando se filtra por cliente. */
  clienteId?: string | null;
}

export type OrdenDevoluciones = 'RECIENTES' | 'ANTIGUOS';

export interface FiltrosDevoluciones extends ParametrosPaginacion {
  /** El contrato 2.4 lo exige; la bandeja del Gestor lista todos sin él (pendiente en backend y contrato). */
  clienteId?: string;
  estado?: EstadoDevolucion;
  tipo?: TipoDevolucion;
  // Filtros de la bandeja del Mockup 06, además del contrato (mismo patrón que 2.10 y 1.4)
  /** Código DEV-AAAA-NNNN o PED-AAAA-NNNNN. */
  buscar?: string;
  /** YYYY-MM-DD, día de registro (inclusive). */
  desde?: string;
  hasta?: string;
  orden?: OrdenDevoluciones;
}

/** 2.5 PATCH /api/v2/devoluciones/{devolucionId}/resolucion */
export interface ResolverDevolucionRequest {
  decision: 'APROBADA' | 'RECHAZADA';
  /** Obligatorio si decision = RECHAZADA. */
  fundamento?: string;
  /** Solo con APROBADA. Si no se envía, sale del tipo del expediente. */
  tipoResolucion?: Exclude<TipoResolucion, 'RECHAZO'>;
  /** Solo con REEMBOLSO (por defecto true). En CAMBIO siempre es true. */
  requiereDevolucionFisica?: boolean;
}

export interface ResolverDevolucionResponse {
  devolucionId: string;
  estado: EstadoDevolucion;
  decision: 'APROBADA' | 'RECHAZADA';
  tipoResolucion: TipoResolucion;
  fundamento: string | null;
  autorizadorId: string | null;
  fechaResolucion: string;
  referenciaOperacion: string | null;
}

/** 2.5b PATCH /api/v2/devoluciones/{devolucionId}/recepcion */
export interface ConfirmarRecepcionRequest {
  /** sku de la línea del pedido original (items[].sku de 1.3), nunca el productoId. */
  lineas: { sku: string; cantidadRecibida: number; cantidadApta: number }[];
  /** URL de una foto de la recepción (opcional). */
  evidencia?: string;
}

export interface ConfirmarRecepcionResponse {
  devolucionId: string;
  recepcionConfirmada: boolean;
  fechaRecepcion: string;
  actor: string | null;
  lineas: { sku: string; cantidadApta: number }[];
  reintegroSolicitado: boolean;
  /** M2 lo agrega: COMPLETADA si con esta recepción ya no falta nada. */
  estado?: EstadoDevolucion;
}
