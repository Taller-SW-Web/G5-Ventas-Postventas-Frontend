// Contrato M2 — api-postventas.md 2.6 (F4)
import type { Moneda } from './comun';

export type EstadoReembolso = 'PENDIENTE' | 'EXITOSO' | 'FALLIDO';

export type OrigenReembolso = 'ANULACION' | 'DEVOLUCION';

/** 2.6 POST /api/v2/reembolsos (requiere cabecera X-Idempotency-Key). */
export interface SolicitudReembolsoRequest {
  origen: OrigenReembolso;
  /** ANUL-NNNN o DEV-AAAA-NNNN */
  origenId: string;
  /** pedidoId */
  referenciaId: string;
  monto: number;
  moneda: Moneda;
  motivo?: string;
  solicitadoPor?: string;
}

export interface ReembolsoResponse {
  reembolsoId: string;
  transaccionPasarelaId: string;
  estado: EstadoReembolso;
  monto: number;
  moneda: Moneda;
  fechaEjecucion: string;
}

export interface ListadoReembolsosResponse {
  contenido: ReembolsoResumen[];
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
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
}

export interface IntentoReembolso {
  numero: number;
  estado: EstadoReembolso;
  transaccionPasarelaId: string | null;
  resultado: string | null;
  fecha: string;
}

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

export interface FiltrosReembolsos {
  estado?: EstadoReembolso;
  origen?: OrigenReembolso;
  buscar?: string;
  desde?: string;
  hasta?: string;
  orden?: 'RECIENTES' | 'ANTIGUOS';
  pagina: number;
  tamano: number;
}
