// Entrada al portal con el JWT de Seguridad (G7). Acepta el token de dos formas:
// 1) en la URL (/ingresar#token=...), si la SPA de G7 redirige aquí después del login;
// 2) pegado a mano, copiado de la SPA de G7.
// Solo guarda el token si trae el rol ADMIN_VENTAS; la validación real la hace el backend.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Center, Paper, Stack, Text, Textarea, Title } from '@mantine/core';
import { ROL_GESTOR, cerrarSesion, guardarToken, sesionActual } from '@/services/auth';

/** Token de #token=... o ?token=...; lo borra de la barra de direcciones para que no quede en el historial. */
function tokenDeLaUrl(): string | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const token = hash.get('token') ?? query.get('token');
  if (token) window.history.replaceState(null, '', window.location.pathname);
  return token;
}

export function IngresarPage() {
  const navegar = useNavigate();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  function ingresar(valor: string) {
    guardarToken(valor.trim());
    const sesion = sesionActual();
    if (!sesion.autenticado) {
      cerrarSesion();
      setError('El token no es válido o ya venció. Vuelve a iniciar sesión en Seguridad y cópialo de nuevo.');
      return;
    }
    if (!sesion.roles.includes(ROL_GESTOR)) {
      cerrarSesion();
      setError(`El token no tiene el rol ${ROL_GESTOR}. Este portal es solo para el Gestor de ventas.`);
      return;
    }
    navegar('/admin/pedidos', { replace: true });
  }

  useEffect(() => {
    const deUrl = tokenDeLaUrl();
    if (deUrl) ingresar(deUrl);
    // Solo al abrir la página.
  }, []);

  const urlLogin = import.meta.env.VITE_SEGURIDAD_LOGIN_URL;

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder radius="md" p="xl" maw={520} w="100%">
        <Stack>
          <Title order={2}>Ingresar al portal</Title>
          <Text size="sm" c="dimmed">
            Inicia sesión en Seguridad con una cuenta de Gestor ({ROL_GESTOR}), copia tu token de acceso y pégalo aquí.
          </Text>
          {urlLogin && (
            <Button component="a" href={urlLogin} variant="default">
              Ir a Seguridad
            </Button>
          )}
          <Textarea
            label="Token de acceso"
            placeholder="eyJhbGciOi..."
            autosize
            minRows={3}
            value={token}
            onChange={(e) => {
              setToken(e.currentTarget.value);
              setError(null);
            }}
          />
          {error && (
            <Alert color="red" title="No se pudo ingresar">
              {error}
            </Alert>
          )}
          <Button onClick={() => ingresar(token)} disabled={!token.trim()}>
            Ingresar
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
