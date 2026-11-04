// Entrada al portal autenticando contra Seguridad (G7).
// Soporta autenticación directa (CLIENTE) y flujo 2FA/OTP al correo (ADMIN_VENTAS).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Center,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  guardarToken,
  leerClaims,
  rutaInicialSegunRol,
} from '@/services/auth';
import { iniciarSesionG7, verificarOtpG7 } from '@/services/authG7';

export function IngresarPage() {
  const navegar = useNavigate();

  // Estados del formulario
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del flujo 2FA
  const [paso2fa, setPaso2fa] = useState(false);
  const [desafioId, setDesafioId] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [mensaje2fa, setMensaje2fa] = useState('');

  function procesarTokenYRedirigir(tokenRecibido: string) {
    guardarToken(tokenRecibido.trim());
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
        setDesafioId(resultado.desafioId);
        setMensaje2fa(resultado.mensaje);
        setPaso2fa(true);
      } else {
        procesarTokenYRedirigir(resultado.accessToken);
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
      const tokenFinal = await verificarOtpG7(desafioId, codigoOtp);
      procesarTokenYRedirigir(tokenFinal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código de verificación inválido o expirado.');
    } finally {
      setCargando(false);
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

              <Button
                variant="subtle"
                size="xs"
                color="gray"
                onClick={() => {
                  setPaso2fa(false);
                  setCodigoOtp('');
                  setError(null);
                }}
                disabled={cargando}
              >
                ← Volver al login
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Center>
  );
}
