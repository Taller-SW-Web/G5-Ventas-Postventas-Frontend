// @vitest-environment jsdom
// Reembolsos (Mockup 08) con 2.6, 2.6b y 2.6c simulados: detalle concreto, enlaces y reintento con la misma clave.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderizar } from '@/test/renderizar';
import { ApiError } from '@/services/api';
import type { DetalleReembolsoResponse, ListadoReembolsos } from '@/types/reembolso';

const { listarReembolsos, obtenerDetalleReembolso, procesarReembolso, detallesDePedidos } = vi.hoisted(() => ({
  listarReembolsos: vi.fn(),
  obtenerDetalleReembolso: vi.fn(),
  procesarReembolso: vi.fn(),
  detallesDePedidos: vi.fn(),
}));
vi.mock('@/services/reembolsos', () => ({ listarReembolsos, obtenerDetalleReembolso, procesarReembolso }));
vi.mock('@/services/pedidos', () => ({ detallesDePedidos }));

import { ReembolsosPage } from './ReembolsosPage';
import { rutaExpedienteOrigen, rutaPedido, rutaReembolso } from './rutasReembolso';

function detalle(cambios: Partial<DetalleReembolsoResponse> = {}): DetalleReembolsoResponse {
  return {
    reembolsoId: 'REEM-00042',
    pedidoId: 'PED-2026-00031',
    origen: 'ANULACION',
    origenId: 'ANUL-0007',
    monto: 80,
    moneda: 'PEN',
    estado: 'EXITOSO',
    transaccionPasarelaId: 'TX-SIM-1',
    fecha: '2026-11-03',
    autorizadorId: null,
    clienteId: null,
    clienteNombre: null,
    canal: 'CHATBOT',
    metodoPago: null,
    total: true,
    claveIdempotencia: 'clave-original',
    intentos: [{ numero: 1, estado: 'EXITOSO', transaccionPasarelaId: 'TX-SIM-1', resultado: 'Extorno confirmado', fecha: '2026-11-03T10:00:00Z' }],
    ...cambios,
  };
}

function listado(d: DetalleReembolsoResponse): ListadoReembolsos {
  return {
    contenido: [{
      reembolsoId: d.reembolsoId, pedidoId: d.pedidoId, origen: d.origen, origenId: d.origenId, monto: d.monto,
      moneda: d.moneda, estado: d.estado, transaccionPasarelaId: d.transaccionPasarelaId, fecha: d.fecha,
      intentos: d.intentos.length, ultimoResultado: null, fechaUltimoIntento: null,
    }],
    pagina: 0,
    totalPaginas: 1,
    totalElementos: 1,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  detallesDePedidos.mockResolvedValue(new Map());
});
afterEach(cleanup);

const ruta = () => screen.getByTestId('ruta-actual').textContent;

describe('rutas de Reembolsos', () => {
  it('apuntan al pedido, al expediente origen y al reembolso concreto', () => {
    expect(rutaPedido('PED-2026-00031')).toBe('/admin/pedidos/PED-2026-00031');
    expect(rutaExpedienteOrigen('DEVOLUCION', 'DEV-2026-0003', 'PED-2026-00031'))
      .toBe('/admin/postventa/devoluciones?expediente=DEV-2026-0003');
    expect(rutaExpedienteOrigen('ANULACION', 'ANUL-0007', 'PED-2026-00031'))
      .toBe('/admin/anulaciones?buscar=PED-2026-00031&solicitud=ANUL-0007');
    expect(rutaReembolso('REEM-00042')).toBe('/admin/postventa/reembolsos?reembolso=REEM-00042');
  });
});

