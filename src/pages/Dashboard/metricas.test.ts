import { describe, expect, it } from 'vitest';
import type { KpisVentas } from '@/types/pedido';
import { aVentasPeriodo, rangoAnterior } from './metricas';

const kpis: KpisVentas = {
  desde: '2026-10-01',
  hasta: '2026-10-02',
  canal: null,
  montoVendido: 180,
  pedidosVendidos: 3,
  ticketPromedio: 60,
  pedidosTotal: 4,
  pedidosEntregados: 1,
  pedidosAnulados: 1,
  ventasPorDia: [
    { fecha: '2026-10-01', monto: 150 },
    { fecha: '2026-10-02', monto: 30 },
  ],
  ventasPorCanal: { MARKETPLACE: 50, CHATBOT: 100, RETAIL: 30 },
};

describe('aVentasPeriodo', () => {
  it('pasa la respuesta de 1.14 al formato de la pantalla', () => {
    const v = aVentasPeriodo(kpis);
    expect(v.monto).toBe(180);
    expect(v.vendidos).toBe(3);
    expect(v.total).toBe(4);
    expect(v.entregados).toBe(1);
    expect(v.anulados).toBe(1);
    expect(v.porDia).toHaveLength(2);
    expect(v.porCanal.CHATBOT).toBe(100);
  });

  it('completa con 0 los canales que no vengan', () => {
    const v = aVentasPeriodo({ ...kpis, ventasPorCanal: { CHATBOT: 10 } as KpisVentas['ventasPorCanal'] });
    expect(v.porCanal).toEqual({ MARKETPLACE: 0, CHATBOT: 10, RETAIL: 0 });
  });
});

describe('rangoAnterior', () => {
  it('devuelve el periodo inmediatamente anterior con la misma cantidad de días', () => {
    expect(rangoAnterior({ desde: '2026-10-11', hasta: '2026-10-20' })).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-10',
    });
  });
});
