// Sesión del Gestor. El login lo resuelve Seguridad (G7); aquí solo se guarda y lee el JWT.
import type { Rol } from '@/types/comun';

const CLAVE_TOKEN = 'g5.token';

/** Rol exigido para todo el portal del Gestor (/admin/*). Nunca GESTOR ni ADMIN. */
export const ROL_GESTOR: Rol = 'ADMIN_VENTAS';

export function obtenerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function guardarToken(token: string): void {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function cerrarSesion(): void {
  localStorage.removeItem(CLAVE_TOKEN);
}

interface ClaimsJwt {
  sub?: string;
  roles?: string[];
  exp?: number;
}

/** Decodifica el payload del JWT sin validar firma (la validación real la hace el backend). */
function leerClaims(token: string): ClaimsJwt | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as ClaimsJwt;
  } catch {
    return null;
  }
}

/**
 * Entra sin token como Gestor:
 * - en `npm run dev` con VITE_AUTH_DESACTIVADA=true (desarrollo local);
 * - en cualquier build con VITE_MODO_DEMO=true. Solo para la demo con el backend en SEGURIDAD_HABILITADA=false;
 *   sin eso el backend rechaza las llamadas igual (la seguridad real está en el backend).
 */
export const modoDemo = import.meta.env.VITE_MODO_DEMO === 'true';

export const authDesactivada =
  modoDemo || (import.meta.env.DEV && import.meta.env.VITE_AUTH_DESACTIVADA === 'true');

export function sesionActual(): { autenticado: boolean; roles: string[]; usuarioId: string | null } {
  if (authDesactivada) {
    return { autenticado: true, roles: [ROL_GESTOR], usuarioId: null };
  }
  const token = obtenerToken();
  const claims = token ? leerClaims(token) : null;
  if (!claims) return { autenticado: false, roles: [], usuarioId: null };

  const expirado = claims.exp !== undefined && claims.exp * 1000 < Date.now();
  if (expirado) return { autenticado: false, roles: [], usuarioId: null };

  return { autenticado: true, roles: claims.roles ?? [], usuarioId: claims.sub ?? null };
}

export function tieneRol(rol: Rol): boolean {
  return sesionActual().roles.includes(rol);
}
