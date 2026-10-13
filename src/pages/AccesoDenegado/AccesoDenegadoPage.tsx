// Se muestra cuando el token no existe o no tiene el rol ADMIN_VENTAS (guía frontend 4).
import { Button, Center, Stack, Text, Title } from '@mantine/core';

export function AccesoDenegadoPage() {
  const urlLogin = import.meta.env.VITE_SEGURIDAD_LOGIN_URL;

  return (
    <Center mih="100vh" p="md">
      <Stack align="center" gap="sm" maw={420} ta="center">
        <Title order={1}>Acceso denegado</Title>
        <Text c="dimmed">
          Necesitas iniciar sesión con una cuenta de Gestor de ventas para ver esta sección.
        </Text>
        {urlLogin && (
          <Button component="a" href={urlLogin}>
            Iniciar sesión
          </Button>
        )}
      </Stack>
    </Center>
  );
}
