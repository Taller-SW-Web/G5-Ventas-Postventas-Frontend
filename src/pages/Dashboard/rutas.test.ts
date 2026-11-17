import { describe, expect, it } from 'vitest';
import { rutaPrioritarios } from './rutas';

describe('rutaPrioritarios', () => {
  it('"Ver" lleva el tipo y el mismo código del caso', () => {
    const url = new URL(rutaPrioritarios({ tipo: 'RECLAMO', codigo: 'REC-2026-0052' }), 'http://local');
    expect(url.pathname).toBe('/admin/postventa/prioritarios');
    expect(url.searchParams.get('tipo')).toBe('RECLAMOS');
    expect(url.searchParams.get('caso')).toBe('REC-2026-0052');
    expect(url.searchParams.get('desde')).toBe('dashboard');
  });

  it('"Ver todas" no filtra, pero vuelve al Dashboard', () => {
    const url = new URL(rutaPrioritarios(), 'http://local');
    expect(url.searchParams.get('tipo')).toBeNull();
    expect(url.searchParams.get('caso')).toBeNull();
    expect(url.searchParams.get('desde')).toBe('dashboard');
  });

  it('devoluciones y cambios usan el valor de filtro de su pantalla', () => {
    expect(rutaPrioritarios({ tipo: 'CAMBIO', codigo: 'DEV-2026-0003' })).toContain('tipo=CAMBIOS');
    expect(rutaPrioritarios({ tipo: 'DEVOLUCION', codigo: 'DEV-2026-0004' })).toContain('tipo=DEVOLUCIONES');
  });
});
