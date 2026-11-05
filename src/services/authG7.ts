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
  challengeToken: string;
  canal: string;
  mensaje: string;
  expiraEn?: number;
}

export type RespuestaLogin = RespuestaLoginExitoso | RespuestaLoginDesafioMfa;

/**
 * Inicia sesión con credenciales directas (SPEC-05 / SPEC-09 de G7).
 * Si la cuenta tiene MFA activo (ADMIN_VENTAS), retorna requiereMfa: true y el challengeToken canónico.
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
    const mensaje = datos.detail || datos.mensaje || datos.error || 'Credenciales inválidas o cuenta no disponible.';
    throw new Error(mensaje);
  }

  // Detección canónica de desafío MFA según openapi.yaml de G7 (mfaRequerido / challengeToken)
  if (datos.mfaRequerido === true || datos.requiereMfa === true || datos.challengeToken || datos.desafioId) {
    const challengeToken = datos.challengeToken || datos.desafioId || '';
    const canal = datos.canal || 'EMAIL';
    return {
      requiereMfa: true,
      challengeToken,
      canal,
      mensaje: `Se requiere segundo factor. Te enviaremos un código de verificación vía ${canal === 'EMAIL' ? 'correo electrónico' : canal}.`,
      expiraEn: datos.expiraEn,
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
 * Solicita el envío físico del código de 6 dígitos al correo del usuario (/auth/otp/solicitar, SPEC-09).
 */
export async function solicitarEnvioOtpG7(challengeToken: string, canal: 'EMAIL' | 'SMS' = 'EMAIL'): Promise<string> {
  const url = `${URL_BASE_SEGURIDAD.replace(/\/auth\/?$/, '')}/auth/otp/solicitar`;

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ challengeToken, canal }),
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const mensaje = datos.detail || datos.mensaje || datos.error || 'No se pudo enviar el código de verificación.';
    throw new Error(mensaje);
  }

  return datos.destinoEnmascarado || 'tu correo';
}

/**
 * Valida el código OTP de 6 dígitos con el challengeToken para obtener los tokens de sesión (/auth/otp/verificar, SPEC-09).
 */
export async function verificarOtpG7(challengeToken: string, codigo: string): Promise<string> {
  const url = `${URL_BASE_SEGURIDAD.replace(/\/auth\/?$/, '')}/auth/otp/verificar`;

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ challengeToken, codigo }),
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const mensaje = datos.detail || datos.mensaje || datos.error || 'Código de verificación inválido o expirado.';
    throw new Error(mensaje);
  }

  const token = datos.accessToken || datos.access_token || datos.token;
  if (!token) {
    throw new Error('No se recibió el token de acceso tras verificar el segundo factor.');
  }

  return token;
}
