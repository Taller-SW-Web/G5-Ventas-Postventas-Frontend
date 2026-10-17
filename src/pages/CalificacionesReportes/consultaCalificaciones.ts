import type { ListadoCalificaciones } from '@/types/consultaCalificaciones';
import type { Puntuacion } from '@/types/calificacion';
import type { ComentarioCliente, ResumenSatisfaccion } from './calificaciones.types';

const NOTAS: Puntuacion[] = [5, 4, 3, 2, 1];

export function resumenSatisfaccion(datos: ListadoCalificaciones | null): ResumenSatisfaccion {
  const resumen = datos?.resumen;
  return {
    promedio: resumen?.promedio ?? null,
    // Las cantidades del backend corresponden al periodo completo, no a la página visible.
    distribucion: !resumen?.total ? [] : NOTAS.map((puntuacion) => ({
      puntuacion,
      porcentaje: Math.round(resumen.distribucion[puntuacion] / resumen.total * 1000) / 10,
    })),
  };
}

export function comentariosClientes(datos: ListadoCalificaciones | null): ComentarioCliente[] {
  return (datos?.contenido ?? []).map(({ puntaje, comentario, ...fila }) => ({
    ...fila,
    puntuacion: puntaje,
    comentario: comentario?.trim() || 'Sin comentario',
  }));
}
