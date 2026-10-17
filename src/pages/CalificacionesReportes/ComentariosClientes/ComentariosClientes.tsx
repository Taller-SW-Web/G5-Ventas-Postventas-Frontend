import { Group, Pagination, Table } from '@mantine/core';
import separador from '@/assets/calificaciones/separador-comentarios.svg';
import { EstadoCarga } from '@/components/EstadoCarga';
import { VentanaCalificaciones } from '../compartido/VentanaCalificaciones';
import type { ComentariosClientesProps } from './ComentariosClientes.types';
import type { Canal } from '@/types/comun';
import styles from './ComentariosClientes.module.css';

const canales: Record<Canal, string> = {
  MARKETPLACE: 'Marketplace', CHATBOT: 'Chatbot', RETAIL: 'Retail',
};

function fechaVisible(fecha: string): string {
  // El modelo usa una fecha de calendario: no debe retroceder un día al convertirla a UTC.
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

export function ComentariosClientes({ abierto, contexto, opcionesPeriodos, onCambiarContexto, comentarios, onCerrar, estado, pagina, totalPaginas, onCambiarPagina }: ComentariosClientesProps) {
  return (
    <VentanaCalificaciones
      abierto={abierto}
      titulo="Comentarios de clientes"
      descripcion="Detalle cualitativo de las respuestas registradas y aceptadas para el análisis"
      contexto={contexto}
      opcionesPeriodos={opcionesPeriodos}
      onCambiarContexto={onCambiarContexto}
      ancho={900}
      claseContenido={styles.contenido}
      onCerrar={onCerrar}
      nota="Las respuestas inválidas o duplicadas no modifican el indicador de satisfacción"
    >
      <EstadoCarga cargando={estado?.cargando ?? false} error={estado?.error}
        datos={estado ? estado.datos : {}} esVacio={() => false} onReintentar={estado?.recargar}>
        {() => (
          <>
            <div className={styles.tablaContenedor}>
              <Table className={styles.tabla} withRowBorders={false} aria-label="Comentarios de clientes del periodo y canal aplicados">
                <colgroup><col className={styles.fecha} /><col className={styles.pedido} /><col className={styles.canal} /><col className={styles.puntuacion} /><col /></colgroup>
                <Table.Thead><Table.Tr>
                  <Table.Th scope="col">Fecha</Table.Th><Table.Th scope="col">Pedido</Table.Th><Table.Th scope="col">Canal</Table.Th><Table.Th scope="col">Punt.</Table.Th><Table.Th scope="col">Comentario</Table.Th>
                </Table.Tr></Table.Thead>
                <Table.Tbody>
                  {comentarios.length === 0 ? (
                    <Table.Tr><Table.Td colSpan={5} className={styles.vacio}>No hay comentarios para este periodo y canal.</Table.Td></Table.Tr>
                  ) : comentarios.map((comentario) => (
                    <Table.Tr key={comentario.pedidoId} className={styles.fila}>
                      <Table.Td><time dateTime={comentario.fecha}>{fechaVisible(comentario.fecha)}</time></Table.Td>
                      <Table.Td><strong>{comentario.pedidoId}</strong></Table.Td>
                      <Table.Td>{canales[comentario.canal]}</Table.Td>
                      <Table.Td><span className={comentario.puntuacion >= 4 ? styles.favorable : comentario.puntuacion === 3 ? styles.neutra : styles.critica} aria-label={`${comentario.puntuacion} de 5 estrellas`}>{comentario.puntuacion} <span aria-hidden="true">★</span></span></Table.Td>
                      <Table.Td className={styles.comentario}>
                        {comentario.comentario}
                        <span className={styles.separador}><img src={separador} alt="" /></span>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
              {onCambiarPagina && (totalPaginas ?? 0) > 1 && (
                <Group justify="center" mt="sm">
                  <Pagination total={totalPaginas ?? 1} value={pagina} onChange={onCambiarPagina} size="sm" />
                </Group>
              )}
          </>
        )}
      </EstadoCarga>
    </VentanaCalificaciones>
  );
}

