// Estados loading / error / vacío reutilizables (stack-frontend.md 8.2).
// Toda pantalla con datos async debe manejar los 4: loading, success, error, vacío.
import type { ReactNode } from 'react';
import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core';
import { ApiError } from '@/services/api';

interface EstadoCargaProps<T> {
  cargando: boolean;
  error: unknown;
  datos: T | null | undefined;
  /** Determina si `datos` cuenta como vacío (por defecto: arreglo vacío o `contenido` vacío). */
  esVacio?: (datos: T) => boolean;
  mensajeVacio?: string;
  onReintentar?: () => void;
  children: (datos: T) => ReactNode;
}

function vacioPorDefecto(datos: unknown): boolean {
  if (Array.isArray(datos)) return datos.length === 0;
  if (typeof datos === 'object' && datos !== null && 'contenido' in datos) {
    const contenido = (datos as { contenido: unknown }).contenido;
    return Array.isArray(contenido) && contenido.length === 0;
  }
  return false;
}

export function EstadoCarga<T>({
  cargando,
  error,
  datos,
  esVacio = vacioPorDefecto,
  mensajeVacio = 'No hay resultados para mostrar.',
  onReintentar,
  children,
}: EstadoCargaProps<T>) {
  if (cargando) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (error) {
    const apiError = error instanceof ApiError ? error : null;
    if (apiError?.noImplementado) {
      return (
        <Alert color="blue" title="Todavía no disponible">
          Esta funcionalidad aún no está habilitada en el servidor.
        </Alert>
      );
    }
    return (
      <Alert color="red" title="No se pudo cargar la información">
        <Stack gap="sm" align="flex-start">
          <Text size="sm">{apiError?.message ?? 'Ocurrió un error inesperado.'}</Text>
          {onReintentar && (
            <Button size="xs" variant="light" color="red" onClick={onReintentar}>
              Reintentar
            </Button>
          )}
        </Stack>
      </Alert>
    );
  }

  if (datos === null || datos === undefined || esVacio(datos)) {
    return (
      <Center py="xl">
        <Text c="dimmed">{mensajeVacio}</Text>
      </Center>
    );
  }

  return <>{children(datos)}</>;
}
