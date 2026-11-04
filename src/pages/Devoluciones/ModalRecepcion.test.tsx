// @vitest-environment jsdom
// Confirmar recepción (2.5b) con evidencia (2.1) simulada: un fallo de subida no se presenta como adjunto.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderizar } from '@/test/renderizar';
import { ApiError } from '@/services/api';
import type { Expediente } from './expediente';

const { subirEvidencia, confirmarRecepcion } = vi.hoisted(() => ({
  subirEvidencia: vi.fn(),
  confirmarRecepcion: vi.fn(),
}));
vi.mock('@/services/devoluciones', () => ({ subirEvidencia, confirmarRecepcion }));

import { ModalRecepcion } from './ModalRecepcion';

// Solo los campos que usa el modal
const expediente = {
  devolucion: { devolucionId: 'DEV-2026-0003', pedidoId: 'PED-2026-00031', items: [{ productoId: 'PROD-1', cantidad: 1 }], recepciones: [] },
  pedido: { items: [{ productoId: 'PROD-1', sku: 'SKU-1', descripcion: 'Zapatilla de prueba' }] },
} as unknown as Expediente;

const foto = () => new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'recepcion.png', { type: 'image/png' });

function abrir(onConfirmado = vi.fn()) {
  renderizar(<ModalRecepcion abierto expediente={expediente} onCerrar={vi.fn()} onConfirmado={onConfirmado} />);
  const modal = screen.getByRole('dialog');
  const input = modal.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [foto()] } });
  return { modal, onConfirmado };
}

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe('ModalRecepcion', () => {
  it('si la subida falla avisa del error y no registra la recepción', async () => {
    subirEvidencia.mockRejectedValue(new ApiError(403, 'ACCESO_DENEGADO', 'No tienes permisos para realizar esta acción.'));
    const { modal, onConfirmado } = abrir();

    fireEvent.click(within(modal).getByRole('button', { name: 'Confirmar recepción' }));

    expect(await screen.findByText('No se pudo adjuntar la evidencia')).toBeTruthy();
    expect(screen.getByText(/La recepción no se registró/)).toBeTruthy();
    expect(confirmarRecepcion).not.toHaveBeenCalled();
    expect(onConfirmado).not.toHaveBeenCalled();
    expect(screen.queryByText(/Recepción confirmada/)).toBeNull();
  });

  it('envía la URL que devolvió el servidor y anuncia la recepción solo cuando 2.5b responde', async () => {
    subirEvidencia.mockResolvedValue({ url: 'http://localhost:8082/uploads/evidencias/abc.png' });
    confirmarRecepcion.mockResolvedValue({ reintegroSolicitado: true });
    const { modal, onConfirmado } = abrir();

    fireEvent.click(within(modal).getByRole('button', { name: 'Confirmar recepción' }));

    expect(await screen.findByText(/Recepción confirmada/)).toBeTruthy();
    expect(confirmarRecepcion).toHaveBeenCalledWith('DEV-2026-0003', {
      lineas: [{ sku: 'SKU-1', cantidadRecibida: 1, cantidadApta: 1 }],
      evidencia: 'http://localhost:8082/uploads/evidencias/abc.png',
    });
    expect(onConfirmado).toHaveBeenCalled();
  });

  it('si falla la recepción, el reintento reutiliza la evidencia ya subida', async () => {
    subirEvidencia.mockResolvedValue({ url: 'http://localhost:8082/uploads/evidencias/abc.png' });
    confirmarRecepcion
      .mockRejectedValueOnce(new ApiError(503, 'SERVICIO_NO_DISPONIBLE', 'Productos no responde'))
      .mockResolvedValueOnce({ reintegroSolicitado: false });
    const { modal } = abrir();
    const confirmar = within(modal).getByRole('button', { name: 'Confirmar recepción' });

    fireEvent.click(confirmar);
    expect(await screen.findByText('Productos no responde')).toBeTruthy();
    await waitFor(() => expect(confirmar.hasAttribute('disabled')).toBe(false));
    fireEvent.click(confirmar);

    expect(await screen.findByText(/Recepción confirmada/)).toBeTruthy();
    expect(subirEvidencia).toHaveBeenCalledTimes(1);
    expect(confirmarRecepcion).toHaveBeenCalledTimes(2);
  });
});
