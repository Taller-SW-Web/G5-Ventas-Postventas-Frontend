// Badge único de estados de negocio (stack-frontend.md 3.3).
// Ninguna pantalla pinta un estado con un <span> y color propio: se usa este componente.
import { Badge, type BadgeProps } from '@mantine/core';
import type { EstadoPedido, EstadoAnulacion } from '@/types/pedido';
import type { EstadoDevolucion } from '@/types/devolucion';
import type { EstadoReclamo, EstadoSla } from '@/types/reclamo';
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
  // Colores del Mockup 06 (Figma): amarillo, signal, volt, rojo y gris.
  devolucion: {
    SOLICITADA: 'yellow',
    EN_EVALUACION: 'signal',
    APROBADA: 'volt',
    RECHAZADA: 'red',
    COMPLETADA: 'gray',
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
  // Semáforo del plazo de reclamos (propuesta UX 01): verde, amarillo, rojo, oscuro y gris.
  sla: {
    EN_PLAZO: 'green',
    POR_VENCER: 'yellow',
    CRITICO: 'red',
    VENCIDO: 'ink',
    ATENDIDO: 'gray',
  },
} as const satisfies {
  pedido: Record<EstadoPedido, string>;
  anulacion: Record<EstadoAnulacion, string>;
  devolucion: Record<EstadoDevolucion, string>;
  reclamo: Record<EstadoReclamo, string>;
  reembolso: Record<EstadoReembolso, string>;
  sla: Record<EstadoSla, string>;
};

/** Textos que no salen bien de la regla automática (tildes). */
const ETIQUETAS: Partial<Record<string, string>> = {
  CRITICO: 'Crítico',
  EN_EVALUACION: 'En evaluación',
};

type EntidadEstado =
  | { entidad: 'pedido'; estado: EstadoPedido }
  | { entidad: 'anulacion'; estado: EstadoAnulacion }
  | { entidad: 'devolucion'; estado: EstadoDevolucion }
  | { entidad: 'reclamo'; estado: EstadoReclamo }
  | { entidad: 'reembolso'; estado: EstadoReembolso }
  | { entidad: 'sla'; estado: EstadoSla };

export type EstadoBadgeProps = EntidadEstado &
  Omit<BadgeProps, 'color' | 'children'> & {
    /** Reemplaza el texto (ej. "Quedan 5 días" en el semáforo SLA); el color sigue saliendo del estado. */
    texto?: string;
  };

/** Texto legible a partir del valor del contrato: EN_PREPARACION → "En preparacion". */
function etiqueta(estado: string): string {
  const fija = ETIQUETAS[estado];
  if (fija) return fija;
  const texto = estado.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function EstadoBadge({ entidad, estado, texto, ...props }: EstadoBadgeProps) {
  const colores: Record<string, string> = COLORES[entidad];
  return (
    <Badge variant="light" color={colores[estado]} {...props}>
      {texto ?? etiqueta(estado)}
    </Badge>
  );
}
