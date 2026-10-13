// Contrato M2 — api-postventas.md 2.8 a 2.12 (F6)
import type { Canal, Paginado, ParametrosPaginacion } from './comun';

export type TipoReclamo = 'RECLAMO' | 'QUEJA';

export type MotivoReclamo =
  | 'INCUMPLIMIENTO_PLAZO_ENTREGA'
  | 'PRODUCTO_DEFECTUOSO_O_INCORRECTO'
  | 'COBRO_INDEBIDO_O_NO_RECONOCIDO'
  | 'ATENCION_INADECUADA'
  | 'INCUMPLIMIENTO_GARANTIA';

export type EstadoReclamo = 'REGISTRADO' | 'EN_PROCESO' | 'ATENDIDO' | 'DERIVADO';

export const PLAZO_RECLAMO_DIAS_HABILES = 15;

export interface Consumidor {
  nombreCompleto: string;
  documento: string;
  email: string;
  telefono: string;
}

/** 2.8 POST /api/v2/reclamos */
export interface RegistrarReclamoRequest {
  /** Opcional en una queja general. */
  pedidoId?: string;
  tipo: TipoReclamo;
  canal: Canal;
  motivo: MotivoReclamo;
  detalle: string;
  consumidor: Consumidor;
}

export interface RegistrarReclamoResponse {
  reclamoId: string;
  codigoSeguimiento: string;
  estado: EstadoReclamo;
  motivo: MotivoReclamo;
  plazoDiasHabiles: number;
  fechaLimiteSLA: string;
  respuestaVisibleCliente: string | null;
}

/** 2.9 GET /api/v2/reclamos/{codigoSeguimiento} */
export interface ReclamoDetalle {
  reclamoId: string;
  codigoSeguimiento: string;
  pedidoId: string | null;
  tipo: TipoReclamo;
  canal: Canal;
  motivo: MotivoReclamo;
  detalle: string;
  estado: EstadoReclamo;
  plazoDiasHabiles: number;
  fechaLimiteSLA: string;
  fechaRegistro: string;
  fechaAtencion: string | null;
  respuestaVisibleCliente: string | null;
}

/** Fila de 2.10 GET /api/v2/reclamos */
export interface ReclamoResumen {
  reclamoId: string;
  codigoSeguimiento: string;
  tipo: TipoReclamo;
  motivo: MotivoReclamo;
  estado: EstadoReclamo;
  fechaRegistro: string;
  fechaLimiteSLA: string;
}

export type ListadoReclamos = Paginado<ReclamoResumen>;

export interface FiltrosReclamos extends ParametrosPaginacion {
  documento?: string;
  clienteId?: string;
  estado?: EstadoReclamo;
}

/** 2.11 PATCH /api/v2/reclamos/{reclamoId}/respuesta */
export interface ResponderReclamoRequest {
  nuevoEstado: EstadoReclamo;
  respuestaVisibleCliente: string;
  atendidoPor: string;
}

export interface ResponderReclamoResponse {
  reclamoId: string;
  estado: EstadoReclamo;
  fechaRespuesta: string;
  respuestaVisibleCliente: string;
}

// ---------- 2.12 Dashboard ----------

export interface FiltrosMetricas {
  /** YYYY-MM-DD, obligatorio */
  desde: string;
  /** YYYY-MM-DD, obligatorio */
  hasta: string;
  canal?: Canal;
}

/** 2.12 GET /api/v2/dashboard/metricas */
export interface MetricasDashboard {
  periodo: { desde: string; hasta: string };
  pedidos: {
    total: number;
    anulados: number;
    entregados: number;
  };
  postventa: {
    devolucionesAprobadas: number;
    montoReembolsadoPEN: number;
    csatPromedio: number;
    reclamosPendientesSLA: number;
  };
}
