// Cliente HTTP para autenticación y 2FA contra el Módulo de Seguridad (G7).
// Endpoint oficial en producción: https://g7-auth-service.onrender.com/api/v1/auth

const URL_BASE_SEGURIDAD =
  import.meta.env.VITE_SEGURIDAD_LOGIN_URL || 'https://g7-auth-service.onrender.com/api/v1';

export interface RespuestaLoginExitoso {
  requiereMfa: false;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface RespuestaLoginDesafioMfa {
  requiereMfa: true;
  desafioId: string;
  mensaje: string;
}

export type RespuestaLogin = RespuestaLoginExitoso | RespuestaLoginDesafioMfa;

/**
 * Inicia sesión con credenciales directas (SPEC-05 / SPEC-09 de G7).
 * Si la cuenta tiene MFA (ADMIN_VENTAS), retorna requiereMfa: true y el desafioId.
 * Si es una cuenta directa (CLIENTE), retorna el accessToken de inmediato.
 */
export async function iniciarSesionG7(correo: string, contrasena: string): Promise<RespuestaLogin> {
  const url = `${URL_BASE_SEGURIDAD.replace(/\/auth\/?$/, '')}/auth/login`;

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ correo, contrasena }),
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const mensaje = datos.mensaje || datos.error || 'Credenciales inválidas o cuenta no disponible.';
    throw new Error(mensaje);
  }

  // Si G7 indica que requiere segundo factor (OTP al correo)
  if (datos.requiereMfa || datos.desafioId || datos.estado === 'REQUIERE_MFA') {
    return {
      requiereMfa: true,
      desafioId: datos.desafioId || datos.idDesafio || '',
      mensaje: datos.mensaje || 'Se ha enviado un código de verificación a tu correo.',
    };
  }

  const token = datos.accessToken || datos.access_token || datos.token;
  if (!token) {
    throw new Error('La respuesta de Seguridad no incluyó un token de acceso válido.');
  }

  return {
    requiereMfa: false,
    accessToken: token,
    refreshToken: datos.refreshToken || datos.refresh_token,
    expiresIn: datos.expiresIn,
  };
}

/**
 * Valida el código OTP de 6 dígitos para resolver el desafío 2FA de cuentas administrativas.
 */
export async function verificarOtpG7(desafioId: string, codigo: string): Promise<string> {
  const url = `${URL_BASE_SEGURIDAD.replace(/\/auth\/?$/, '')}/auth/otp/verificar`;

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ desafioId, codigo }),
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const mensaje = datos.mensaje || datos.error || 'Código de verificación inválido o expirado.';
    throw new Error(mensaje);
  }

  const token = datos.accessToken || datos.access_token || datos.token;
  if (!token) {
    throw new Error('No se recibió el token de acceso tras verificar el segundo factor.');
  }

  return token;
}
