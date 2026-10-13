// Tipos compartidos entre contratos (api-ventas.md / api-postventas.md)

export type Canal = 'MARKETPLACE' | 'CHATBOT' | 'RETAIL';

export type Moneda = 'PEN';

/** Respuesta paginada estándar (`pagina` desde 0). */
export interface Paginado<T> {
  contenido: T[];
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
}

export interface ParametrosPaginacion {
  pagina?: number;
  tamano?: number;
}

/** Formato estándar de error del backend. */
export interface ErrorResponse {
  codigo: string;
  mensaje: string;
  timestamp: string;
  detalles: unknown[];
}

/** Catálogo cerrado de roles de Seguridad (G7). El Gestor es ADMIN_VENTAS. */
export type Rol =
  | 'CLIENTE'
  | 'VENDEDOR'
  | 'ADMIN_VENTAS'
  | 'GESTOR_DESPACHO'
  | 'GESTOR_COMERCIAL'
  | 'ADMIN_SISTEMA';
