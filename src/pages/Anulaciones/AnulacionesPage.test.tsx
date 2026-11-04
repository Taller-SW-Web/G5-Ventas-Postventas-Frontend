// @vitest-environment jsdom
// Bandeja de Anulaciones con 1.7, 1.8 y 1.9 simulados: sin casos de ejemplo y sin éxito local.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderizar } from '@/test/renderizar';
import { ApiError } from '@/services/api';
import type { AnulacionPendiente, ListadoAnulacionesPendientes } from '@/types/pedido';

const { listarAnulaciones, resolverAnulacion, solicitarAnulacion, detallesDePedidos } = vi.hoisted(() => ({
  listarAnulaciones: vi.fn(),
  resolverAnulacion: vi.fn(),
  solicitarAnulacion: vi.fn(),
  detallesDePedidos: vi.fn(),
}));
vi.mock('@/services/anulaciones', () => ({ listarAnulaciones, resolverAnulacion, solicitarAnulacion }));
vi.mock('@/services/pedidos', () => ({ detallesDePedidos }));

import { AnulacionesPage } from './AnulacionesPage';

function fila(estado: AnulacionPendiente['estado']): AnulacionPendiente {
  return {
    solicitudAnulacionId: 'ANUL-0007',
    pedidoId: 'PED-2026-00031',
    motivo: 'SOLICITUD_CLIENTE',
    fechaSolicitud: '2026-11-03T10:00:00Z',
    estado,
    canal: 'CHATBOT',
    nombreCliente: 'Cliente de prueba',
    estadoPedido: estado === 'EJECUTADA' ? 'ANULADO' : 'EN_PREPARACION',
  };
}

const listado = (...contenido: AnulacionPendiente[]): ListadoAnulacionesPendientes => ({
  contenido,
  pagina: 0,
  totalPaginas: 1,
  totalElementos: contenido.length,
});

beforeEach(() => {
  vi.resetAllMocks();
  detallesDePedidos.mockResolvedValue(new Map());
});
afterEach(cleanup);

async function abrirCaso() {
  fireEvent.click(await screen.findByRole('button', { name: 'Revisar' }));
  return screen.findByText('Detalle de solicitud');
}

