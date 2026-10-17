// Datos de prueba fijos del Mockup 06 (los 14 expedientes del Figma), con la forma del contrato 2.3.
// Solo se usan mientras M2 no exponga 2.3–2.5 (ver fuenteDevoluciones.ts).
import type { Canal } from '@/types/comun';
import type {
  DevolucionDetalle,
  EstadoDevolucion,
  MotivoDevolucion,
  TipoDevolucion,
} from '@/types/devolucion';

interface Fila {
  id: string;
  /** dd/mm del 2026 */
  registro: string;
  entrega: string;
  pedido: string;
  tipo: TipoDevolucion;
  motivo: MotivoDevolucion;
  descripcion: string;
  estado: EstadoDevolucion;
  canal: Canal;
  cliente: string;
}

// El Figma muestra el detalle del motivo ("Talla incorrecta"); el contrato solo admite el catálogo cerrado,
// así que el detalle va en `descripcion` y el motivo es el valor del catálogo.
const FILAS: Fila[] = [
  { id: 'DEV-2026-0214', registro: '18/09', entrega: '16/09', pedido: 'PED-2026-1042', tipo: 'CAMBIO', motivo: 'PRODUCTO_INCORRECTO', descripcion: 'Talla incorrecta', estado: 'EN_EVALUACION', canal: 'MARKETPLACE', cliente: 'Ana López' },
  { id: 'DEV-2026-0213', registro: '17/09', entrega: '15/09', pedido: 'PED-2026-1041', tipo: 'DEVOLUCION_DINERO', motivo: 'PRODUCTO_DEFECTUOSO', descripcion: 'Producto defectuoso', estado: 'SOLICITADA', canal: 'CHATBOT', cliente: 'Carlos Ramírez' },
  { id: 'DEV-2026-0209', registro: '16/09', entrega: '13/09', pedido: 'PED-2026-1039', tipo: 'CAMBIO', motivo: 'PRODUCTO_INCORRECTO', descripcion: 'Color equivocado', estado: 'APROBADA', canal: 'RETAIL', cliente: 'María Torres' },
  { id: 'DEV-2026-0207', registro: '15/09', entrega: '12/09', pedido: 'PED-2026-1038', tipo: 'DEVOLUCION_DINERO', motivo: 'PRODUCTO_DANADO', descripcion: 'Producto dañado', estado: 'RECHAZADA', canal: 'MARKETPLACE', cliente: 'Jorge Salazar' },
  { id: 'DEV-2026-0205', registro: '14/09', entrega: '11/09', pedido: 'PED-2026-1037', tipo: 'DEVOLUCION_DINERO', motivo: 'PRODUCTO_DEFECTUOSO', descripcion: 'Producto defectuoso', estado: 'EN_EVALUACION', canal: 'RETAIL', cliente: 'Lucía Fernández' },
  { id: 'DEV-2026-0202', registro: '13/09', entrega: '10/09', pedido: 'PED-2026-1036', tipo: 'CAMBIO', motivo: 'PRODUCTO_INCORRECTO', descripcion: 'Talla incorrecta', estado: 'COMPLETADA', canal: 'CHATBOT', cliente: 'Diego Paredes' },
  { id: 'DEV-2026-0199', registro: '12/09', entrega: '09/09', pedido: 'PED-2026-1035', tipo: 'DEVOLUCION_DINERO', motivo: 'OTRO', descripcion: 'Empaque abierto', estado: 'APROBADA', canal: 'MARKETPLACE', cliente: 'Valeria Núñez' },
  { id: 'DEV-2026-0197', registro: '11/09', entrega: '08/09', pedido: 'PED-2026-1034', tipo: 'CAMBIO', motivo: 'PRODUCTO_INCORRECTO', descripcion: 'Modelo equivocado', estado: 'SOLICITADA', canal: 'RETAIL', cliente: 'Renato Quispe' },
  { id: 'DEV-2026-0194', registro: '10/09', entrega: '07/09', pedido: 'PED-2026-1033', tipo: 'DEVOLUCION_DINERO', motivo: 'PRODUCTO_DANADO', descripcion: 'Producto dañado', estado: 'COMPLETADA', canal: 'CHATBOT', cliente: 'Camila Rojas' },
  { id: 'DEV-2026-0191', registro: '09/09', entrega: '06/09', pedido: 'PED-2026-1032', tipo: 'CAMBIO', motivo: 'PRODUCTO_INCORRECTO', descripcion: 'Color equivocado', estado: 'RECHAZADA', canal: 'MARKETPLACE', cliente: 'Andrés Vega' },
  { id: 'DEV-2026-0188', registro: '08/09', entrega: '05/09', pedido: 'PED-2026-1031', tipo: 'DEVOLUCION_DINERO', motivo: 'PRODUCTO_DEFECTUOSO', descripcion: 'Producto defectuoso', estado: 'SOLICITADA', canal: 'MARKETPLACE', cliente: 'Sofía Mendoza' },
  { id: 'DEV-2026-0186', registro: '08/09', entrega: '04/09', pedido: 'PED-2026-1030', tipo: 'CAMBIO', motivo: 'PRODUCTO_INCORRECTO', descripcion: 'Talla incorrecta', estado: 'EN_EVALUACION', canal: 'CHATBOT', cliente: 'Martín Huamán' },
  { id: 'DEV-2026-0184', registro: '07/09', entrega: '04/09', pedido: 'PED-2026-1029', tipo: 'DEVOLUCION_DINERO', motivo: 'PRODUCTO_DANADO', descripcion: 'Producto dañado', estado: 'APROBADA', canal: 'RETAIL', cliente: 'Paola Castillo' },
  { id: 'DEV-2026-0182', registro: '06/09', entrega: '03/09', pedido: 'PED-2026-1028', tipo: 'CAMBIO', motivo: 'PRODUCTO_INCORRECTO', descripcion: 'Modelo equivocado', estado: 'COMPLETADA', canal: 'MARKETPLACE', cliente: 'Luis Fuentes' },
];

