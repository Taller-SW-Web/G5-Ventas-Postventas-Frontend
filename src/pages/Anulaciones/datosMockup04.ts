export interface ItemBandejaAnulacion {
  solicitudAnulacionId: string;
  pedidoId: string;
  fecha: string;
  cliente: string;
  estadoPedido: 'CREADO' | 'PAGADO' | 'EN_PREPARACION' | 'DESPACHADO' | 'ENTREGADO' | 'ANULADO';
  canal: 'MARKETPLACE' | 'CHATBOT' | 'RETAIL';
  motivo: string;
  autorizacion: 'Pendiente' | 'No requerida' | 'Aprobada' | 'Rechazada';
  solicitud: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EJECUTADA';
  solicitante: string;
  // Efectos previstos / resultados
  efectos: {
    estadoPedido: string;
    stock: string;
    despacho: string;
    reembolso: string;
  };
}

export const CASOS_MOCKUP_04: ItemBandejaAnulacion[] = [
  {
    solicitudAnulacionId: 'ANUL-0012',
    pedidoId: 'PED-2026-1041',
    fecha: '17/09/2026 16:12',
    cliente: 'Carlos Ramírez',
    estadoPedido: 'EN_PREPARACION',
    canal: 'CHATBOT',
    motivo: 'Dirección incorrecta',
    autorizacion: 'Pendiente',
    solicitud: 'PENDIENTE',
    solicitante: 'Carlos Ramírez',
    efectos: {
      estadoPedido: 'Pendiente de decisión',
      stock: 'Reintegrar si se aprueba',
      despacho: 'Cancelar si se aprueba',
      reembolso: 'Originar F4 si se aprueba',
    },
  },
  {
    solicitudAnulacionId: 'ANUL-0011',
    pedidoId: 'PED-2026-1036',
    fecha: '16/09/2026 11:20',
    cliente: 'Lucía Fernández',
    estadoPedido: 'EN_PREPARACION',
    canal: 'MARKETPLACE',
    motivo: 'Solicitud cliente fuera de plazo',
    autorizacion: 'Rechazada',
    solicitud: 'RECHAZADA',
    solicitante: 'Lucía Fernández',
    efectos: {
      estadoPedido: 'EN_PREPARACION (sin cambios)',
      stock: 'Sin cambios',
      despacho: 'Continúa despacho',
      reembolso: 'No aplica',
    },
  },
  {
    solicitudAnulacionId: 'ANUL-0010',
    pedidoId: 'PED-2026-1035',
    fecha: '15/09/2026 09:45',
    cliente: 'Marcos Soto',
    estadoPedido: 'ANULADO',
    canal: 'CHATBOT',
    motivo: 'Pago no completado (timeout)',
    autorizacion: 'No requerida',
    solicitud: 'EJECUTADA',
    solicitante: 'Canal Chatbot (Automático)',
    efectos: {
      estadoPedido: 'ANULADO',
      stock: 'Reserva liberada',
      despacho: 'No aplica',
      reembolso: 'No aplica (sin cobro)',
    },
  },
  {
    solicitudAnulacionId: 'ANUL-0009',
    pedidoId: 'PED-2026-1034',
    fecha: '14/09/2026 18:30',
    cliente: 'Andrea Torres',
    estadoPedido: 'EN_PREPARACION',
    canal: 'RETAIL',
    motivo: 'Error de selección en tienda',
    autorizacion: 'Pendiente',
    solicitud: 'PENDIENTE',
    solicitante: 'Andrea Torres',
    efectos: {
      estadoPedido: 'Pendiente de decisión',
      stock: 'Sin cambios (Retail no reserva)',
      despacho: 'No aplica (recojo tienda)',
      reembolso: 'Originar F4 si se aprueba',
    },
  },
  {
    solicitudAnulacionId: 'ANUL-0008',
    pedidoId: 'PED-2026-1032',
    fecha: '13/09/2026 14:10',
    cliente: 'Jorge Valdivia',
    estadoPedido: 'ANULADO',
    canal: 'MARKETPLACE',
    motivo: 'Arrepentimiento de compra',
    autorizacion: 'Aprobada',
    solicitud: 'APROBADA',
    solicitante: 'Jorge Valdivia',
    efectos: {
      estadoPedido: 'ANULADO',
      stock: 'Reintegrado',
      despacho: 'Cancelado',
      reembolso: 'Generado en F4 (REEM-00045)',
    },
  },
];
