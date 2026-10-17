// Atención prioritaria (Mockup 01, 7.2 a 7.4): bandeja consolidada de reclamos por SLA y expedientes de postventa.
// No tiene endpoint propio: junta 2.10 (reclamos vencidos o por vencer) y 2.4 (devoluciones y cambios sin resolver).
import { listarReclamos } from '@/services/reclamos';
import type { DevolucionResumen, MotivoDevolucion } from '@/types/devolucion';
import type { PrioridadCaso, ReclamoResumen, SituacionCaso, TipoCaso } from '@/types/reclamo';
import { ETIQUETA_MOTIVO } from '../Reclamos/formato';

export interface CasoPrioritario {
  codigo: string;
  /** Fecha de registro (ISO). */
  fecha: string;
  tipo: TipoCaso;
  cliente: string | null;
  /** Motivo legible del reclamo o del expediente. */
  contexto: string;
  situacion: SituacionCaso;
  prioridad: PrioridadCaso;
  /** Fecha límite (ISO) cuando el caso tiene plazo; los expedientes de postventa no lo tienen. */
  fechaLimite: string | null;
  pedidoId: string | null;
}

export const ETIQUETA_TIPO_CASO: Record<TipoCaso, string> = {
  RECLAMO: 'Reclamo',
  DEVOLUCION: 'Devolución',
  CAMBIO: 'Cambio',
};

export const ETIQUETA_SITUACION: Record<SituacionCaso, string> = {
  VENCIDO: 'Vencido',
  POR_VENCER: 'Próximo a vencer',
  PENDIENTE_EVALUACION: 'Pendiente evaluación',
  EN_EVALUACION: 'En evaluación',
};

export const ETIQUETA_PRIORIDAD: Record<PrioridadCaso, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
};

const ETIQUETA_MOTIVO_DEVOLUCION: Record<MotivoDevolucion, string> = {
  PRODUCTO_DEFECTUOSO: 'Producto defectuoso',
  PRODUCTO_DANADO: 'Producto dañado',
  PRODUCTO_INCORRECTO: 'Producto incorrecto',
  OTRO: 'Otro motivo',
};

/** Máximo de casos por consulta (el backend acepta hasta 100 por página). */
const LIMITE = 50;

/**
 * 2.4 (GET /api/v2/devoluciones) todavía exige clienteId, así que no se pueden traer las devoluciones de todos los
 * clientes. Cuando F3 lo haga opcional para el Gestor, se cambia a true y se completa cargarDevoluciones.
 */
export const DEVOLUCIONES_DISPONIBLES = false;

export interface ResultadoCasos {
  casos: CasoPrioritario[];
  /** false mientras 2.4 no permita listar sin clienteId (la pantalla lo avisa). */
  devolucionesDisponibles: boolean;
}

export function deReclamo(r: ReclamoResumen): CasoPrioritario {
  return {
    codigo: r.codigoSeguimiento,
    fecha: r.fechaRegistro,
    tipo: 'RECLAMO',
    cliente: r.nombreConsumidor ?? null,
    contexto: ETIQUETA_MOTIVO[r.motivo],
    situacion: r.estadoSla === 'VENCIDO' ? 'VENCIDO' : 'POR_VENCER',
    prioridad: 'ALTA',
    fechaLimite: r.fechaLimiteSLA,
    pedidoId: r.pedidoId ?? null,
  };
}

export function deDevolucion(d: DevolucionResumen): CasoPrioritario {
  return {
    codigo: d.devolucionId,
    fecha: d.fechaRegistro,
    tipo: d.tipo === 'CAMBIO' ? 'CAMBIO' : 'DEVOLUCION',
    cliente: null, // 2.4 no trae el nombre del cliente
    contexto: ETIQUETA_MOTIVO_DEVOLUCION[d.motivo],
    situacion: d.estado === 'SOLICITADA' ? 'PENDIENTE_EVALUACION' : 'EN_EVALUACION',
    prioridad: 'MEDIA',
    fechaLimite: null,
    pedidoId: d.pedidoId,
  };
}

async function cargarReclamos(): Promise<CasoPrioritario[]> {
  // Los más antiguos primero: son los que vencieron (o vencen) antes
  const [vencidos, porVencer] = await Promise.all([
    listarReclamos({ sla: 'VENCIDO', orden: 'ANTIGUOS', tamano: LIMITE }),
    listarReclamos({ sla: 'POR_VENCER', orden: 'ANTIGUOS', tamano: LIMITE }),
  ]);
  return [...vencidos.contenido, ...porVencer.contenido].map(deReclamo);
}

/** Devoluciones y cambios SOLICITADA / EN_EVALUACION. Vacío mientras DEVOLUCIONES_DISPONIBLES sea false. */
async function cargarDevoluciones(): Promise<CasoPrioritario[]> {
  return [];
}

const ORDEN_SITUACION: Record<SituacionCaso, number> = {
  VENCIDO: 0,
  POR_VENCER: 1,
  PENDIENTE_EVALUACION: 2,
  EN_EVALUACION: 3,
};

/** Primero lo más urgente: vencidos, por vencer (antes el que vence primero) y luego los expedientes de postventa. */
function ordenar(a: CasoPrioritario, b: CasoPrioritario): number {
  const porSituacion = ORDEN_SITUACION[a.situacion] - ORDEN_SITUACION[b.situacion];
  if (porSituacion !== 0) return porSituacion;
  return (a.fechaLimite ?? a.fecha).localeCompare(b.fechaLimite ?? b.fecha);
}

export async function cargarCasosPrioritarios(): Promise<ResultadoCasos> {
  const [reclamos, devoluciones] = await Promise.all([cargarReclamos(), cargarDevoluciones()]);
  return {
    casos: [...reclamos, ...devoluciones].sort(ordenar),
    devolucionesDisponibles: DEVOLUCIONES_DISPONIBLES,
  };
}

/** Cantidad de casos por tipo, para los chips del panel ("2 reclamos · 1 devolución · 1 cambio"). */
export function contarPorTipo(casos: CasoPrioritario[]): Record<TipoCaso, number> {
  const conteo: Record<TipoCaso, number> = { RECLAMO: 0, DEVOLUCION: 0, CAMBIO: 0 };
  for (const c of casos) conteo[c.tipo] += 1;
  return conteo;
}

export function textoConteo(cantidad: number, tipo: TipoCaso): string {
  const singular = ETIQUETA_TIPO_CASO[tipo].toLowerCase();
  const plural = tipo === 'DEVOLUCION' ? 'devoluciones' : `${singular}s`;
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/** Ruta del expediente: Reclamos abre el detalle con ?codigo=; Devoluciones es la bandeja de F3. */
export function rutaExpediente(caso: CasoPrioritario): string {
  return caso.tipo === 'RECLAMO'
    ? `/admin/postventa/reclamos?codigo=${encodeURIComponent(caso.codigo)}`
    : '/admin/postventa/devoluciones';
}

export const RUTA_ATENCION_PRIORITARIA = '/admin/postventa/atencion-prioritaria';