function isoUtc(ddmm: string, hora: string): string {
  const [dia, mes] = ddmm.split('/');
  return `2026-${mes}-${dia}T${hora}Z`;
}

const AUTORIZADOR_DEMO = 'GESTOR-03';

function aDetalle(f: Fila, indice: number): DevolucionDetalle {
  const registro = isoUtc(f.registro, '15:51:00');
  const resuelta = f.estado === 'APROBADA' || f.estado === 'RECHAZADA' || f.estado === 'COMPLETADA';
  const tipoResolucion =
    f.estado === 'RECHAZADA' ? 'RECHAZO' : f.tipo === 'CAMBIO' ? 'CAMBIO' : 'REEMBOLSO';

  return {
    devolucionId: f.id,
    pedidoId: f.pedido,
    clienteId: `3f9a2b7e-6c1d-4e2a-9b3f-${String(indice).padStart(12, '0')}`,
    tipo: f.tipo,
    estado: f.estado,
    motivo: f.motivo,
    descripcion: f.descripcion,
    items: [{ productoId: `PROD-${101 + indice}`, cantidad: 1 }],
    evidencias: [
      { tipo: 'IMAGEN', url: '' },
      { tipo: 'DOCUMENTO', url: '' },
    ],
    resolucion: resuelta
      ? {
          decision: f.estado === 'RECHAZADA' ? 'RECHAZADA' : 'APROBADA',
          tipoResolucion,
          fundamento: f.estado === 'RECHAZADA' ? 'Evidencia insuficiente para validar la solicitud' : null,
          autorizadorId: AUTORIZADOR_DEMO,
          fechaResolucion: isoUtc(f.registro, '18:00:00'),
          // Las devoluciones de dinero ya completadas tienen su reembolso en F4.
          referenciaOperacion:
            tipoResolucion === 'REEMBOLSO' && f.estado === 'COMPLETADA' ? `REEM-9${f.id.slice(-4)}` : null,
        }
      : null,
    fechaRegistro: registro,
    canal: f.canal,
    nombreCliente: f.cliente,
    fechaEntrega: isoUtc(f.entrega, '12:00:00'),
  };
}

export const DEVOLUCIONES_MOCKUP_06: DevolucionDetalle[] = FILAS.map(aDetalle);
