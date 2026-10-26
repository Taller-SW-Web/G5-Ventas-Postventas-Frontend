// Cálculos del Dashboard a partir de 2.12. Las tasas y variaciones se calculan aquí con las mismas
// cifras que entrega el backend; no se inventa ningún valor que el contrato no tenga.
import dayjs from 'dayjs';
import { obtenerKpisVentas } from '@/services/pedidos';
import { listarReclamos, obtenerMetricas } from '@/services/reclamos';
import type { Canal } from '@/types/comun';
import type { KpisVentas } from '@/types/pedido';
import type { MetricasDashboard } from '@/types/reclamo';

export const CANALES: Canal[] = ['MARKETPLACE', 'CHATBOT', 'RETAIL'];

export type ClavePeriodo = 'MES_ACTUAL' | 'MES_ANTERIOR' | 'ULTIMOS_15' | 'ULTIMOS_30';

export const OPCIONES_PERIODO: { value: ClavePeriodo; label: string }[] = [
  { value: 'MES_ACTUAL', label: 'Este mes' },
  { value: 'MES_ANTERIOR', label: 'Mes anterior' },
  { value: 'ULTIMOS_15', label: 'Últimos 15 días' },
  { value: 'ULTIMOS_30', label: 'Últimos 30 días' },
];

export interface Rango {
  desde: string;
  hasta: string;
}

const F = 'YYYY-MM-DD';

export function rangoDe(periodo: ClavePeriodo, hoy = dayjs()): Rango {
  switch (periodo) {
    case 'MES_ACTUAL':
      return { desde: hoy.startOf('month').format(F), hasta: hoy.format(F) };
    case 'MES_ANTERIOR': {
      const mes = hoy.subtract(1, 'month');
      return { desde: mes.startOf('month').format(F), hasta: mes.endOf('month').format(F) };
    }
    case 'ULTIMOS_15':
      return { desde: hoy.subtract(14, 'day').format(F), hasta: hoy.format(F) };
    case 'ULTIMOS_30':
      return { desde: hoy.subtract(29, 'day').format(F), hasta: hoy.format(F) };
  }
}

/** Periodo inmediatamente anterior y de la misma cantidad de días, para las variaciones de las tarjetas. */
export function rangoAnterior({ desde, hasta }: Rango): Rango {
  const dias = dayjs(hasta).diff(dayjs(desde), 'day') + 1;
  const fin = dayjs(desde).subtract(1, 'day');
  return { desde: fin.subtract(dias - 1, 'day').format(F), hasta: fin.format(F) };
}

/**
 * Importes de venta del periodo. 2.12 no los entrega, así que vienen de 1.14 (GET /api/v1/pedidos/kpis), que M1
 * ya devuelve sumados: pedidos creados en el periodo que se pagaron y no se anularon. También da la cohorte de
 * pedidos del periodo (total, entregados y anulados) para que la tasa de anulación no supere el 100%.
 */
export interface VentasPeriodo {
  monto: number;
  /** Pedidos vendidos (pagados y no anulados). */
  vendidos: number;
  /** Pedidos únicos del periodo, sin los que siguen esperando el pago (CREADO). */
  total: number;
  entregados: number;
  anulados: number;
  porDia: { fecha: string; monto: number }[];
  porCanal: Record<Canal, number>;
}

export async function cargarVentas({ desde, hasta }: Rango, canal: Canal | undefined): Promise<VentasPeriodo> {
  return aVentasPeriodo(await obtenerKpisVentas({ desde, hasta, canal }));
}

/** Pasa la respuesta de 1.14 al formato que usa la pantalla. */
export function aVentasPeriodo(k: KpisVentas): VentasPeriodo {
  return {
    monto: k.montoVendido,
    vendidos: k.pedidosVendidos,
    total: k.pedidosTotal,
    entregados: k.pedidosEntregados,
    anulados: k.pedidosAnulados,
    porDia: k.ventasPorDia.map((d) => ({ fecha: d.fecha, monto: d.monto })),
    porCanal: Object.fromEntries(CANALES.map((c) => [c, k.ventasPorCanal[c] ?? 0])) as Record<Canal, number>,
  };
}

export interface DatosDashboard {
  actual: MetricasDashboard;
  anterior: MetricasDashboard;
  ventas: VentasPeriodo;
  ventasAnterior: VentasPeriodo;
  /** Métricas completas de cada canal; null cuando el filtro ya es un solo canal. */
  porCanal: { canal: Canal; metricas: MetricasDashboard; pedidos: number }[] | null;
}

export async function cargarDashboard(rango: Rango, canal: Canal | undefined): Promise<DatosDashboard> {
  const [actual, anterior, ventas, ventasAnterior, ...canales] = await Promise.all([
    obtenerMetricas({ ...rango, canal }),
    obtenerMetricas({ ...rangoAnterior(rango), canal }),
    cargarVentas(rango, canal),
    cargarVentas(rangoAnterior(rango), canal),
    ...(canal ? [] : CANALES.map((c) => obtenerMetricas({ ...rango, canal: c }))),
  ]);
  // Tasas y distribución sobre la misma cohorte de pedidos del periodo (cada pedido cuenta una vez)
  const conCohorte = (m: MetricasDashboard, v: VentasPeriodo): MetricasDashboard => ({
    ...m,
    pedidos: { total: v.total, anulados: v.anulados, entregados: v.entregados },
  });
  return {
    actual: conCohorte(actual, ventas),
    anterior: conCohorte(anterior, ventasAnterior),
    ventas,
    ventasAnterior,
    porCanal: canal
      ? null
      : canales.map((m, i) => ({ canal: CANALES[i], metricas: m, pedidos: m.pedidos.total })),
  };
}

/**
 * Reclamos abiertos (todo lo que no está ATENDIDO), sin importar el periodo: la tarjeta "Atención" del Figma
 * cuenta los casos por resolver hoy. Sale de 2.10 con dos consultas de una sola fila. null si no se pudo consultar.
 */
export async function contarReclamosAbiertos(): Promise<number | null> {
  try {
    const [todos, atendidos] = await Promise.all([
      listarReclamos({ tamano: 1 }),
      listarReclamos({ estado: 'ATENDIDO', tamano: 1 }),
    ]);
    return Math.max(0, todos.totalElementos - atendidos.totalElementos);
  } catch {
    return null;
  }
}

/** Anulados sobre pedidos del periodo, en %. null si no hubo pedidos. */
export function tasaAnulacion(m: MetricasDashboard): number | null {
  return m.pedidos.total > 0 ? (m.pedidos.anulados / m.pedidos.total) * 100 : null;
}

/** Devoluciones aprobadas sobre pedidos entregados del periodo, en %. null si no hubo entregas. */
export function tasaDevolucion(m: MetricasDashboard): number | null {
  return m.pedidos.entregados > 0 ? (m.postventa.devolucionesAprobadas / m.pedidos.entregados) * 100 : null;
}

/** Variación porcentual (cantidades). null si el periodo anterior fue 0 o no hay dato. */
export function variacionPorcentual(actual: number | null, anterior: number | null): number | null {
  if (actual === null || anterior === null || anterior === 0) return null;
  return ((actual - anterior) / anterior) * 100;
}

/** Diferencia simple (tasas en puntos porcentuales, CSAT en puntos). */
export function diferencia(actual: number | null, anterior: number | null): number | null {
  return actual === null || anterior === null ? null : actual - anterior;
}

export const soles = (monto: number) =>
  `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const entero = (n: number) => n.toLocaleString('es-PE');
