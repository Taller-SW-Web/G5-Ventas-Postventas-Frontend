// La exportación (ESP-16, sección 8) debe conservar los filtros aplicados y los valores visibles.
import { describe, expect, it } from 'vitest';
import type { MetricasDashboard } from '@/types/reclamo';
import { csvReporte, indicadores, nombreArchivoReporte, type ContextoReporte } from './reportes';

const actual: MetricasDashboard = {
  periodo: { desde: '2026-09-01', hasta: '2026-09-30' },
  pedidos: { total: 5420, anulados: 115, entregados: 4980 },
  postventa: { devolucionesAprobadas: 45, montoReembolsadoPEN: 5890.5, csatPromedio: 4.6, reclamosPendientesSLA: 3 },
  ultimaActualizacion: '2026-09-30T22:00:00Z',
};

const contexto: ContextoReporte = {
  periodo: 'Septiembre 2026',
  rango: { desde: '2026-09-01', hasta: '2026-09-30' },
  canal: 'Chatbot',
  actual,
  anterior: actual,
  rangoAnterior: { desde: '2026-08-02', hasta: '2026-08-31' },
};

function filas(csv: string): string[][] {
  return csv.replace(/^﻿/, '').trimEnd().split('\r\n').map((f) => f.split(';'));
}

describe('csvReporte', () => {
  it('lleva los mismos filtros de la consulta aplicada', () => {
    const f = filas(csvReporte(contexto));
    expect(f.slice(0, 5)).toEqual([
      ['Periodo', 'Septiembre 2026'],
      ['Desde', '2026-09-01'],
      ['Hasta', '2026-09-30'],
      ['Canal', 'Chatbot'],
      ['Última actualización', '2026-09-30T22:00:00Z'],
    ]);
  });

  it('exporta los 7 indicadores visibles, en el mismo orden y con los mismos decimales', () => {
    const f = filas(csvReporte(contexto)).slice(7);
    expect(f.map((x) => x[1])).toEqual(indicadores(actual).map((i) => i.etiqueta));
    expect(f).toEqual([
      ['Pedidos', 'Pedidos totales', '5420'],
      ['Pedidos', 'Entregados', '4980'],
      ['Pedidos', 'Anulados', '115'],
      ['Postventa', 'Devoluciones aprobadas', '45'],
      ['Postventa', 'Monto reembolsado', '5890.50'],
      ['Postventa', 'CSAT promedio', '4.60'],
      ['Postventa', 'Reclamos pendientes SLA', '3'],
    ]);
  });

  it('CSAT sin encuestas se exporta con el texto que muestra la pantalla, no como 0', () => {
    const sinCsat = { ...contexto, actual: { ...actual, postventa: { ...actual.postventa, csatPromedio: null } } };
    const csat = filas(csvReporte(sinCsat)).find((x) => x[1] === 'CSAT promedio');
    expect(csat?.[2]).toBe('Sin encuestas');
  });

  it('empieza con BOM UTF-8 para Excel', () => {
    expect(csvReporte(contexto).startsWith('﻿')).toBe(true);
  });
});

describe('nombreArchivoReporte', () => {
  it('incluye el rango y el canal aplicados', () => {
    expect(nombreArchivoReporte({ ...contexto, canal: 'Todos los canales' })).toBe(
      'reporte-ventas-postventa_2026-09-01_2026-09-30_todos-los-canales.csv',
    );
  });
});
