// @vitest-environment jsdom
// El título del Modal de Mantine ya es un <h2>: no debe llevar otro encabezado dentro (HTML inválido, aviso de React).
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderizar } from '@/test/renderizar';
import type { MetricasDashboard } from '@/types/reclamo';
import { ModalExportar } from './ModalExportar';
import type { ContextoReporte } from './reportes';

const actual: MetricasDashboard = {
  periodo: { desde: '2026-11-01', hasta: '2026-11-04' },
  pedidos: { total: 16, anulados: 15, entregados: 0 },
  postventa: { devolucionesAprobadas: 0, montoReembolsadoPEN: 780, csatPromedio: null, reclamosPendientesSLA: 0 },
  ultimaActualizacion: '2026-11-04T05:49:00Z',
};

const contexto: ContextoReporte = {
  periodo: 'Noviembre 2026',
  rango: { desde: '2026-11-01', hasta: '2026-11-04' },
  canal: 'Todos los canales',
  actual,
  anterior: actual,
  rangoAnterior: { desde: '2026-10-28', hasta: '2026-10-31' },
};

describe('ModalExportar', () => {
  it('usa el título del modal como único encabezado, sin anidar otro', async () => {
    const errores = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderizar(<ModalExportar abierto contexto={contexto} onCerrar={() => {}} />);

    const titulo = await screen.findByRole('heading', { level: 2, name: 'Exportar reporte' });
    expect(titulo.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(errores.mock.calls.flat().join(' ')).not.toMatch(/cannot be a child of|cannot contain a nested/);
    errores.mockRestore();
  });
});
