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
