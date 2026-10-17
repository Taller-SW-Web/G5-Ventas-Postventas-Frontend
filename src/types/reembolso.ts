// Contrato M2 — api-postventas.md 2.6 (F4)
import type { Moneda, Paginado, ParametrosPaginacion } from './comun';

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
  motivo: string;
  solicitadoPor: string;
}

export interface ReembolsoResponse {
  reembolsoId: string;
  transaccionPasarelaId: string;
  estado: EstadoReembolso;
  monto: number;
  moneda: Moneda;
  fechaEjecucion: string;
}

// ---------- 2.6b Bandeja del Gestor (M2 la agrega además del contrato) ----------

/** Fila de 2.6b GET /api/v2/reembolsos */
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

export type ListadoReembolsos = Paginado<ReembolsoResumen>;

export interface FiltrosReembolsos extends ParametrosPaginacion {
  estado?: EstadoReembolso;
  origen?: OrigenReembolso;
  pedidoId?: string;
  /** Código REEM-/ANUL-/DEV-/PED- exacto. */
  buscar?: string;
  /** YYYY-MM-DD, inclusivos. */
  desde?: string;
  hasta?: string;
  orden?: 'RECIENTES' | 'ANTIGUOS';
}
