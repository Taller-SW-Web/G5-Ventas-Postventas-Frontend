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

/**
 * Semáforo del plazo (propuesta UX 01), distinto del estado de atención: un reclamo puede estar
 * EN_PROCESO y VENCIDO a la vez. Lo calcula el backend en días hábiles.
 */
export type EstadoSla = 'EN_PLAZO' | 'POR_VENCER' | 'CRITICO' | 'VENCIDO' | 'ATENDIDO';

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
  // Campos que M2 agrega además del contrato (pendiente reflejarlos en api-postventas.md)
  consumidor?: Consumidor;
  atendidoPor?: string | null;
  estadoSla?: EstadoSla;
  /** 0 = vence hoy; negativo = vencido. null cuando ya está ATENDIDO. */
  diasHabilesRestantes?: number | null;
  /** null mientras no haya respuesta formal. */
  slaCumplido?: boolean | null;
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
  // Campos que M2 agrega además del contrato (la bandeja del mockup 07 los muestra)
  pedidoId?: string | null;
  canal?: Canal;
  nombreConsumidor?: string;
  estadoSla?: EstadoSla;
  diasHabilesRestantes?: number | null;
}

export type ListadoReclamos = Paginado<ReclamoResumen>;

export interface FiltrosReclamos extends ParametrosPaginacion {
  documento?: string;
  clienteId?: string;
  estado?: EstadoReclamo;
  // Filtros que M2 agrega además del contrato (bandeja del mockup 07, propuesta UX 01)
  /** Código de reclamo, código de pedido, documento o parte del nombre del consumidor. */
  buscar?: string;
  /** POR_VENCER incluye a CRITICO (0 a 5 días hábiles). */
  sla?: EstadoSla;
  /** YYYY-MM-DD, día de registro (inclusive). */
  desde?: string;
  hasta?: string;
  orden?: 'RECIENTES' | 'ANTIGUOS';
}

/**
 * 2.11 PATCH /api/v2/reclamos/{reclamoId}/respuesta.
 * EN_PROCESO ("Iniciar atención") va sin respuesta; ATENDIDO y DERIVADO la exigen.
 */
export interface ResponderReclamoRequest {
  nuevoEstado: Exclude<EstadoReclamo, 'REGISTRADO'>;
  respuestaVisibleCliente?: string;
  atendidoPor: string;
}

export interface ResponderReclamoResponse {
  reclamoId: string;
  estado: EstadoReclamo;
  /** null al pasar a EN_PROCESO. */
  fechaRespuesta: string | null;
  respuestaVisibleCliente: string | null;
}

// ---------- Atención prioritaria (Mockup 01, 7.2 a 7.4) ----------
// No es un recurso del contrato: es la bandeja que arma el portal con 2.10 (reclamos) y 2.4 (devoluciones).

export type TipoCaso = 'RECLAMO' | 'DEVOLUCION' | 'CAMBIO';

/** Situación que muestra la bandeja (Figma): urgencia del reclamo o etapa del expediente de postventa. */
export type SituacionCaso = 'VENCIDO' | 'POR_VENCER' | 'PENDIENTE_EVALUACION' | 'EN_EVALUACION';

export type PrioridadCaso = 'ALTA' | 'MEDIA';

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
    /** null si el periodo no tiene encuestas. */
    csatPromedio: number | null;
    reclamosPendientesSLA: number;
  };
  /** Hasta cuándo están consolidados los agregados (M2 lo agrega además del contrato). */
  ultimaActualizacion?: string | null;
}
