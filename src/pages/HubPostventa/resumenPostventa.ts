// Indicadores del Hub Postventa (Mockup 05). El Hub no tiene endpoint propio (guía frontend 1.1):
// cada número sale del servicio de su módulo.
import dayjs from 'dayjs';
import { fuenteDevoluciones } from '@/pages/Devoluciones/fuenteDevoluciones';
import type { EstadoDevolucion } from '@/types/devolucion';

export interface IndicadorPostventa {
  cantidad: number;
  /** Etiqueta de apoyo bajo la cifra ("+2 hoy", "2 por SLA"...). */
  detalle: string;
}

export interface ResumenPostventa {
  devoluciones: IndicadorPostventa;
  reclamos: IndicadorPostventa;
  reembolsos: IndicadorPostventa;
}

/** Pendiente = todavía requiere una decisión del Gestor. */
export const ESTADOS_DEVOLUCION_PENDIENTE: EstadoDevolucion[] = ['SOLICITADA', 'EN_EVALUACION'];

// Valores fijos del Mockup 05 hasta que haya de dónde sacarlos:
// - Reclamos: conectar con listarReclamos (2.10) cuando la bandeja de Fabrizio esté en main.
// - Reembolsos: el contrato todavía no tiene un listado de reembolsos (solo 2.6 POST).
const RECLAMOS_DEMO: IndicadorPostventa = { cantidad: 5, detalle: '2 por SLA' };
const REEMBOLSOS_DEMO: IndicadorPostventa = { cantidad: 3, detalle: '1 por ejecutar' };

async function indicadorDevoluciones(): Promise<IndicadorPostventa> {
  const listados = await Promise.all(
    ESTADOS_DEVOLUCION_PENDIENTE.map((estado) =>
      fuenteDevoluciones.listar({ estado, pagina: 0, tamano: 100 }),
    ),
  );
  const pendientes = listados.flatMap((l) => l.contenido);
  const hoy = pendientes.filter((d) => dayjs(d.fechaRegistro).isSame(dayjs(), 'day')).length;
  return {
    cantidad: listados.reduce((total, l) => total + l.totalElementos, 0),
    detalle: hoy > 0 ? `+${hoy} hoy` : 'Sin nuevas hoy',
  };
}

export async function obtenerResumenPostventa(): Promise<ResumenPostventa> {
  return {
    devoluciones: await indicadorDevoluciones(),
    reclamos: RECLAMOS_DEMO,
    reembolsos: REEMBOLSOS_DEMO,
  };
}
