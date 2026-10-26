import { describe, expect, it } from 'vitest';
import { admiteAnulacion, ETIQUETA_ESTADO, formatoMonto } from './formato';

describe('formatoMonto', () => {
  it('formatea en soles con dos decimales', () => {
    expect(formatoMonto(214)).toMatch(/^S\/\s?214\.00$/);
  });

  it('separa los miles', () => {
    expect(formatoMonto(1500.5)).toMatch(/1,500\.50$/);
  });
});

describe('admiteAnulacion', () => {
  it('permite anular hasta EN_PREPARACION', () => {
    expect(admiteAnulacion('CREADO')).toBe(true);
    expect(admiteAnulacion('PAGADO')).toBe(true);
    expect(admiteAnulacion('EN_PREPARACION')).toBe(true);
  });

  it('no permite anular desde DESPACHADO en adelante (va por devolución)', () => {
    expect(admiteAnulacion('DESPACHADO')).toBe(false);
    expect(admiteAnulacion('ENTREGADO')).toBe(false);
    expect(admiteAnulacion('ANULADO')).toBe(false);
  });
});

describe('ETIQUETA_ESTADO', () => {
  it('muestra EN_PREPARACION con texto legible', () => {
    expect(ETIQUETA_ESTADO.EN_PREPARACION).toBe('En preparación');
  });
});
