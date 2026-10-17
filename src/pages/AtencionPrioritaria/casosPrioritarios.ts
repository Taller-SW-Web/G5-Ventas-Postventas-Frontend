// Casos de "Atención prioritaria" (Mockup 05): reclamos por SLA + expedientes de F3 pendientes de evaluación.
// No hay endpoint propio: se arma con lo que expone cada módulo.
import { fuenteDevoluciones } from '@/pages/Devoluciones/fuenteDevoluciones';
import { ETIQUETA_MOTIVO } from '@/pages/Devoluciones/formato';
import type { DevolucionResumen } from '@/types/devolucion';

export type TipoCaso = 'RECLAMO' | 'DEVOLUCION' | 'CAMBIO';
export type SituacionCaso = 'VENCIDO' | 'PROXIMO_A_VENCER' | 'PENDIENTE_EVALUACION' | 'EN_EVALUACION';
export type PrioridadCaso = 'ALTA' | 'MEDIA';

export interface CasoPrioritario {
  codigo: string;
  fecha: string;
  tipo: TipoCaso;
  cliente: string;
  contexto: string;
  situacion: SituacionCaso;
  prioridad: PrioridadCaso;
  /** Pantalla donde se sigue gestionando el caso. */
  ruta: string;
}

export const ETIQUETA_TIPO_CASO: Record<TipoCaso, string> = {
  RECLAMO: 'Reclamo',
  DEVOLUCION: 'Devolución',
  CAMBIO: 'Cambio',
};

export const ETIQUETA_SITUACION: Record<SituacionCaso, string> = {
  VENCIDO: 'Vencido',
  PROXIMO_A_VENCER: 'Próximo a vencer',
  PENDIENTE_EVALUACION: 'Pendiente evaluación',
  EN_EVALUACION: 'En evaluación',
};

export const ETIQUETA_PRIORIDAD: Record<PrioridadCaso, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
};

// Reclamos del Mockup 05 mientras no se conecte la bandeja de reclamos de F6 (2.10, Fabrizio).
const RECLAMOS_DEMO: CasoPrioritario[] = [
  {
    codigo: 'REC-2026-0041',
    fecha: '2026-09-08T10:00:00Z',
    tipo: 'RECLAMO',
    cliente: 'José Castro',
    contexto: 'Incumplimiento de plazo',
    situacion: 'VENCIDO',
    prioridad: 'ALTA',
    ruta: '/admin/postventa/reclamos?codigo=REC-2026-0041',
  },
  {
    codigo: 'REC-2026-0051',
    fecha: '2026-09-20T10:00:00Z',
    tipo: 'RECLAMO',
    cliente: 'Carlos Ruiz',
    contexto: 'Cobro indebido',
    situacion: 'PROXIMO_A_VENCER',
    prioridad: 'ALTA',
    ruta: '/admin/postventa/reclamos?codigo=REC-2026-0051',
  },
];

function aCaso(d: DevolucionResumen): CasoPrioritario {
  return {
    codigo: d.devolucionId,
    fecha: d.fechaRegistro,
    tipo: d.tipo === 'CAMBIO' ? 'CAMBIO' : 'DEVOLUCION',
    cliente: d.nombreCliente ?? '—',
    contexto: ETIQUETA_MOTIVO[d.motivo],
    situacion: d.estado === 'SOLICITADA' ? 'PENDIENTE_EVALUACION' : 'EN_EVALUACION',
    prioridad: 'MEDIA',
    ruta: `/admin/postventa/devoluciones?expediente=${encodeURIComponent(d.devolucionId)}`,
  };
}

/** Primero los reclamos por SLA (vencidos antes), luego los expedientes de F3 más recientes. */
export async function obtenerCasosPrioritarios(): Promise<CasoPrioritario[]> {
  const [solicitadas, enEvaluacion] = await Promise.all([
    fuenteDevoluciones.listar({ estado: 'SOLICITADA', pagina: 0, tamano: 100 }),
    fuenteDevoluciones.listar({ estado: 'EN_EVALUACION', pagina: 0, tamano: 100 }),
  ]);
  const expedientes = [...enEvaluacion.contenido, ...solicitadas.contenido]
    .sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro))
    .map(aCaso);
  return [...RECLAMOS_DEMO, ...expedientes];
}
