// Cliente HTTP central (stack-frontend.md 5.1). Ninguna pantalla crea su propio axios.
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ErrorResponse } from '@/types/comun';
import { obtenerToken, obtenerRefreshToken, guardarSesion, cerrarSesion } from './auth';
import { renovarSesionG7 } from './authG7';

/**
 * Error normalizado: cada pantalla muestra `mensaje` y decide por `codigo`,
 * sin volver a parsear la respuesta del backend.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalles: unknown[];

  constructor(status: number, codigo: string, mensaje: string, detalles: unknown[] = []) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  /** 501 NO_IMPLEMENTADO: mostrar "todavía no disponible", no un error genérico. */
  get noImplementado(): boolean {
    return this.status === 501;
  }
}

const MENSAJES_POR_STATUS: Record<number, string> = {
  400: 'La solicitud tiene datos inválidos.',
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'La operación no es posible en el estado actual.',
  501: 'Esta funcionalidad todavía no está disponible.',
  503: 'El servicio no está disponible en este momento.',
};

function esErrorResponse(data: unknown): data is ErrorResponse {
  return typeof data === 'object' && data !== null && 'codigo' in data && 'mensaje' in data;
}

function normalizarError(error: AxiosError): ApiError {
  if (!error.response) {
    return new ApiError(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor.');
  }
  const { status, data } = error.response;
  if (esErrorResponse(data)) {
    return new ApiError(status, data.codigo, data.mensaje, data.detalles ?? []);
  }
  const codigo = status === 501 ? 'NO_IMPLEMENTADO' : `HTTP_${status}`;
  return new ApiError(status, codigo, MENSAJES_POR_STATUS[status] ?? 'Ocurrió un error inesperado.');
}

/**
 * Cola única para evitar llamadas concurrentes a /auth/refresh
 * ante múltiples peticiones paralelas que reciben 401.
 */
let promesaRenovacionEnCurso: Promise<string> | null = null;

async function renovarTokenCompartido(): Promise<string> {
  if (promesaRenovacionEnCurso) {
    return promesaRenovacionEnCurso;
  }

  const refresh = obtenerRefreshToken();
  if (!refresh) {
    cerrarSesion();
    throw new Error('No hay refresh token disponible');
  }

  promesaRenovacionEnCurso = (async () => {
    try {
      const { accessToken, refreshToken } = await renovarSesionG7(refresh);
      guardarSesion(accessToken, refreshToken);
      return accessToken;
    } catch (err) {
      cerrarSesion();
      throw err;
    } finally {
      promesaRenovacionEnCurso = null;
    }
  })();

  return promesaRenovacionEnCurso;
}

interface SolicitudConReintento extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function crearCliente(baseURL: string): AxiosInstance {
  const cliente = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  cliente.interceptors.request.use((config) => {
    const token = obtenerToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  cliente.interceptors.response.use(
    (respuesta) => respuesta,
    async (error: AxiosError) => {
      const peticionOriginal = error.config as SolicitudConReintento | undefined;

      // Si el backend responde 401 y tenemos refresh token, renovamos silenciosamente y reintentamos una vez
      if (error.response?.status === 401 && peticionOriginal && !peticionOriginal._retry) {
        const refresh = obtenerRefreshToken();
        if (refresh) {
          peticionOriginal._retry = true;
          try {
            const nuevoToken = await renovarTokenCompartido();
            peticionOriginal.headers.Authorization = `Bearer ${nuevoToken}`;
            return cliente(peticionOriginal);
          } catch {
            return Promise.reject(normalizarError(error));
          }
        }
      }

      return Promise.reject(normalizarError(error));
    },
  );

  return cliente;
}

// Mientras el equipo no decida otra cosa, todo va por el Gateway (guía frontend 2.1).
// Si VITE_GATEWAY_URL está vacío, se llama directo a cada microservicio.
const gateway = import.meta.env.VITE_GATEWAY_URL;

/** M1 — api-ventas (pedidos, anulaciones) */
export const apiVentas = crearCliente(gateway || import.meta.env.VITE_API_VENTAS_URL);

/** M2 — api-postventa (devoluciones, reembolsos, csat, reclamos, dashboard) */
export const apiPostventa = crearCliente(gateway || import.meta.env.VITE_API_POSTVENTA_URL);
