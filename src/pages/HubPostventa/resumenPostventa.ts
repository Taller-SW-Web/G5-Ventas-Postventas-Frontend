// Indicadores del Hub Postventa (Mockup 05). El Hub no tiene endpoint propio (guía frontend 1.1):
// cada número sale del listado de su módulo, contando con totalElementos (página de 1 elemento).
import dayjs from 'dayjs';
import { contarDevoluciones } from '@/services/devoluciones';
import { listarReclamos } from '@/services/reclamos';
import { listarReembolsos } from '@/services/reembolsos';
import type { EstadoDevolucion } from '@/types/devolucion';
import type { EstadoReclamo, FiltrosReclamos } from '@/types/reclamo';
import type { FiltrosReembolsos } from '@/types/reembolso';

export interface IndicadorPostventa {
  /** null si el servicio de ese módulo no respondió. */
  cantidad: number | null;
  /** Etiqueta de apoyo bajo la cifra ("+2 hoy", "2 por SLA"...). */
  detalle: string;
}

export interface ResumenPostventa {
  devoluciones: IndicadorPostventa;
  reclamos: IndicadorPostventa;
  reembolsos: IndicadorPostventa;
}

/** Pendiente = todavía requiere una decisión del Gestor. */
export const ESTADOS_DEVOLUCION_PENDIENTE: EstadoDevolucion[] = ['SOLICITADA', 'EN_EVALUACION'];
/** Abierto = sin respuesta formal. */
const ESTADOS_RECLAMO_ABIERTO: EstadoReclamo[] = ['REGISTRADO', 'EN_PROCESO'];

const NO_DISPONIBLE: IndicadorPostventa = { cantidad: null, detalle: 'No disponible' };

const sumar = (cantidades: number[]) => cantidades.reduce((total, n) => total + n, 0);

const contarReclamos = async (filtros: FiltrosReclamos) =>
  (await listarReclamos({ ...filtros, pagina: 0, tamano: 1 })).totalElementos;

const contarReembolsos = async (filtros: FiltrosReembolsos) =>
  (await listarReembolsos({ ...filtros, pagina: 0, tamano: 1 })).totalElementos;

async function indicadorDevoluciones(): Promise<IndicadorPostventa> {
  const hoy = dayjs().format('YYYY-MM-DD');
  const [pendientes, deHoy] = await Promise.all([
    Promise.all(ESTADOS_DEVOLUCION_PENDIENTE.map((estado) => contarDevoluciones({ estado }))),
    Promise.all(
      ESTADOS_DEVOLUCION_PENDIENTE.map((estado) => contarDevoluciones({ estado, desde: hoy, hasta: hoy })),
    ),
  ]);
  const nuevas = sumar(deHoy);
  return { cantidad: sumar(pendientes), detalle: nuevas > 0 ? `+${nuevas} hoy` : 'Sin nuevas hoy' };
}

async function indicadorReclamos(): Promise<IndicadorPostventa> {
  // "Por SLA": abiertos vencidos o por vencer (POR_VENCER incluye CRITICO, 0 a 5 días hábiles).
  const [abiertos, vencidos, porVencer] = await Promise.all([
    Promise.all(ESTADOS_RECLAMO_ABIERTO.map((estado) => contarReclamos({ estado }))),
    contarReclamos({ sla: 'VENCIDO' }),
    contarReclamos({ sla: 'POR_VENCER' }),
  ]);
  return { cantidad: sumar(abiertos), detalle: `${vencidos + porVencer} por SLA` };
}

async function indicadorReembolsos(): Promise<IndicadorPostventa> {
  const [enProceso, fallidos] = await Promise.all([
    contarReembolsos({ estado: 'PENDIENTE' }),
    contarReembolsos({ estado: 'FALLIDO' }),
  ]);
  return { cantidad: enProceso, detalle: `${fallidos} por reintentar` };
}

/** Un módulo caído no tumba el Hub: su indicador queda "No disponible". */
export async function obtenerResumenPostventa(): Promise<ResumenPostventa> {
  const [devoluciones, reclamos, reembolsos] = await Promise.all(
    [indicadorDevoluciones(), indicadorReclamos(), indicadorReembolsos()].map((p) =>
      p.catch(() => NO_DISPONIBLE),
    ),
  );
  return { devoluciones, reclamos, reembolsos };
}
