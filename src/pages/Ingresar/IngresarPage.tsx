// Entrada al portal autenticando contra Seguridad (G7).
// Soporta autenticación directa (CLIENTE) y flujo completo 2FA/OTP al correo (ADMIN_VENTAS).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Center,
  Group,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  guardarSesion,
  leerClaims,
  rutaInicialSegunRol,
} from '@/services/auth';
import {
  iniciarSesionG7,
  solicitarEnvioOtpG7,
  verificarOtpG7,
} from '@/services/authG7';

export function IngresarPage() {
  const navegar = useNavigate();

  // Estados del formulario login
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del flujo 2FA (MFA)
  const [paso2fa, setPaso2fa] = useState(false);
  const [challengeToken, setChallengeToken] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [mensaje2fa, setMensaje2fa] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [infoReenvio, setInfoReenvio] = useState<string | null>(null);

  function procesarTokensYRedirigir(tokenRecibido: string, refreshToken?: string) {
    guardarSesion(tokenRecibido.trim(), refreshToken?.trim());
    const claims = leerClaims(tokenRecibido);
    const roles = claims?.roles ?? [];

    if (roles.length === 0) {
      setError('El token recibido no tiene roles asociados en el sistema.');
      return;
    }

    const destino = rutaInicialSegunRol(roles);
    navegar(destino, { replace: true });
  }

  async function manejarInicioSesion(e: React.FormEvent) {
    e.preventDefault();
    if (!correo.trim() || !contrasena.trim()) {
      setError('Por favor completa tu correo y contraseña.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const resultado = await iniciarSesionG7(correo.trim(), contrasena.trim());

      if (resultado.requiereMfa) {
        setChallengeToken(resultado.challengeToken);
        setPaso2fa(true);
        setError(null);

        // Disparar automáticamente la solicitud de envío del código OTP a la bandeja de entrada
        try {
          const destino = await solicitarEnvioOtpG7(resultado.challengeToken, 'EMAIL');
          setMensaje2fa(`Hemos enviado un código de 6 dígitos a ${destino}.`);
        } catch {
          setMensaje2fa('Ingresa el código de 6 dígitos de tu segundo factor.');
        }
      } else {
        procesarTokensYRedirigir(resultado.accessToken, resultado.refreshToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servicio de autenticación.');
    } finally {
      setCargando(false);
    }
  }

  async function manejarVerificarOtp(e: React.FormEvent) {
    e.preventDefault();
    if (codigoOtp.length < 6) {
      setError('Ingresa el código completo de 6 dígitos enviado a tu correo.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const respuestaOtp = await verificarOtpG7(challengeToken, codigoOtp);
      procesarTokensYRedirigir(respuestaOtp.accessToken, respuestaOtp.refreshToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código de verificación inválido o expirado.');
    } finally {
      setCargando(false);
    }
  }

  async function manejarReenviarOtp() {
    if (!challengeToken) return;
    setReenviando(true);
    setInfoReenvio(null);
    setError(null);
    try {
      const destino = await solicitarEnvioOtpG7(challengeToken, 'EMAIL');
      setInfoReenvio(`Nuevo código solicitado. Revisa ${destino}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código.');
    } finally {
      setReenviando(false);
    }
  }

  return (
    <Center mih="100vh" p="md" bg="gray.0">
      <Paper withBorder shadow="md" radius="md" p="xl" maw={460} w="100%">
        {!paso2fa ? (
          <form onSubmit={manejarInicioSesion}>
            <Stack gap="md">
              <div>
                <Title order={2} c="blue.9">Iniciar Sesión</Title>
                <Text size="sm" c="dimmed">
                  Módulo de Ventas y Postventa (Autenticado por G7)
                </Text>
              </div>

              {error && (
                <Alert color="red" title="Error de autenticación">
                  {error}
                </Alert>
              )}

              <TextInput
                label="Correo electrónico"
                placeholder="usuario@ejemplo.com"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.currentTarget.value)}
                disabled={cargando}
              />

              <PasswordInput
                label="Contraseña"
                placeholder="Tu contraseña"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.currentTarget.value)}
                disabled={cargando}
              />

              <Button type="submit" fullWidth loading={cargando} mt="xs">
                Ingresar
              </Button>
            </Stack>
          </form>
        ) : (
          <form onSubmit={manejarVerificarOtp}>
            <Stack gap="md" align="center">
              <div>
                <Title order={2} c="blue.9" ta="center">Segundo Factor (2FA)</Title>
                <Text size="sm" c="dimmed" ta="center" mt={4}>
                  {mensaje2fa}
                </Text>
              </div>

              {error && (
                <Alert color="red" title="Código inválido" w="100%">
                  {error}
                </Alert>
              )}

              {infoReenvio && (
                <Alert color="blue" title="Código reenviado" w="100%">
                  {infoReenvio}
                </Alert>
              )}

              <PinInput
                length={6}
                size="md"
                type="number"
                value={codigoOtp}
                onChange={setCodigoOtp}
                disabled={cargando}
                autoFocus
              />

              <Button type="submit" fullWidth loading={cargando} mt="xs">
                Confirmar código
              </Button>

              <Group justify="space-between" w="100%" mt="xs">
                <Button
                  variant="subtle"
                  size="xs"
                  color="gray"
                  onClick={() => {
                    setPaso2fa(false);
                    setCodigoOtp('');
                    setError(null);
                    setInfoReenvio(null);
                  }}
                  disabled={cargando || reenviando}
                >
                  ← Volver al login
                </Button>

                <Button
                  variant="subtle"
                  size="xs"
                  color="blue"
                  onClick={manejarReenviarOtp}
                  loading={reenviando}
                  disabled={cargando}
                >
                  Reenviar código
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Paper>
    </Center>
  );
}
