import type {
  ComentarioCliente,
  ContextoCalificaciones,
  ResumenSatisfaccion,
} from '../calificaciones.types';

// Ejemplos exclusivos de la fase visual. No se importan desde services/.
export const contextoCalificacionesEjemplo: ContextoCalificaciones = {
  periodo: 'Septiembre 2026',
  canal: 'TODOS',
};

// El prototipo muestra 4.62 aunque su distribución equivale a 4.04.
// Se conserva aquí como referencia visual; con datos reales ambos deben coincidir.
export const satisfaccionEjemplo: ResumenSatisfaccion = {
  promedio: 4.62,
  distribucion: [
    { puntuacion: 5, porcentaje: 46 },
    { puntuacion: 4, porcentaje: 28 },
    { puntuacion: 3, porcentaje: 14 },
    { puntuacion: 2, porcentaje: 8 },
    { puntuacion: 1, porcentaje: 4 },
  ],
};

export const comentariosEjemplo: readonly ComentarioCliente[] = [
  { pedidoId: 'PED-2026-1042', fecha: '2026-09-18', canal: 'MARKETPLACE', puntuacion: 5, comentario: 'Entrega rápida y excelente atención' },
  { pedidoId: 'PED-2026-1041', fecha: '2026-09-17', canal: 'CHATBOT', puntuacion: 4, comentario: 'Resolvieron mi duda con claridad' },
  { pedidoId: 'PED-2026-1040', fecha: '2026-09-16', canal: 'RETAIL', puntuacion: 2, comentario: 'Demora en el despacho' },
  { pedidoId: 'PED-2026-1039', fecha: '2026-09-15', canal: 'MARKETPLACE', puntuacion: 3, comentario: 'Producto conforme, llegó tarde' },
  { pedidoId: 'PED-2026-1038', fecha: '2026-09-14', canal: 'CHATBOT', puntuacion: 5, comentario: 'Muy buena experiencia' },
  { pedidoId: 'PED-2026-1037', fecha: '2026-09-12', canal: 'MARKETPLACE', puntuacion: 5, comentario: 'Compra simple y despacho correcto' },
  { pedidoId: 'PED-2026-1036', fecha: '2026-09-10', canal: 'RETAIL', puntuacion: 4, comentario: 'Buena atención en tienda' },
  { pedidoId: 'PED-2026-1035', fecha: '2026-09-08', canal: 'CHATBOT', puntuacion: 3, comentario: 'Faltó mayor detalle de seguimiento' },
];
