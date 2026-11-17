import { describe, expect, it } from 'vitest';
import { accesoActivo } from './LayoutGestor';

describe('accesoActivo', () => {
  it('Pedidos queda destacado en la bandeja, el detalle y Anulaciones (Mockups 02 a 04)', () => {
    const tambien = ['/admin/anulaciones'];
    expect(accesoActivo('/admin/pedidos', '/admin/pedidos', tambien)).toBe(true);
    expect(accesoActivo('/admin/pedidos/PED-2026-00102', '/admin/pedidos', tambien)).toBe(true);
    expect(accesoActivo('/admin/anulaciones', '/admin/pedidos', tambien)).toBe(true);
  });

  it('no confunde rutas con el mismo prefijo de texto', () => {
    expect(accesoActivo('/admin/pedidosx', '/admin/pedidos')).toBe(false);
    expect(accesoActivo('/admin/postventa/reclamos', '/admin/pedidos', ['/admin/anulaciones'])).toBe(false);
  });
});
