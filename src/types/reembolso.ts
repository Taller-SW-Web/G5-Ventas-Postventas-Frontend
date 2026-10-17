// Contrato M2 — api-postventas.md 2.6 (F4)
import type { Moneda, Paginado, ParametrosPaginacion } from './comun';

export type EstadoReembolso = 'PENDIENTE' | 'EXITOSO' | 'FALLIDO';
export type OrigenReembolso = 'ANULACION' | 'DEVOLUCION';

export interface SolicitudReembolsoRequest {
  origen: OrigenReembolso;
  origenId: string;
  referenciaId: string;
  monto: number;
  moneda: Moneda;
  motivo?: string;
  solicitadoPor?: string;
}

export interface ReembolsoResponse {
  reembolsoId: string;
  transaccionPasarelaId: string | null;
  estado: EstadoReembolso;
  monto: number;
  moneda: Moneda;
  fechaEjecucion: string;
}

export interface ReembolsoResumen {
  reembolsoId: string;
  pedidoId: string;
  origen: OrigenReembolso;
  origenId: string;
  monto: number;
  moneda: Moneda;
  estado: EstadoReembolso;
  transaccionPasarelaId: string | null;
  fecha: string;
  intentos: number;
  ultimoResultado: string | null;
  fechaUltimoIntento: string | null;
  /** No viene en 2.6b: lo completa la bandeja con el detalle del pedido (1.5). */
  clienteNombre?: string | null;
}

export type ListadoReembolsos = Paginado<ReembolsoResumen>;

export interface FiltrosReembolsos extends ParametrosPaginacion {
  estado?: EstadoReembolso;
  origen?: OrigenReembolso;
  pedidoId?: string;
  buscar?: string;
  /** YYYY-MM-DD, inclusivos. */
  desde?: string;
  hasta?: string;
  orden?: 'RECIENTES' | 'ANTIGUOS';
}

export interface IntentoReembolso {
  numero: number;
  estado: EstadoReembolso;
  transaccionPasarelaId: string | null;
  resultado: string | null;
  fecha: string;
}

/** 2.6c: datos del panel “Ver”. */
export interface DetalleReembolsoResponse {
  reembolsoId: string;
  pedidoId: string;
  origen: OrigenReembolso;
  origenId: string;
  monto: number;
  moneda: Moneda;
  estado: EstadoReembolso;
  transaccionPasarelaId: string | null;
  fecha: string;
  autorizadorId: string | null;
  clienteId: string | null;
  clienteNombre: string | null;
  canal: 'MARKETPLACE' | 'CHATBOT' | 'RETAIL' | null;
  metodoPago: string | null;
  total: boolean;
  claveIdempotencia: string;
  intentos: IntentoReembolso[];
}
