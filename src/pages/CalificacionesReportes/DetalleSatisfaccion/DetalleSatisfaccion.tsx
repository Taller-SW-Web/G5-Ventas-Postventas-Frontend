import { Progress, Title } from '@mantine/core';
import { VentanaCalificaciones } from '../compartido/VentanaCalificaciones';
import type { DetalleSatisfaccionProps } from './DetalleSatisfaccion.types';
import styles from './DetalleSatisfaccion.module.css';

const trazabilidad = [
  ['Pedido asociado', 'Cada respuesta conserva referencia al pedido'],
  ['Canal', 'Permite segmentar el indicador'],
  ['Fecha', 'Ubica la respuesta dentro del periodo'],
  ['Comentario', 'Información cualitativa opcional'],
] as const;

const reglas = [
  'Solo se consideran puntuaciones entre 1 y 5',
  'Las respuestas duplicadas no alteran el agregado',
  'El cálculo conserva segmentación por canal y periodo',
  'Una calificación baja no genera un reclamo automáticamente',
];

export function DetalleSatisfaccion({ abierto, contexto, opcionesPeriodos, onCambiarContexto, resumen, onCerrar }: DetalleSatisfaccionProps) {
  const promedio = resumen.promedio;
  // Es avance sobre la escala máxima, no el porcentaje de respuestas favorables.
  const avance = promedio === null ? 0 : Math.min(100, Math.max(0, promedio / 5 * 100));

  return (
    <VentanaCalificaciones
      abierto={abierto}
      titulo="Detalle de satisfacción"
      descripcion="Inspección del indicador, su distribución y las reglas aplicadas al cálculo"
      contexto={contexto}
      opcionesPeriodos={opcionesPeriodos}
      onCambiarContexto={onCambiarContexto}
      ancho={780}
      claseContenido={styles.contenido}
      onCerrar={onCerrar}
    >
      <div className={styles.resumen}>
        <section className={styles.promedio} aria-label="CSAT promedio">
          <p className={styles.etiqueta}>CSAT promedio</p>
          <p className={styles.valor}>{promedio === null ? '—' : `${promedio.toFixed(2)} / 5`}</p>
          <div className={styles.avance}><span>Avance sobre el máximo</span><strong>{promedio === null ? '—' : `${Math.round(avance)}%`}</strong></div>
          <Progress value={avance} color="orange.7" size={10} className={styles.progresoPromedio} aria-label="Avance del promedio sobre cinco" />
        </section>
        <section className={styles.distribucion} aria-label="Distribución de calificaciones">
          <p className={styles.subtitulo}>Distribución de calificaciones</p>
          {resumen.distribucion.length === 0 ? (
            <p className={styles.vacio}>No hay calificaciones para este periodo y canal.</p>
          ) : resumen.distribucion.map(({ puntuacion, porcentaje }) => (
            <div key={puntuacion} className={styles.fila}>
              <span>{puntuacion} ★</span>
              <Progress value={porcentaje} color="orange.7" size={9} className={styles.barra} aria-label={`${puntuacion} estrellas: ${porcentaje}%`} />
              <span className={styles.porcentaje}>{porcentaje}%</span>
            </div>
          ))}
        </section>
      </div>
      <div className={styles.informacion}>
        <section className={styles.tarjeta}>
          <Title order={3} className={styles.tituloTarjeta}>Trazabilidad de respuestas</Title>
          <dl className={styles.trazabilidad}>
            {trazabilidad.map(([etiqueta, descripcion]) => (
              <div key={etiqueta}><dt>{etiqueta}</dt><dd>{descripcion}</dd></div>
            ))}
          </dl>
        </section>
        <section className={styles.tarjeta}>
          <Title order={3} className={styles.tituloTarjeta}>Validación del indicador</Title>
          <ol className={styles.reglas}>
            {reglas.map((regla, indice) => <li key={regla}><span aria-hidden="true">{indice + 1}</span><p>{regla}</p></li>)}
          </ol>
        </section>
      </div>
    </VentanaCalificaciones>
  );
}

