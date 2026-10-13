// Contrato M2 — api-postventas.md 2.1 a 2.5 (F3)
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
  transaccionPasarelaId: string;
  fechaEjecucion: string;
}

export interface ResolucionDevolucion {
  decision: 'APROBADA' | 'RECHAZADA';
  tipoResolucion: TipoResolucion;
  fundamento: string | null;
  autorizadorId: string;
  fechaResolucion: string;
  referenciaOperacion: string | null;
  reembolso?: ReembolsoDeDevolucion;
}

/** 2.3 GET /api/v2/devoluciones/{devolucionId} */
export interface DevolucionDetalle {
  devolucionId: string;
  pedidoId: string;
  clienteId: string;
  tipo: TipoDevolucion;
  estado: EstadoDevolucion;
  motivo: MotivoDevolucion;
  descripcion: string;
  items: ItemDevolucion[];
  resolucion: ResolucionDevolucion | null;
  evidencias?: Evidencia[];
  fechaRegistro: string;
}

/** Fila de 2.4 GET /api/v2/devoluciones */
export interface DevolucionResumen {
  devolucionId: string;
  pedidoId: string;
  tipo: TipoDevolucion;
  estado: EstadoDevolucion;
  motivo: MotivoDevolucion;
  estadoReembolso: EstadoReembolso | null;
  fechaRegistro: string;
}

export interface ListadoDevoluciones extends Paginado<DevolucionResumen> {
  clienteId: string;
}

export interface FiltrosDevoluciones extends ParametrosPaginacion {
  clienteId: string;
  estado?: EstadoDevolucion;
  tipo?: TipoDevolucion;
}

/** 2.5 PATCH /api/v2/devoluciones/{devolucionId}/resolucion */
export interface ResolverDevolucionRequest {
  decision: 'APROBADA' | 'RECHAZADA';
  /** Obligatorio si decision = RECHAZADA. */
  fundamento?: string;
  /** Solo con APROBADA. Si no se envía, sale del tipo del expediente. */
  tipoResolucion?: Exclude<TipoResolucion, 'RECHAZO'>;
}

export interface ResolverDevolucionResponse {
  devolucionId: string;
  estado: EstadoDevolucion;
  decision: 'APROBADA' | 'RECHAZADA';
  tipoResolucion: TipoResolucion;
  fundamento: string | null;
  autorizadorId: string;
  fechaResolucion: string;
  referenciaOperacion: string | null;
}
