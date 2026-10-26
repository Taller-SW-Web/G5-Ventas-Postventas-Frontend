import { describe, expect, it } from 'vitest';
import { dia, fecha, textoPlazo, textoSlaCorto } from './formato';

describe('textoPlazo', () => {
  it('cuenta los días hábiles que quedan', () => {
    expect(textoPlazo(5)).toBe('Quedan 5 días hábiles');
    expect(textoPlazo(1)).toBe('Quedan 1 día hábil');
  });

  it('avisa cuando vence hoy o ya venció', () => {
    expect(textoPlazo(0)).toBe('Vence hoy');
    expect(textoPlazo(-1)).toBe('Vencido (+1 día)');
    expect(textoPlazo(-3)).toBe('Vencido (+3 días)');
  });

  it('sin días, muestra si el SLA se cumplió', () => {
    expect(textoPlazo(null, true)).toBe('Cumplido');
    expect(textoPlazo(undefined, false)).toBe('Excedido');
    expect(textoPlazo(null)).toBe('');
  });
});

describe('textoSlaCorto', () => {
  it('muestra Atendido si el reclamo ya fue atendido', () => {
    expect(textoSlaCorto('ATENDIDO', 4)).toBe('Atendido');
  });

  it('usa el texto corto del Figma', () => {
    expect(textoSlaCorto('EN_PLAZO', 15)).toBe('Quedan 15 días');
    expect(textoSlaCorto('VENCIDO', -5)).toBe('Vencido (+5 días)');
  });
});

describe('fechas', () => {
  it('muestra un guion si no hay fecha', () => {
    expect(dia(null)).toBe('—');
    expect(fecha(undefined)).toBe('—');
  });

  it('fecha toma el día UTC del límite del SLA', () => {
    expect(fecha('2026-09-23T23:59:59Z')).toBe('23/09/2026');
  });
});
