// Textos y cálculos de presentación del Mockup 06. Los valores siguen siendo los del contrato.
import dayjs from 'dayjs';
import type { Canal } from '@/types/comun';
import {
  PLAZO_DEVOLUCION_DIAS_NATURALES,
  type DevolucionDetalle,
  type MotivoDevolucion,
  type TipoDevolucion,
} from '@/types/devolucion';

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
export function textoMotivo(motivo: MotivoDevolucion, descripcion?: string): string {
  const base = ETIQUETA_MOTIVO[motivo];
  if (!descripcion || descripcion.toLowerCase() === base.toLowerCase()) return base;
  return `${base} · ${descripcion}`;
}

export interface PlazoDevolucion {
  limite: string;
  /** Días naturales que quedaban al registrar la solicitud (negativo = fuera de plazo). */
  diasAlRegistrar: number;
  dentroDePlazo: boolean;
}

/** Plazo de 7 días naturales desde la entrega (F3). Sin fecha de entrega no se puede calcular. */
export function plazoDevolucion(e: DevolucionDetalle): PlazoDevolucion | null {
  if (!e.fechaEntrega) return null;
  const limite = dayjs(e.fechaEntrega).add(PLAZO_DEVOLUCION_DIAS_NATURALES, 'day');
  const diasAlRegistrar = limite.startOf('day').diff(dayjs(e.fechaRegistro).startOf('day'), 'day');
  return { limite: limite.toISOString(), diasAlRegistrar, dentroDePlazo: diasAlRegistrar >= 0 };
}

export function cantidadArchivos(e: DevolucionDetalle): string {
  const n = e.evidencias?.length ?? 0;
  if (n === 0) return 'Sin archivos';
  return n === 1 ? '1 archivo' : `${n} archivos`;
}

export interface EvaluacionResumen {
  resolucion: string;
  stock: string;
  logistica: string;
  reembolso: string;
}

/** Bloque "Resolución / evaluación": qué se propone y qué falta para ejecutarlo. */
export function resumenEvaluacion(e: DevolucionDetalle): EvaluacionResumen {
  const esCambio = (e.resolucion?.tipoResolucion ?? (e.tipo === 'CAMBIO' ? 'CAMBIO' : 'REEMBOLSO')) === 'CAMBIO';

  if (e.estado === 'RECHAZADA') {
    return { resolucion: 'RECHAZO', stock: 'No aplica', logistica: 'No aplica', reembolso: 'No aplica' };
  }

  const pendiente = e.estado === 'SOLICITADA' || e.estado === 'EN_EVALUACION';

  if (esCambio) {
    return {
      resolucion: 'CAMBIO',
      stock: pendiente ? 'Se valida al aprobar' : 'Disponible',
      logistica:
        e.estado === 'COMPLETADA'
          ? 'Nuevo despacho coordinado'
          : e.estado === 'APROBADA'
            ? 'Pendiente coordinación'
            : 'Nuevo despacho',
      reembolso: 'No aplica',
    };
  }

  let reembolso = 'Se deriva a F4 al aprobar';
  if (e.resolucion?.reembolso) reembolso = `${e.resolucion.reembolso.reembolsoId} · ${e.resolucion.reembolso.estado}`;
  else if (e.resolucion?.referenciaOperacion) reembolso = `Origen enviado a F4 (${e.resolucion.referenciaOperacion})`;
  else if (e.estado === 'APROBADA') reembolso = 'Pendiente F4';

  return {
    resolucion: 'REEMBOLSO',
    stock: 'No aplica',
    logistica: 'Recojo del producto',
    reembolso,
  };
}
