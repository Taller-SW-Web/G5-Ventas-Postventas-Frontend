// Casos de "Atención prioritaria" (Mockup 05): reclamos por SLA (2.10) + expedientes de F3 pendientes de
// evaluación (2.4). No hay endpoint propio: se arma con lo que expone cada módulo.
import { listarDevoluciones } from '@/services/devoluciones';
import { obtenerPedido } from '@/services/pedidos';
import { listarReclamos } from '@/services/reclamos';
import { ETIQUETA_MOTIVO } from '@/pages/Devoluciones/formato';
import { ETIQUETA_MOTIVO as ETIQUETA_MOTIVO_RECLAMO } from '@/pages/Reclamos/formato';
import type { DevolucionResumen, EstadoDevolucion } from '@/types/devolucion';
import type { ReclamoResumen } from '@/types/reclamo';

export type TipoCaso = 'RECLAMO' | 'DEVOLUCION' | 'CAMBIO';
export type SituacionCaso = 'VENCIDO' | 'PROXIMO_A_VENCER' | 'PENDIENTE_EVALUACION' | 'EN_EVALUACION';
export type PrioridadCaso = 'ALTA' | 'MEDIA';

export interface CasoPrioritario {
  codigo: string;
  fecha: string;
  tipo: TipoCaso;
  cliente: string;
  contexto: string;
  situacion: SituacionCaso;
  prioridad: PrioridadCaso;
  /** Pantalla donde se sigue gestionando el caso. */
  ruta: string;
}

export interface CasosPrioritarios {
  casos: CasoPrioritario[];
  /** Módulos que no respondieron: la bandeja muestra lo que sí llegó. */
  avisos: string[];
}

export const ETIQUETA_TIPO_CASO: Record<TipoCaso, string> = {
  RECLAMO: 'Reclamo',
  DEVOLUCION: 'Devolución',
  CAMBIO: 'Cambio',
};

export const ETIQUETA_SITUACION: Record<SituacionCaso, string> = {
  VENCIDO: 'Vencido',
  PROXIMO_A_VENCER: 'Próximo a vencer',
  PENDIENTE_EVALUACION: 'Pendiente evaluación',
  EN_EVALUACION: 'En evaluación',
};

export const ETIQUETA_PRIORIDAD: Record<PrioridadCaso, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
};

/** Tope por consulta: la bandeja es un resumen de prioridades, no el listado completo de cada módulo. */
const TAMANO_MAXIMO = 100;

function aCasoReclamo(r: ReclamoResumen): CasoPrioritario {
  const vencido = r.estadoSla === 'VENCIDO';
  return {
    codigo: r.codigoSeguimiento,
    fecha: r.fechaRegistro,
    tipo: 'RECLAMO',
    cliente: r.nombreConsumidor ?? '—',
    contexto: ETIQUETA_MOTIVO_RECLAMO[r.motivo],
    situacion: vencido ? 'VENCIDO' : 'PROXIMO_A_VENCER',
    // Vencidos y críticos (0 a 2 días hábiles) van primero.
    prioridad: vencido || r.estadoSla === 'CRITICO' ? 'ALTA' : 'MEDIA',
    ruta: `/admin/postventa/reclamos?codigo=${encodeURIComponent(r.codigoSeguimiento)}`,
  };
}

function aCasoDevolucion(d: DevolucionResumen, cliente: string): CasoPrioritario {
  return {
    codigo: d.devolucionId,
    fecha: d.fechaRegistro,
    tipo: d.tipo === 'CAMBIO' ? 'CAMBIO' : 'DEVOLUCION',
    cliente,
    contexto: ETIQUETA_MOTIVO[d.motivo],
    situacion: d.estado === 'SOLICITADA' ? 'PENDIENTE_EVALUACION' : 'EN_EVALUACION',
    prioridad: 'MEDIA',
    ruta: `/admin/postventa/devoluciones?expediente=${encodeURIComponent(d.devolucionId)}`,
  };
}

async function casosReclamos(): Promise<CasoPrioritario[]> {
  // El backend excluye los ATENDIDO del filtro sla; POR_VENCER incluye CRITICO.
  const [vencidos, porVencer] = await Promise.all([
    listarReclamos({ sla: 'VENCIDO', orden: 'ANTIGUOS', pagina: 0, tamano: TAMANO_MAXIMO }),
    listarReclamos({ sla: 'POR_VENCER', orden: 'ANTIGUOS', pagina: 0, tamano: TAMANO_MAXIMO }),
  ]);
  const urgencia = (r: ReclamoResumen) => r.diasHabilesRestantes ?? Number.NEGATIVE_INFINITY;
  return [...vencidos.contenido, ...porVencer.contenido]
    .sort((a, b) => urgencia(a) - urgencia(b))
    .map(aCasoReclamo);
}

/** M2 no guarda el nombre del cliente: se lee del pedido en M1 (una consulta por pedido distinto). */
async function nombresPorPedido(pedidos: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(pedidos)];
  const nombres = await Promise.all(
    unicos.map((id) =>
      obtenerPedido(id)
        .then((p) => p.contacto.nombreCompleto)
        .catch(() => '—'),
    ),
  );
  return new Map(unicos.map((id, i) => [id, nombres[i]]));
}

async function casosDevoluciones(): Promise<CasoPrioritario[]> {
  const estados: EstadoDevolucion[] = ['EN_EVALUACION', 'SOLICITADA'];
  const listados = await Promise.all(
    estados.map((estado) =>
      listarDevoluciones({ estado, orden: 'ANTIGUOS', pagina: 0, tamano: TAMANO_MAXIMO }),
    ),
  );
  const expedientes = listados.flatMap((l) => l.contenido);
  const nombres = await nombresPorPedido(expedientes.map((d) => d.pedidoId));
  return expedientes.map((d) => aCasoDevolucion(d, nombres.get(d.pedidoId) ?? '—'));
}

/** Primero los reclamos por SLA (más urgentes antes), luego los expedientes de F3 más antiguos. */
export async function obtenerCasosPrioritarios(): Promise<CasosPrioritarios> {
  const [reclamos, devoluciones] = await Promise.allSettled([casosReclamos(), casosDevoluciones()]);
  if (reclamos.status === 'rejected' && devoluciones.status === 'rejected') throw reclamos.reason;

  const avisos: string[] = [];
  if (reclamos.status === 'rejected') avisos.push('No se pudieron cargar los reclamos.');
  if (devoluciones.status === 'rejected') avisos.push('No se pudieron cargar las devoluciones y cambios.');

  return {
    casos: [
      ...(reclamos.status === 'fulfilled' ? reclamos.value : []),
      ...(devoluciones.status === 'fulfilled' ? devoluciones.value : []),
    ],
    avisos,
  };
}