describe('ReembolsosPage', () => {
  it('?reembolso= (desde una devolución) busca ese código y abre su detalle', async () => {
    const d = detalle();
    listarReembolsos.mockResolvedValue(listado(d));
    obtenerDetalleReembolso.mockResolvedValue(d);

    renderizar(<ReembolsosPage />, { ruta: '/admin/postventa/reembolsos?reembolso=REEM-00042' });

    expect(await screen.findByText('Detalle del reembolso')).toBeTruthy();
    expect(obtenerDetalleReembolso).toHaveBeenCalledWith('REEM-00042');
    expect(listarReembolsos).toHaveBeenCalledWith(expect.objectContaining({ buscar: 'REEM-00042' }));
  });

  it('muestra la referencia de pago y los botones abren el pedido y el expediente', async () => {
    const d = detalle();
    listarReembolsos.mockResolvedValue(listado(d));
    obtenerDetalleReembolso.mockResolvedValue(d);

    renderizar(<ReembolsosPage />, { ruta: '/admin/postventa/reembolsos?reembolso=REEM-00042' });
    const panel = within(await screen.findByLabelText('Detalle del reembolso'));
    const referencia = panel.getByText('Referencia de pago').nextElementSibling;
    expect(referencia?.textContent).toBe('TX-SIM-1');

    fireEvent.click(panel.getByRole('button', { name: 'Volver al pedido' }));
    expect(ruta()).toBe('/admin/pedidos/PED-2026-00031');
  });

  it('"Ver expediente origen" abre la anulación concreta y la flecha vuelve al Hub', async () => {
    const d = detalle();
    listarReembolsos.mockResolvedValue(listado(d));
    obtenerDetalleReembolso.mockResolvedValue(d);

    renderizar(<ReembolsosPage />, { ruta: '/admin/postventa/reembolsos?reembolso=REEM-00042' });
    fireEvent.click(await screen.findByRole('button', { name: 'Ver expediente origen' }));
    expect(ruta()).toBe('/admin/anulaciones?buscar=PED-2026-00031&solicitud=ANUL-0007');

    fireEvent.click(screen.getByRole('button', { name: 'Volver al Hub Postventa' }));
    expect(ruta()).toBe('/admin/postventa');
  });

  it('el reintento reenvía la misma clave idempotente y muestra lo que confirmó el servidor', async () => {
    const fallido = detalle({ estado: 'FALLIDO', transaccionPasarelaId: null,
      intentos: [{ numero: 1, estado: 'FALLIDO', transaccionPasarelaId: null, resultado: 'Rechazado', fecha: '2026-11-03T10:00:00Z' }] });
    listarReembolsos.mockResolvedValue(listado(fallido));
    obtenerDetalleReembolso.mockResolvedValueOnce(fallido).mockResolvedValue(detalle());
    procesarReembolso.mockResolvedValue({ reembolsoId: 'REEM-00042', transaccionPasarelaId: 'TX-SIM-1', estado: 'EXITOSO',
      monto: 80, moneda: 'PEN', fechaEjecucion: '2026-11-03T11:00:00Z' });

    renderizar(<ReembolsosPage />, { ruta: '/admin/postventa/reembolsos?reembolso=REEM-00042' });
    fireEvent.click(await screen.findByRole('button', { name: 'Reintento seguro' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Preparar reintento' }));

    await waitFor(() => expect(procesarReembolso).toHaveBeenCalledTimes(1));
    expect(procesarReembolso).toHaveBeenCalledWith(
      { origen: 'ANULACION', origenId: 'ANUL-0007', referenciaId: 'PED-2026-00031', monto: 80, moneda: 'PEN' },
      'clave-original',
    );
    expect(await screen.findByText('Resultado del reembolso')).toBeTruthy();
  });

  it('si el reintento falla muestra el error y no un resultado', async () => {
    const fallido = detalle({ estado: 'FALLIDO', transaccionPasarelaId: null, intentos: [] });
    listarReembolsos.mockResolvedValue(listado(fallido));
    obtenerDetalleReembolso.mockResolvedValue(fallido);
    procesarReembolso.mockRejectedValue(new ApiError(403, 'ACCESO_DENEGADO', 'Sin permiso para reintentar'));

    renderizar(<ReembolsosPage />, { ruta: '/admin/postventa/reembolsos?reembolso=REEM-00042' });
    fireEvent.click(await screen.findByRole('button', { name: 'Reintento seguro' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Preparar reintento' }));

    expect(await screen.findByText('Sin permiso para reintentar')).toBeTruthy();
    expect(screen.queryByText('Resultado del reembolso')).toBeNull();
  });
});
