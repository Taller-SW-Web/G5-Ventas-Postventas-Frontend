// @vitest-environment jsdom
// Bloque "Pago" del Detalle del pedido: muestra pago.estado de 1.3 tal cual lo envía M1, aunque el pedido esté
// ANULADO, y con una respuesta anterior sin el campo solo deduce lo que el historial asegura.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderizar } from '@/test/renderizar';
import type { EstadoPago, HistorialEstado, PedidoDetalle } from '@/types/pedido';
import { estadoPago } from './estadoPago';

const { obtenerPedido, iniciarPreparacion, sellarPaquete } = vi.hoisted(() => ({
  obtenerPedido: vi.fn(),
  iniciarPreparacion: vi.fn(),
  sellarPaquete: vi.fn(),
}));
vi.mock('@/services/pedidos', () => ({ obtenerPedido, iniciarPreparacion, sellarPaquete }));

import { DetallePedidoPage } from './DetallePedidoPage';

const CREADO: HistorialEstado = { estado: 'CREADO', fecha: '2026-11-04T05:22:58Z', actor: 'CANAL_CHATBOT', motivo: 'Registro inicial de compra' };
const ANULADO_CLIENTE: HistorialEstado = { estado: 'ANULADO', fecha: '2026-11-04T05:22:59Z', actor: 'CLIENTE', motivo: 'SOLICITUD_CLIENTE' };
const ANULADO_PASARELA: HistorialEstado = { estado: 'ANULADO', fecha: '2026-11-04T05:23:00Z', actor: 'PASARELA_PAGOS', motivo: 'PAGO_NO_COMPLETADO' };
const PAGADO: HistorialEstado = { estado: 'PAGADO', fecha: '2026-11-04T05:23:00Z', actor: 'PASARELA_PAGOS', motivo: 'Confirmación de cobro exitoso' };

/** Pedido ANULADO de ejemplo; `estadoPago` undefined simula un M1 anterior que no envía el campo. */
function pedido(estadoDelPago: EstadoPago | null | undefined, historial: HistorialEstado[] = [CREADO, ANULADO_CLIENTE],
                estado: PedidoDetalle['estado'] = 'ANULADO'): PedidoDetalle {
  const pago: PedidoDetalle['pago'] = { total: 60, moneda: 'PEN', metodoPago: 'TARJETA_CREDITO' };
  if (estadoDelPago !== undefined) pago.estado = estadoDelPago;
  return {
    pedidoId: 'PED-2026-00002',
    canal: 'CHATBOT',
    estado,
    contacto: { clienteId: '11111111-1111-4111-8111-111111111111', nombreCompleto: 'Cliente Prueba', tipoDocumento: 'DNI', numeroDocumento: '40000002', email: 'cliente@example.test' },
    pago,
    envio: { modalidad: 'DELIVERY', direccion: 'Calle de prueba 123', distrito: 'Lince', tiendaId: null },
    items: [{ productoId: 'PROD-101', sku: 'SKU-01', descripcion: 'Producto de prueba', cantidad: 1, precioUnitario: 50 }],
    fechaCreacion: '2026-11-04T05:22:58Z',
    ultimaActualizacion: historial[historial.length - 1].fecha,
    historialEstados: historial,
  } as PedidoDetalle;
}

/** Texto que la pantalla muestra junto a "Estado del pago". */
async function estadoDelPagoEnPantalla(p: PedidoDetalle): Promise<string> {
  obtenerPedido.mockResolvedValue(p);
  renderizar(<DetallePedidoPage />, { ruta: `/admin/pedidos/${p.pedidoId}`, patron: '/admin/pedidos/:pedidoId' });
  const etiqueta = await screen.findByText('Estado del pago');
  return (etiqueta.nextElementSibling?.textContent ?? '').trim();
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Detalle del pedido — estado del pago (1.3 pago.estado)', () => {
  it('pedido ANULADO con el cobro CONFIRMADO: muestra Confirmado, no lo deduce del pedido', async () => {
    expect(await estadoDelPagoEnPantalla(pedido('CONFIRMADO'))).toBe('Confirmado');
    expect(screen.queryByText('Anulado', { selector: '.mantine-Badge-label' })).toBeNull();
  });

  it('pedido ANULADO con el pago PENDIENTE: muestra Pendiente', async () => {
    expect(await estadoDelPagoEnPantalla(pedido('PENDIENTE'))).toBe('Pendiente');
  });

  it('pedido ANULADO con el pago RECHAZADO: muestra Rechazado', async () => {
    expect(await estadoDelPagoEnPantalla(pedido('RECHAZADO', [CREADO, ANULADO_PASARELA]))).toBe('Rechazado');
  });

  it('respuesta anterior sin el campo y anulado antes del cobro: Sin información (no inventa Anulado ni Reembolsado)', async () => {
    const texto = await estadoDelPagoEnPantalla(pedido(undefined));
    expect(texto).toBe('Sin información');
    expect(screen.queryByText(/Reembolsado|Pago anulado/)).toBeNull();
  });

  it('respuesta anterior sin el campo con PAGADO en el historial: Confirmado', async () => {
    expect(await estadoDelPagoEnPantalla(pedido(undefined, [CREADO, PAGADO, { ...ANULADO_CLIENTE, fecha: '2026-11-04T06:00:00Z' }]))).toBe('Confirmado');
  });
});

describe('estadoPago sin pago.estado (respuestas anteriores al 2026-11-04)', () => {
  it('solo deduce lo que el historial asegura', () => {
    expect(estadoPago(pedido(undefined, [CREADO], 'CREADO')).texto).toBe('Pendiente');
    expect(estadoPago(pedido(undefined, [CREADO, ANULADO_PASARELA])).texto).toBe('Rechazado');
    expect(estadoPago(pedido(undefined, [CREADO, ANULADO_CLIENTE])).texto).toBe('Sin información');
    // Una orden de reemplazo pasa a EN_PREPARACION sin cobro: no se supone Confirmado
    expect(estadoPago(pedido(undefined, [CREADO, { ...CREADO, estado: 'EN_PREPARACION', actor: 'SISTEMA_PRODUCTOS' }], 'EN_PREPARACION')).texto).toBe('Sin información');
  });

  it('con el campo en null (sin registro de pago) muestra Sin información', () => {
    expect(estadoPago(pedido(null)).texto).toBe('Sin información');
  });
});
