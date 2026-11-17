// @vitest-environment jsdom
// Vista de evidencias del expediente: un PDF no se incrusta (un iframe bloqueado no avisa); se abre en otra pestaña.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { renderizar } from '@/test/renderizar';
import type { Evidencia } from '@/types/devolucion';
import type { Expediente } from './expediente';
import { EvidenciaExpediente } from './EvidenciaExpediente';

const PDF = 'http://localhost:8082/uploads/evidencias/2b1f.pdf';
const FOTO = 'http://localhost:8082/uploads/evidencias/7c9e.png';

function expediente(evidencias: Evidencia[]): Expediente {
  return {
    devolucion: { devolucionId: 'DEV-2026-0003', pedidoId: 'PED-2026-00031', fechaRegistro: '2026-11-03T10:00:00Z', evidencias },
    pedido: null,
  } as unknown as Expediente;
}

afterEach(cleanup);

describe('EvidenciaExpediente', () => {
  it('un PDF se presenta para abrir en otra pestaña, sin iframe ni documento simulado', async () => {
    renderizar(<EvidenciaExpediente expediente={expediente([{ tipo: 'DOCUMENTO', url: PDF }])} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir PDF' }));
    const modal = await screen.findByRole('dialog');

    expect(within(modal).getByText('El PDF se abre en otra pestaña')).toBeTruthy();
    const enlace = within(modal).getByRole('link', { name: 'Abrir PDF en otra pestaña' });
    expect(enlace.getAttribute('href')).toBe(PDF);
    expect(enlace.getAttribute('target')).toBe('_blank');
    expect(modal.querySelector('iframe')).toBeNull();
    expect(within(modal).queryByText('COMPROBANTE DE COMPRA')).toBeNull();
  });

  it('un PDF sin URL lo dice y no ofrece un enlace roto', async () => {
    renderizar(<EvidenciaExpediente expediente={expediente([{ tipo: 'DOCUMENTO', url: '' }])} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir PDF' }));
    const modal = await screen.findByRole('dialog');

    expect(within(modal).getByText('El comprobante no tiene un archivo disponible')).toBeTruthy();
    expect(within(modal).queryByRole('link')).toBeNull();
  });

  it('una foto que no carga lo avisa y conserva el enlace al original', async () => {
    renderizar(<EvidenciaExpediente expediente={expediente([{ tipo: 'IMAGEN', url: FOTO }])} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver foto' }));
    const modal = await screen.findByRole('dialog');
    fireEvent.error(within(modal).getByRole('img', { name: 'Foto del producto reportado' }));

    expect(await within(modal).findByText('No se pudo cargar la imagen')).toBeTruthy();
    expect(within(modal).getByRole('link', { name: 'Abrir el archivo original' }).getAttribute('href')).toBe(FOTO);
  });
});
