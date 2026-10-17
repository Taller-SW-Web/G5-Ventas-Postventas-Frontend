import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Group, MantineProvider, Text } from '@mantine/core';
import '@mantine/core/styles.css';
import '@/theme/global.css';
import { theme } from '@/theme';
import { DetalleSatisfaccion } from '../DetalleSatisfaccion';
import { ComentariosClientes } from '../ComentariosClientes';
import type { ComentarioCliente, ContextoCalificaciones, ResumenSatisfaccion } from '../calificaciones.types';
import type { Puntuacion } from '@/types/calificacion';
import { contextoCalificacionesEjemplo, satisfaccionEjemplo, comentariosEjemplo } from '../datos/calificaciones.ejemplo';

const periodosEjemplo = ['Septiembre 2026', 'Últimos 15 días', 'Agosto 2026'];

function comentariosFiltrados(contexto: ContextoCalificaciones): readonly ComentarioCliente[] {
  // En la demostración, los últimos 15 días se cuentan al cierre de septiembre de 2026.
  const desde = contexto.periodo === 'Agosto 2026' ? '2026-08-01'
    : contexto.periodo === 'Últimos 15 días' ? '2026-09-16' : '2026-09-01';
  const hasta = contexto.periodo === 'Agosto 2026' ? '2026-09-01' : '2026-10-01';
  return comentariosEjemplo.filter((comentario) => comentario.fecha >= desde
    && comentario.fecha < hasta
    && (contexto.canal === 'TODOS' || comentario.canal === contexto.canal));
}

function resumenEjemplo(contexto: ContextoCalificaciones, comentarios: readonly ComentarioCliente[]): ResumenSatisfaccion {
  // El escenario inicial conserva las cifras del Figma. Los demás usan la muestra filtrada.
  if (contexto.periodo === 'Septiembre 2026' && contexto.canal === 'TODOS') return satisfaccionEjemplo;
  if (comentarios.length === 0) return { promedio: null, distribucion: [] };
  const puntuaciones: readonly Puntuacion[] = [5, 4, 3, 2, 1];
  return {
    promedio: comentarios.reduce((suma, comentario) => suma + comentario.puntuacion, 0) / comentarios.length,
    distribucion: puntuaciones.map((puntuacion) => ({
      puntuacion,
      porcentaje: Math.round(comentarios.filter((comentario) => comentario.puntuacion === puntuacion).length / comentarios.length * 100),
    })),
  };
}

function VistaPreviaCalificaciones() {
  const [ventana, setVentana] = useState<'satisfaccion' | 'comentarios' | null>(null);
  const [sinDatos, setSinDatos] = useState(false);
  const [contexto, setContexto] = useState(contextoCalificacionesEjemplo);
  const comentarios = sinDatos ? [] : comentariosFiltrados(contexto);
  const resumen = sinDatos ? { promedio: null, distribucion: [] } : resumenEjemplo(contexto, comentarios);
  const filtros = { contexto, opcionesPeriodos: periodosEjemplo, onCambiarContexto: setContexto };

  return (
    <MantineProvider theme={theme}>
      <main style={{ padding: 32 }}>
        <Text mb="md">Vista previa de calificaciones · Datos de demostración</Text>
        <Group>
          <Button onClick={() => setVentana('satisfaccion')}>Ver detalle</Button>
          <Button onClick={() => setVentana('comentarios')}>Ver todos</Button>
          <Button onClick={() => setVentana('comentarios')}>Ver</Button>
          <Button onClick={() => setSinDatos(!sinDatos)}>Alternar sin datos</Button>
        </Group>
      </main>
      <DetalleSatisfaccion {...filtros} abierto={ventana === 'satisfaccion'} resumen={resumen} onCerrar={() => setVentana(null)} />
      <ComentariosClientes {...filtros} abierto={ventana === 'comentarios'} comentarios={comentarios} onCerrar={() => setVentana(null)} />
    </MantineProvider>
  );
}

// Entrada exclusiva de desarrollo; no se añade una ruta al portal del Gestor.
if (import.meta.env.DEV) {
  createRoot(document.getElementById('root')!).render(<VistaPreviaCalificaciones />);
}
