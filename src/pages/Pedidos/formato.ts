// Formatos de F1 compartidos por la bandeja (Mockup 02) y el detalle (Mockup 03).
import type { Canal } from '@/types/comun';
import type { ActorHistorial, EstadoPedido } from '@/types/pedido';

const MONEDA = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

/** 214 → "S/ 214.00" */
export function formatoMonto(monto: number): string {
  return MONEDA.format(monto);
}

/** ISO → "18/09/2026" (hora local del navegador). */
export function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** ISO → "18/09/2026 03:15" */
export function formatoFechaHora(iso: string): string {
  const fecha = new Date(iso);
  return `${formatoFecha(iso)} ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

export const ETIQUETA_CANAL: Record<Canal, string> = {
  MARKETPLACE: 'Marketplace',
  CHATBOT: 'Chatbot',
  RETAIL: 'Retail',
};

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  CREADO: 'Creado',
  PAGADO: 'Pagado',
  EN_PREPARACION: 'En preparación',
  DESPACHADO: 'Despachado',
  ENTREGADO: 'Entregado',
  ANULADO: 'Anulado',
};

export const ETIQUETA_ACTOR: Record<ActorHistorial, string> = {
  CLIENTE: 'Cliente',
  GESTOR: 'Gestor',
  CANAL_CHATBOT: 'Chatbot',
  PASARELA_PAGOS: 'Pasarela de pagos',
  SISTEMA_LOGISTICA: 'Despacho',
  SISTEMA_PRODUCTOS: 'Productos',
};

/** El Gestor puede pedir la anulación hasta EN_PREPARACION; después va por devolución (M2). */
export function admiteAnulacion(estado: EstadoPedido): boolean {
  return estado === 'CREADO' || estado === 'PAGADO' || estado === 'EN_PREPARACION';
}
