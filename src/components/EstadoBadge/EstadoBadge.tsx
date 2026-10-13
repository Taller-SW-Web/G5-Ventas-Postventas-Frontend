// Badge único de estados de negocio (stack-frontend.md 3.3).
// Ninguna pantalla pinta un estado con un <span> y color propio: se usa este componente.
import { Badge, type BadgeProps } from '@mantine/core';
import type { EstadoPedido, EstadoAnulacion } from '@/types/pedido';
import type { EstadoDevolucion } from '@/types/devolucion';
import type { EstadoReclamo } from '@/types/reclamo';
import type { EstadoReembolso } from '@/types/reembolso';

// Colores provisionales con la paleta semántica; la definición final viene de Figma.
const COLORES = {
  pedido: {
    CREADO: 'gray',
    PAGADO: 'blue',
    EN_PREPARACION: 'yellow',
    DESPACHADO: 'signal',
    ENTREGADO: 'green',
    ANULADO: 'red',
  },
  anulacion: {
    PENDIENTE_AUTORIZACION: 'yellow',
    EJECUTADA: 'green',
    RECHAZADA: 'red',
  },
  devolucion: {
    SOLICITADA: 'gray',
    EN_EVALUACION: 'yellow',
    APROBADA: 'blue',
    RECHAZADA: 'red',
    COMPLETADA: 'green',
  },
  reclamo: {
    REGISTRADO: 'gray',
    EN_PROCESO: 'yellow',
    ATENDIDO: 'green',
    DERIVADO: 'blue',
  },
  reembolso: {
    PENDIENTE: 'yellow',
    EXITOSO: 'green',
    FALLIDO: 'red',
  },
} as const satisfies {
  pedido: Record<EstadoPedido, string>;
  anulacion: Record<EstadoAnulacion, string>;
  devolucion: Record<EstadoDevolucion, string>;
  reclamo: Record<EstadoReclamo, string>;
  reembolso: Record<EstadoReembolso, string>;
};

type EntidadEstado =
  | { entidad: 'pedido'; estado: EstadoPedido }
  | { entidad: 'anulacion'; estado: EstadoAnulacion }
  | { entidad: 'devolucion'; estado: EstadoDevolucion }
  | { entidad: 'reclamo'; estado: EstadoReclamo }
  | { entidad: 'reembolso'; estado: EstadoReembolso };

export type EstadoBadgeProps = EntidadEstado & Omit<BadgeProps, 'color' | 'children'>;

/** Texto legible a partir del valor del contrato: EN_PREPARACION → "En preparacion". */
function etiqueta(estado: string): string {
  const texto = estado.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function EstadoBadge({ entidad, estado, ...props }: EstadoBadgeProps) {
  const colores: Record<string, string> = COLORES[entidad];
  return (
    <Badge variant="light" color={colores[estado]} {...props}>
      {etiqueta(estado)}
    </Badge>
  );
}
