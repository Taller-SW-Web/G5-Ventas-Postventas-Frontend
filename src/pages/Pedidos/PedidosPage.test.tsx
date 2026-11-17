// @vitest-environment jsdom
// Bandeja de Pedidos (Mockup 02) con 1.4 simulado: el detalle rápido se abre al lado del listado.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderizar } from '@/test/renderizar';
import type { ListadoPedidos, PedidoResumen } from '@/types/pedido';

const { listarPedidos, contarPedidos } = vi.hoisted(() => ({ listarPedidos: vi.fn(), contarPedidos: vi.fn() }));
vi.mock('@/services/pedidos', () => ({ listarPedidos, contarPedidos }));

import { PedidosPage, resumenPagina } from './PedidosPage';

const pedido = (n: number): PedidoResumen => ({
  pedidoId: `PED-2026-000${n}`,
  canal: 'CHATBOT',
  estado: 'PAGADO',
  total: 10 * n,
  moneda: 'PEN',
  fechaCreacion: '2026-11-03T10:00:00Z',
  nombreCliente: `Cliente ${n}`,
});

function pagina(numero: number): ListadoPedidos {
  return { contenido: [pedido(numero * 10 + 1), pedido(numero * 10 + 2)], pagina: numero, totalPaginas: 2, totalElementos: 4, clienteId: null };
}

beforeEach(() => {
  vi.resetAllMocks();
  listarPedidos.mockImplementation(async (f: { pagina?: number }) => pagina(f.pagina ?? 0));
  contarPedidos.mockResolvedValue(4);
});
afterEach(cleanup);

const ruta = () => screen.getByTestId('ruta-actual').textContent;

describe('PedidosPage', () => {
  it('"Ver detalle" abre el detalle rápido sin salir de la bandeja; el detalle completo se abre desde el panel', async () => {
    renderizar(<PedidosPage />, { ruta: '/admin/pedidos' });
    const fila = (await screen.findByText('PED-2026-0001')).closest('tr')!;

    fireEvent.click(within(fila).getByRole('button', { name: 'Ver detalle' }));

    const panel = within(await screen.findByLabelText('Detalle rápido'));
    expect(panel.getByText('Cliente 1')).toBeTruthy();
    expect(ruta()).toBe('/admin/pedidos');
    expect(fila.getAttribute('aria-selected')).toBe('true');

    fireEvent.click(panel.getByRole('button', { name: 'Ver detalle completo' }));
    expect(ruta()).toBe('/admin/pedidos/PED-2026-0001');
  });

  it('cambiar de página oculta el detalle rápido del registro anterior', async () => {
    renderizar(<PedidosPage />, { ruta: '/admin/pedidos' });
    fireEvent.click(await screen.findByText('PED-2026-0001'));
    await screen.findByLabelText('Detalle rápido');

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await screen.findByText('PED-2026-00011');
    await waitFor(() => expect(screen.queryByLabelText('Detalle rápido')).toBeNull());
  });

  it('el pie muestra el intervalo de la página', () => {
    expect(resumenPagina(0, 10, 10, 23)).toBe('Mostrando 1–10 de 23 pedidos');
    expect(resumenPagina(2, 10, 3, 23)).toBe('Mostrando 21–23 de 23 pedidos');
    expect(resumenPagina(0, 10, 0, 0)).toBe('0 de 0 pedidos');
  });
});
