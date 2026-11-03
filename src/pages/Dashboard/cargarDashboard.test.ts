// cargarDashboard con 2.12 y 1.14 simulados: qué base de conteo usa cada tasa y que los canales sumen el total.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Canal } from '@/types/comun';
import type { KpisVentas } from '@/types/pedido';
import type { FiltrosMetricas, MetricasDashboard } from '@/types/reclamo';

const { obtenerMetricas, listarReclamos, obtenerKpisVentas } = vi.hoisted(() => ({
  obtenerMetricas: vi.fn(),
  listarReclamos: vi.fn(),
  obtenerKpisVentas: vi.fn(),
}));
vi.mock('@/services/reclamos', () => ({ obtenerMetricas, listarReclamos }));
vi.mock('@/services/pedidos', () => ({ obtenerKpisVentas }));

import { cargarDashboard, contarReclamosAbiertos, tasaAnulacion, tasaDevolucion } from './metricas';

const OCTUBRE = { desde: '2026-10-01', hasta: '2026-10-31' };

/** 2.12: conteos por fecha del hecho. En octubre se aprueban 3 devoluciones de pedidos entregados en septiembre. */
function metricas(f: FiltrosMetricas): MetricasDashboard {
  const octubre = f.desde === OCTUBRE.desde;
  const porCanal: Record<Canal, number> = { MARKETPLACE: 1, CHATBOT: 1, RETAIL: 0 };
  const entregados = octubre ? (f.canal ? porCanal[f.canal] : 2) : 10;
  return {
    periodo: { desde: f.desde, hasta: f.hasta },
    pedidos: { total: octubre ? 9 : 12, anulados: octubre ? 3 : 1, entregados },
    postventa: {
      devolucionesAprobadas: octubre ? (f.canal === 'MARKETPLACE' || !f.canal ? 3 : 0) : 1,
      montoReembolsadoPEN: 0,
      csatPromedio: null,
      reclamosPendientesSLA: 0,
    },
    ultimaActualizacion: null,
  };
}

/** 1.14: cohorte de pedidos creados en el periodo, con su estado actual. */
function kpis(f: { desde: string; hasta: string; canal?: Canal }): KpisVentas {
  const cohorte: Record<Canal, number> = { MARKETPLACE: 5, CHATBOT: 3, RETAIL: 2 };
  const total = f.canal ? cohorte[f.canal] : 10;
  return {
    desde: f.desde,
    hasta: f.hasta,
    canal: f.canal ?? null,
    montoVendido: 0,
    pedidosVendidos: 0,
    ticketPromedio: null,
    pedidosTotal: total,
    pedidosEntregados: 0, // ninguno de los creados en octubre se entregó todavía
    pedidosAnulados: f.canal ? 0 : 2,
    ventasPorDia: [],
    ventasPorCanal: { MARKETPLACE: 0, CHATBOT: 0, RETAIL: 0 },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  obtenerMetricas.mockImplementation(async (f: FiltrosMetricas) => metricas(f));
  obtenerKpisVentas.mockImplementation(async (f: { desde: string; hasta: string; canal?: Canal }) => kpis(f));
});

describe('tasaDevolucion', () => {
  it('es una razón de actividad: puede pasar de 100% y no se recorta', () => {
    expect(tasaDevolucion(3, 2)).toBe(150);
    expect(tasaDevolucion(1, 4)).toBe(25);
  });

  it('sin entregas en el periodo no hay tasa', () => {
    expect(tasaDevolucion(3, 0)).toBeNull();
  });
});

describe('cargarDashboard', () => {
  it('la tasa de devolución usa las entregas de 2.12, no la cohorte de 1.14', async () => {
    const d = await cargarDashboard(OCTUBRE, undefined);

    // La cohorte de octubre no tiene entregas: con ella la tasa quedaría vacía o mezclaría pedidos distintos
    expect(d.actual.pedidos.entregados).toBe(0);
    expect(d.hechos.actual.entregados).toBe(2);
    expect(tasaDevolucion(d.actual.postventa.devolucionesAprobadas, d.hechos.actual.entregados)).toBe(150);
    // El periodo anterior se calcula con la misma definición
    expect(tasaDevolucion(d.anterior.postventa.devolucionesAprobadas, d.hechos.anterior.entregados)).toBe(10);
  });

  it('la tasa de anulación sigue sobre la cohorte de 1.14', async () => {
    const d = await cargarDashboard(OCTUBRE, undefined);

    expect(d.actual.pedidos).toEqual({ total: 10, anulados: 2, entregados: 0 });
    expect(tasaAnulacion(d.actual)).toBe(20);
  });

  it('los pedidos por canal son la cohorte de cada canal y suman el total del periodo', async () => {
    const d = await cargarDashboard(OCTUBRE, undefined);

    expect(d.porCanal?.map((c) => [c.canal, c.pedidos])).toEqual([
      ['MARKETPLACE', 5],
      ['CHATBOT', 3],
      ['RETAIL', 2],
    ]);
    expect(d.porCanal?.reduce((s, c) => s + c.pedidos, 0)).toBe(d.actual.pedidos.total);
    // CSAT y reembolsos por canal siguen saliendo de 2.12 de ese canal
    expect(d.porCanal?.[0].metricas.postventa.devolucionesAprobadas).toBe(3);
    expect(obtenerKpisVentas).toHaveBeenCalledWith({ ...OCTUBRE, canal: 'RETAIL' });
  });

  it('con un canal elegido no consulta los demás canales', async () => {
    const d = await cargarDashboard(OCTUBRE, 'CHATBOT');

    expect(d.porCanal).toBeNull();
    expect(obtenerMetricas).toHaveBeenCalledTimes(2); // periodo y periodo anterior
    expect(obtenerKpisVentas).toHaveBeenCalledTimes(2);
  });

  it('si una API falla, el error llega a la pantalla en vez de datos parciales', async () => {
    obtenerKpisVentas.mockRejectedValue(new Error('M1 no responde'));

    await expect(cargarDashboard(OCTUBRE, undefined)).rejects.toThrow('M1 no responde');
  });
});

describe('contarReclamosAbiertos', () => {
  it('resta los ATENDIDO del total de 2.10', async () => {
    listarReclamos.mockImplementation(async (f: { estado?: string }) => ({
      contenido: [],
      pagina: 0,
      totalPaginas: 1,
      totalElementos: f.estado === 'ATENDIDO' ? 4 : 11,
    }));

    await expect(contarReclamosAbiertos()).resolves.toBe(7);
  });

  it('propaga el error en vez de devolver una cifra', async () => {
    listarReclamos.mockRejectedValue(new Error('M2 no responde'));

    await expect(contarReclamosAbiertos()).rejects.toThrow('M2 no responde');
  });
});
