// Tabla con paginación para bandejas (stack-frontend.md 8.3).
// `pagina` es base 0, igual que el contrato (`pagina`/`tamano`).
import type { ReactNode } from 'react';
import { Group, Pagination, Table, Text } from '@mantine/core';

export interface ColumnaTabla<T> {
  clave: string;
  titulo: string;
  render: (fila: T) => ReactNode;
}

export interface TablaPaginadaProps<T> {
  columnas: ColumnaTabla<T>[];
  filas: T[];
  obtenerClave: (fila: T) => string;
  pagina: number;
  totalPaginas: number;
  totalElementos?: number;
  onCambiarPagina: (pagina: number) => void;
  onClickFila?: (fila: T) => void;
  /** Clave de la fila abierta en el panel lateral: se resalta con el naranja suave (color/action/primary-soft). */
  claveSeleccionada?: string | null;
  /** Texto del pie en lugar de "N resultado(s)", ej. "Mostrando 1 a 5 de 14 reclamos". */
  resumen?: ReactNode;
}

export function TablaPaginada<T>({
  columnas,
  filas,
  obtenerClave,
  pagina,
  totalPaginas,
  totalElementos,
  onCambiarPagina,
  onClickFila,
  claveSeleccionada,
  resumen,
}: TablaPaginadaProps<T>) {
  return (
    <>
      <Table.ScrollContainer minWidth={640}>
        <Table highlightOnHover={Boolean(onClickFila)} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              {columnas.map((c) => (
                <Table.Th key={c.clave}>{c.titulo}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filas.map((fila) => {
              const seleccionada = claveSeleccionada != null && obtenerClave(fila) === claveSeleccionada;
              return (
                <Table.Tr
                  key={obtenerClave(fila)}
                  onClick={onClickFila ? () => onClickFila(fila) : undefined}
                  aria-selected={claveSeleccionada !== undefined ? seleccionada : undefined}
                  style={{
                    cursor: onClickFila ? 'pointer' : undefined,
                    backgroundColor: seleccionada ? 'var(--mantine-color-orange-0)' : undefined,
                  }}
                >
                  {columnas.map((c) => (
                    <Table.Td key={c.clave}>{c.render(fila)}</Table.Td>
                  ))}
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Group justify="space-between" mt="md">
        <Text size="sm" c="dimmed">
          {resumen ?? (totalElementos !== undefined ? `${totalElementos} resultado(s)` : '')}
        </Text>
        {totalPaginas > 1 && (
          <Pagination
            total={totalPaginas}
            value={pagina + 1}
            onChange={(p) => onCambiarPagina(p - 1)}
          />
        )}
      </Group>
    </>
  );
}
