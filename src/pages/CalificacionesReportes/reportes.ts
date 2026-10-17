// Reportes (Mockup 09, parte F6 — Fabrizio): filtros e indicadores a partir de 2.12.
// Resumen, comparación, detalle y exportación usan esta misma lista de indicadores, para que siempre muestren
// los valores de la consulta aplicada (ficha del Mockup 09, sección 10).
import dayjs from 'dayjs';
import type { Canal } from '@/types/comun';
import type { MetricasDashboard } from '@/types/reclamo';
import { entero, rangoDe, soles, type Rango } from '../Dashboard/metricas';
import { ETIQUETA_CANAL } from '../Reclamos/formato';

/** Opciones preparadas del Periodo (la ficha pide opciones, no un calendario libre). */
export type PeriodoReporte = 'MES_ACTUAL' | 'ULTIMOS_15' | 'MES_ANTERIOR';

export type VistaReporte = 'GENERAL' | 'SATISFACCION' | 'OPERACION';

export const OPCIONES_VISTA: { value: VistaReporte; label: string }[] = [
  { value: 'GENERAL', label: 'Vista general' },
  { value: 'SATISFACCION', label: 'Satisfacción' },
  { value: 'OPERACION', label: 'Operación Postventa' },
];

function mesConAnio(fecha: dayjs.Dayjs): string {
  const texto = fecha.locale('es').format('MMMM YYYY');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function opcionesPeriodo(hoy = dayjs()): { value: PeriodoReporte; label: string }[] {
  return [
    { value: 'MES_ACTUAL', label: mesConAnio(hoy) },
    { value: 'ULTIMOS_15', label: 'Últimos 15 días' },
    { value: 'MES_ANTERIOR', label: mesConAnio(hoy.subtract(1, 'month')) },
  ];
}

export function rangoReporte(periodo: PeriodoReporte): Rango {
  return rangoDe(periodo);
}

export function etiquetaPeriodo(periodo: PeriodoReporte): string {
  return opcionesPeriodo().find((o) => o.value === periodo)?.label ?? '';
}

export function etiquetaCanal(canal: Canal | undefined): string {
  return canal ? ETIQUETA_CANAL[canal] : 'Todos los canales';
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function textoRango({ desde, hasta }: Rango): string {
  return `${fechaCorta(desde)} – ${fechaCorta(hasta)}`;
}

export const csat = (valor: number | null) => (valor === null ? 'Sin encuestas' : `${valor.toFixed(2)} / 5`);

export type ClaveIndicador =
  | 'PEDIDOS'
  | 'ENTREGADOS'
  | 'ANULADOS'
  | 'DEVOLUCIONES'
  | 'REEMBOLSADO'
  | 'CSAT'
  | 'RECLAMOS_SLA';

export interface Indicador {
  clave: ClaveIndicador;
  etiqueta: string;
  /** Valor ya formateado para mostrar. */
  texto: string;
  /** Valor numérico, para comparar; null si no hay dato (CSAT sin encuestas). */
  numero: number | null;
  /** Grupo de la exportación y del detalle operativo. */
  grupo: 'PEDIDOS' | 'POSTVENTA';
}

/** Los 7 indicadores del contrato 2.12, en el orden del Figma. */
export function indicadores(m: MetricasDashboard): Indicador[] {
  return [
    { clave: 'PEDIDOS', etiqueta: 'Pedidos totales', texto: entero(m.pedidos.total), numero: m.pedidos.total, grupo: 'PEDIDOS' },
    { clave: 'ENTREGADOS', etiqueta: 'Entregados', texto: entero(m.pedidos.entregados), numero: m.pedidos.entregados, grupo: 'PEDIDOS' },
    { clave: 'ANULADOS', etiqueta: 'Anulados', texto: entero(m.pedidos.anulados), numero: m.pedidos.anulados, grupo: 'PEDIDOS' },
    {
      clave: 'DEVOLUCIONES',
      etiqueta: 'Devoluciones aprobadas',
      texto: entero(m.postventa.devolucionesAprobadas),
      numero: m.postventa.devolucionesAprobadas,
      grupo: 'POSTVENTA',
    },
    {
      clave: 'REEMBOLSADO',
      etiqueta: 'Monto reembolsado',
      texto: soles(m.postventa.montoReembolsadoPEN),
      numero: m.postventa.montoReembolsadoPEN,
      grupo: 'POSTVENTA',
    },
    { clave: 'CSAT', etiqueta: 'CSAT promedio', texto: csat(m.postventa.csatPromedio), numero: m.postventa.csatPromedio, grupo: 'POSTVENTA' },
    {
      clave: 'RECLAMOS_SLA',
      etiqueta: 'Reclamos pendientes SLA',
      texto: entero(m.postventa.reclamosPendientesSLA),
      numero: m.postventa.reclamosPendientesSLA,
      grupo: 'POSTVENTA',
    },
  ];
}

/** Entregados sobre pedidos del periodo, en %. null si no hubo pedidos. */
export function tasaEntrega(m: MetricasDashboard): number | null {
  return m.pedidos.total > 0 ? (m.pedidos.entregados / m.pedidos.total) * 100 : null;
}

export const porcentaje = (n: number | null) =>
  n === null ? '—' : `${n.toLocaleString('es-PE', { maximumFractionDigits: 1 })}%`;

/** Datos que muestran los modales: siempre los de la consulta aplicada, nunca los controles sin aplicar. */
export interface ContextoReporte {
  periodo: string;
  rango: Rango;
  canal: string;
  actual: MetricasDashboard;
  anterior: MetricasDashboard;
  rangoAnterior: Rango;
}

/**
 * Exportación (ESP-16, sección 8): CSV con exactamente los indicadores de la consulta aplicada, sin volver a
 * llamar al backend. Separador ";" y BOM UTF-8 para que Excel en español lo abra con columnas y tildes.
 */
export function csvReporte(c: ContextoReporte): string {
  const celda = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const valor = (i: Indicador) => (i.numero === null ? '' : String(i.numero));
  const filas = [
    ['Periodo', c.periodo],
    ['Desde', c.rango.desde],
    ['Hasta', c.rango.hasta],
    ['Canal', c.canal],
    ['Última actualización', c.actual.ultimaActualizacion ?? ''],
    [],
    ['Grupo', 'Indicador', 'Valor'],
    ...indicadores(c.actual).map((i) => [i.grupo === 'PEDIDOS' ? 'Pedidos' : 'Postventa', i.etiqueta, valor(i)]),
  ];
  return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n') + '\r\n';
}

export function nombreArchivoReporte(c: ContextoReporte): string {
  const canal = c.canal.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
  return `reporte-ventas-postventa_${c.rango.desde}_${c.rango.hasta}_${canal}.csv`;
}
