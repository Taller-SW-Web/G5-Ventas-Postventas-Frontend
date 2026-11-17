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

export type ConteoPedidos = MetricasDashboard['pedidos'];

/**
 * Hay dos bases de conteo de pedidos y cada tasa usa una sola:
 * - Cohorte (1.14): pedidos creados en el periodo, con su estado actual. Reemplaza `pedidos` en `actual` y
 *   `anterior`, y es la base de la tasa de anulación, la distribución y los conteos de Reportes y su CSV.
 * - Hechos (2.12 tal cual): pagos, anulaciones y entregas ocurridos en el periodo, por la fecha del hecho
 *   (ESP-15 §6). Es la base de la tasa de devolución, porque devolucionesAprobadas también se cuenta así.
 */
export interface DatosDashboard {
  actual: MetricasDashboard;
  anterior: MetricasDashboard;
  hechos: { actual: ConteoPedidos; anterior: ConteoPedidos };
  ventas: VentasPeriodo;
  ventasAnterior: VentasPeriodo;
  /**
   * Métricas de cada canal; null cuando el filtro ya es un solo canal. `metricas.pedidos` y `pedidos` son la
   * cohorte de 1.14 del canal, así la suma de los canales coincide con el total del periodo.
   */
  porCanal: { canal: Canal; metricas: MetricasDashboard; pedidos: number }[] | null;
}

/** Pone en `pedidos` la cohorte de 1.14 (cada pedido del periodo cuenta una vez, con su estado actual). */
export function conCohorte(m: MetricasDashboard, v: VentasPeriodo): MetricasDashboard {
  return { ...m, pedidos: { total: v.total, anulados: v.anulados, entregados: v.entregados } };
}

export async function cargarDashboard(rango: Rango, canal: Canal | undefined): Promise<DatosDashboard> {
  const [actual, anterior, ventas, ventasAnterior, canales] = await Promise.all([
    obtenerMetricas({ ...rango, canal }),
    obtenerMetricas({ ...rangoAnterior(rango), canal }),
    cargarVentas(rango, canal),
    cargarVentas(rangoAnterior(rango), canal),
    canal
      ? null
      : Promise.all(
          CANALES.map(async (c) => {
            const [m, v] = await Promise.all([obtenerMetricas({ ...rango, canal: c }), cargarVentas(rango, c)]);
            const metricas = conCohorte(m, v);
            return { canal: c, metricas, pedidos: metricas.pedidos.total };
          }),
        ),
  ]);
  return {
    actual: conCohorte(actual, ventas),
    anterior: conCohorte(anterior, ventasAnterior),
    hechos: { actual: actual.pedidos, anterior: anterior.pedidos },
    ventas,
    ventasAnterior,
    porCanal: canales,
  };
}

/**
 * Reclamos abiertos (todo lo que no está ATENDIDO) de todos los canales, sin importar el periodo: la tarjeta
 * "Atención" del Figma cuenta los casos por resolver hoy. 2.10 no filtra por canal. Sale de 2.10 con dos consultas
 * de una sola fila; si falla, el error llega a la pantalla (no se muestra una cifra inventada).
 */
export async function contarReclamosAbiertos(): Promise<number> {
  const [todos, atendidos] = await Promise.all([
    listarReclamos({ tamano: 1 }),
    listarReclamos({ estado: 'ATENDIDO', tamano: 1 }),
  ]);
  return todos.totalElementos - atendidos.totalElementos;
}

/** Anulados sobre pedidos de la cohorte del periodo (1.14), en %. null si no hubo pedidos. */
export function tasaAnulacion(m: MetricasDashboard): number | null {
  return m.pedidos.total > 0 ? (m.pedidos.anulados / m.pedidos.total) * 100 : null;
}

/**
 * Devoluciones aprobadas en el periodo sobre pedidos entregados en el periodo, en %: ambas cifras salen de 2.12
 * por la fecha del hecho, mismo periodo y canal. Es una razón de actividad, no una cohorte: si se aprueban
 * devoluciones de pedidos entregados antes, puede pasar de 100% y se muestra tal cual. null si no hubo entregas.
 */
export function tasaDevolucion(devolucionesAprobadas: number, entregados: number): number | null {
  return entregados > 0 ? (devolucionesAprobadas / entregados) * 100 : null;
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
