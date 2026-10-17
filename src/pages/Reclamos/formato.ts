// Textos y formatos de la pantalla de Reclamos. Los valores siguen siendo los del contrato;
// aquí solo se decide cómo se leen en pantalla.
import dayjs from 'dayjs';
import type { Canal } from '@/types/comun';
import type { EstadoSla, MotivoReclamo, TipoReclamo } from '@/types/reclamo';

export const ETIQUETA_MOTIVO: Record<MotivoReclamo, string> = {
  INCUMPLIMIENTO_PLAZO_ENTREGA: 'Incumplimiento de plazo',
  PRODUCTO_DEFECTUOSO_O_INCORRECTO: 'Producto defectuoso o incorrecto',
  COBRO_INDEBIDO_O_NO_RECONOCIDO: 'Cobro indebido o no reconocido',
  ATENCION_INADECUADA: 'Atención inadecuada',
  INCUMPLIMIENTO_GARANTIA: 'Incumplimiento de garantía',
};

export const ETIQUETA_TIPO: Record<TipoReclamo, string> = {
  RECLAMO: 'Reclamo',
  QUEJA: 'Queja',
};

export const ETIQUETA_CANAL: Record<Canal, string> = {
  MARKETPLACE: 'Marketplace',
  CHATBOT: 'Chatbot',
  RETAIL: 'Retail',
};

/** Fecha y hora local, ej. 23/09/2026 08:30. */
export function fechaHora(iso: string | null | undefined): string {
  return iso ? dayjs(iso).format('DD/MM/YYYY HH:mm') : '—';
}

/** Día local de un instante, ej. 21/09/2026 (fecha de registro en la bandeja, como en el Figma). */
export function dia(iso: string | null | undefined): string {
  return iso ? dayjs(iso).format('DD/MM/YYYY') : '—';
}

/** Solo el día. Para fechaLimiteSLA se toma el día UTC (23:59:59Z), que es el día límite real. */
export function fecha(iso: string | null | undefined): string {
  return iso ? dayjs(iso.slice(0, 10)).format('DD/MM/YYYY') : '—';
}

/**
 * Cuenta regresiva del plazo (propuesta UX 01): "Quedan 5 días hábiles", "Vence hoy", "Vencido (+3 días)".
 * Ya atendido: "Cumplido" o "Excedido".
 */
export function textoPlazo(dias: number | null | undefined, slaCumplido?: boolean | null): string {
  if (dias === null || dias === undefined) {
    if (slaCumplido === true) return 'Cumplido';
    if (slaCumplido === false) return 'Excedido';
    return '';
  }
  if (dias === 0) return 'Vence hoy';
  if (dias < 0) return `Vencido (+${-dias} ${-dias === 1 ? 'día' : 'días'})`;
  return `Quedan ${dias} ${dias === 1 ? 'día hábil' : 'días hábiles'}`;
}

/** Texto dentro del badge de la bandeja, como en el Figma: "Quedan 15 días", "Vencido (+5 días)", "Atendido". */
export function textoSlaCorto(sla: EstadoSla, dias: number | null | undefined): string {
  if (sla === 'ATENDIDO' || dias === null || dias === undefined) return 'Atendido';
  if (dias === 0) return 'Vence hoy';
  if (dias < 0) return `Vencido (+${-dias} ${-dias === 1 ? 'día' : 'días'})`;
  return `Quedan ${dias} ${dias === 1 ? 'día' : 'días'}`;
}