describe('AnulacionesPage', () => {
  it('si 1.8 falla muestra el error y Reintentar, sin casos de ejemplo', async () => {
    listarAnulaciones.mockRejectedValueOnce(new ApiError(503, 'SERVICIO_NO_DISPONIBLE', 'M1 no responde'));
    listarAnulaciones.mockResolvedValueOnce(listado(fila('PENDIENTE_AUTORIZACION')));

    renderizar(<AnulacionesPage />);

    expect(await screen.findByText('No se pudo cargar la información')).toBeTruthy();
    expect(screen.getByText('M1 no responde')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Revisar' })).toBeNull();
    expect(screen.queryByText(/Modo Demostración/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('PED-2026-00031')).toBeTruthy();
    expect(listarAnulaciones).toHaveBeenCalledTimes(2);
  });

  it('si falta un dato del pedido muestra "—", no un canal inventado', async () => {
    listarAnulaciones.mockResolvedValue(
      listado({ ...fila('PENDIENTE_AUTORIZACION'), canal: undefined, nombreCliente: null }),
    );

    renderizar(<AnulacionesPage />);

    await screen.findByText('PED-2026-00031');
    const tabla = within(screen.getByRole('table'));
    expect(tabla.queryByText('MARKETPLACE')).toBeNull();
    expect(tabla.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('una aprobación que falla en el servidor no se anuncia ni cambia el caso', async () => {
    listarAnulaciones.mockResolvedValue(listado(fila('PENDIENTE_AUTORIZACION')));
    resolverAnulacion.mockRejectedValue(new ApiError(500, 'ERROR_INTERNO', 'Falla al guardar la decisión'));

    renderizar(<AnulacionesPage />);
    await abrirCaso();
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar anulación' }));
    const modal = await screen.findByRole('dialog');
    fireEvent.change(within(modal).getByLabelText(/Justificación/), { target: { value: 'Validado con el cliente' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Confirmar aprobación' }));

    expect(await screen.findByText('Falla al guardar la decisión')).toBeTruthy();
    expect(screen.queryByText('Anulación aprobada')).toBeNull();
    // El panel sigue pendiente: la fila sale de 1.8, no de un resultado local
    expect(screen.getByRole('button', { name: 'Aprobar anulación' })).toBeTruthy();
    expect(resolverAnulacion).toHaveBeenCalledWith('PED-2026-00031', 'ANUL-0007', expect.objectContaining({
      decision: 'APROBADA',
      comentario: 'Validado con el cliente',
    }));
  });

  it('tras aprobar vuelve a consultar y muestra el estado que confirmó el servidor', async () => {
    listarAnulaciones
      .mockResolvedValueOnce(listado(fila('PENDIENTE_AUTORIZACION')))
      .mockResolvedValue(listado(fila('EJECUTADA')));
    resolverAnulacion.mockResolvedValue({ pedidoId: 'PED-2026-00031', estadoPedido: 'ANULADO', estadoAnulacion: 'EJECUTADA' });

    renderizar(<AnulacionesPage />);
    await abrirCaso();
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar anulación' }));
    const modal = await screen.findByRole('dialog');
    fireEvent.change(within(modal).getByLabelText(/Justificación/), { target: { value: 'Validado' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Confirmar aprobación' }));

    expect(await screen.findByText('Anulación aprobada')).toBeTruthy();
    await waitFor(() => expect(listarAnulaciones).toHaveBeenCalledTimes(2));
    // La columna Solicitud muestra el estado del contrato (EJECUTADA), no una etiqueta propia
    expect(await screen.findByText(/Esta solicitud ya ha sido resuelta \(EJECUTADA\)/)).toBeTruthy();
  });

  it('un 409 del servidor recarga la bandeja en vez de inventar el rechazo', async () => {
    listarAnulaciones
      .mockResolvedValueOnce(listado(fila('PENDIENTE_AUTORIZACION')))
      .mockResolvedValue(listado(fila('RECHAZADA')));
    resolverAnulacion.mockRejectedValue(new ApiError(409, 'PEDIDO_EN_CAMINO', 'El paquete ya salió'));

    renderizar(<AnulacionesPage />);
    await abrirCaso();
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar anulación' }));
    const modal = await screen.findByRole('dialog');
    fireEvent.change(within(modal).getByLabelText(/Justificación/), { target: { value: 'Validado' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Confirmar aprobación' }));

    expect(await screen.findByText('El paquete ya salió')).toBeTruthy();
    await waitFor(() => expect(listarAnulaciones).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/Esta solicitud ya ha sido resuelta \(RECHAZADA\)/)).toBeTruthy();
  });

  it('una solicitud nueva que falla no crea un caso local', async () => {
    listarAnulaciones.mockResolvedValue(listado());
    solicitarAnulacion.mockRejectedValue(new ApiError(409, 'TRANSICION_NO_PERMITIDA', 'El pedido ya fue despachado'));

    renderizar(<AnulacionesPage />);
    await screen.findByText('No hay solicitudes de anulación con estos filtros.');
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar anulación' }));
    const modal = await screen.findByRole('dialog');
    fireEvent.change(within(modal).getByLabelText(/Código de Pedido/), { target: { value: 'PED-2026-00040' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Enviar solicitud' }));

    expect(await screen.findByText('El pedido ya fue despachado')).toBeTruthy();
    expect(screen.queryByText(/Solicitud registrada|Pedido anulado/)).toBeNull();
    expect(screen.queryByText('PED-2026-00040')).toBeNull();
  });

  it('?buscar=&solicitud= (desde un reembolso) busca el pedido y abre esa solicitud', async () => {
    listarAnulaciones.mockResolvedValue(listado(fila('EJECUTADA')));

    renderizar(<AnulacionesPage />, { ruta: '/admin/anulaciones?buscar=PED-2026-00031&solicitud=ANUL-0007' });

    expect(await screen.findByText('Detalle de solicitud')).toBeTruthy();
    expect(listarAnulaciones).toHaveBeenCalledWith(expect.objectContaining({ busqueda: 'PED-2026-00031' }));
  });

  it('la búsqueda se prepara y solo consulta al pulsar Aplicar filtros (Mockup 04, 5.4)', async () => {
    listarAnulaciones.mockResolvedValue(listado(fila('PENDIENTE_AUTORIZACION')));

    renderizar(<AnulacionesPage />);
    await screen.findByText('PED-2026-00031');
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'PED-2026-00099' } });
    await new Promise((r) => setTimeout(r, 400));
    expect(listarAnulaciones).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() =>
      expect(listarAnulaciones).toHaveBeenLastCalledWith(expect.objectContaining({ busqueda: 'PED-2026-00099', page: 0 })),
    );
  });

  it('"Volver al pedido" abre el detalle del pedido de la solicitud', async () => {
    listarAnulaciones.mockResolvedValue(listado(fila('EJECUTADA')));

    renderizar(<AnulacionesPage />);
    await abrirCaso();
    fireEvent.click(screen.getByRole('button', { name: 'Volver al pedido' }));

    expect(screen.getByTestId('ruta-actual').textContent).toBe('/admin/pedidos/PED-2026-00031');
  });
});
