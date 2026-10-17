// Textos y cálculos de presentación del Mockup 06. Los valores siguen siendo los del contrato.
import dayjs from 'dayjs';
import type { Canal } from '@/types/comun';
import {
  PLAZO_DEVOLUCION_DIAS_NATURALES,
  type MotivoDevolucion,
  type TipoDevolucion,
} from '@/types/devolucion';
import { fechaEntrega, lineasDevueltas, type Expediente } from './expediente';

export const ETIQUETA_TIPO: Record<TipoDevolucion, string> = {
  CAMBIO: 'Cambio',
  DEVOLUCION_DINERO: 'Devolución',
};

export const ETIQUETA_MOTIVO: Record<MotivoDevolucion, string> = {
  PRODUCTO_DEFECTUOSO: 'Producto defectuoso',
  PRODUCTO_DANADO: 'Producto dañado',
  PRODUCTO_INCORRECTO: 'Producto incorrecto',
  OTRO: 'Otro',
};

export const ETIQUETA_CANAL: Record<Canal, string> = {
  MARKETPLACE: 'Marketplace',
  CHATBOT: 'Chatbot',
  RETAIL: 'Retail',
};

export function dia(fechaIso: string): string {
  return dayjs(fechaIso).format('DD/MM/YYYY');
}

/** Motivo del catálogo + el detalle que escribió el cliente, si aporta algo distinto. */
export function textoMotivo(motivo: MotivoDevolucion, descripcion?: string | null): string {
  const base = ETIQUETA_MOTIVO[motivo];
  if (!descripcion || descripcion.toLowerCase() === base.toLowerCase()) return base;
  return `${base} · ${descripcion}`;
}

export interface PlazoDevolucion {
  limite: string;
  dentroDePlazo: boolean;
}

/** Plazo de 7 días naturales desde la entrega (F3). Sin fecha de entrega no se puede calcular. */
export function plazoDevolucion({ devolucion, pedido }: Expediente): PlazoDevolucion | null {
  const entrega = fechaEntrega(pedido);
  if (!entrega) return null;
  const limite = dayjs(entrega).add(PLAZO_DEVOLUCION_DIAS_NATURALES, 'day');
  const dentroDePlazo = !dayjs(devolucion.fechaRegistro).startOf('day').isAfter(limite.startOf('day'));
  return { limite: limite.toISOString(), dentroDePlazo };
}

export function cantidadArchivos(cantidad: number): string {
  if (cantidad === 0) return 'Sin archivos';
  return cantidad === 1 ? '1 archivo' : `${cantidad} archivos`;
}

export interface EvaluacionResumen {
  resolucion: string;
  logistica: string;
  recepcion: string;
  reembolso: string;
}

function textoRecepcion(expediente: Expediente): string {
  const { devolucion } = expediente;
  if (devolucion.resolucion?.requiereDevolucionFisica === false) return 'No requerida';
  if (devolucion.estado === 'SOLICITADA' || devolucion.estado === 'EN_EVALUACION') return 'Después de aprobar';
  const lineas = lineasDevueltas(expediente);
  const total = lineas.reduce((t, l) => t + l.cantidad, 0);
  const recibidas = lineas.reduce((t, l) => t + Math.min(l.recibidas, l.cantidad), 0);
  if (recibidas === 0) return 'Pendiente';
  const aptas = (devolucion.recepciones ?? []).reduce((t, r) => t + r.cantidadApta, 0);
  return `${recibidas} de ${total} recibidas (${aptas} aptas)`;
}

/** Bloque "Resolución / evaluación": qué se resolvió y qué falta para completarlo. */
export function resumenEvaluacion(expediente: Expediente): EvaluacionResumen {
  const { devolucion: e } = expediente;
  const r = e.resolucion;

  if (e.estado === 'RECHAZADA') {
    return { resolucion: 'RECHAZO', logistica: 'No aplica', recepcion: 'No aplica', reembolso: 'No aplica' };
  }

  const pendiente = e.estado === 'SOLICITADA' || e.estado === 'EN_EVALUACION';
  const camino = r?.tipoResolucion ?? (e.tipo === 'CAMBIO' ? 'CAMBIO' : 'REEMBOLSO');
  const recepcion = textoRecepcion(expediente);

  if (camino === 'CAMBIO') {
    let logistica = 'Se coordina al aprobar';
    if (e.estado === 'COMPLETADA') logistica = `Reemplazo entregado (${r?.referenciaOperacion ?? '—'})`;
    else if (r?.referenciaOperacion) logistica = `Reemplazo ${r.referenciaOperacion} en curso`;
    else if (!pendiente) logistica = 'Pendiente coordinación';
    return { resolucion: pendiente ? 'CAMBIO (propuesto)' : 'CAMBIO', logistica, recepcion, reembolso: 'No aplica' };
  }

  let reembolso = 'Se deriva a F4 al aprobar';
  if (r?.reembolso) reembolso = `${r.reembolso.reembolsoId} · ${r.reembolso.estado}`;
  else if (r?.referenciaOperacion) reembolso = `Enviado a F4 (${r.referenciaOperacion})`;
  else if (!pendiente) reembolso = 'Pendiente F4';

  return {
    resolucion: pendiente ? 'REEMBOLSO (propuesto)' : 'REEMBOLSO',
    logistica: r?.requiereDevolucionFisica === false ? 'El cliente conserva el producto' : 'Recojo del producto',
    recepcion,
    reembolso,
  };
}
