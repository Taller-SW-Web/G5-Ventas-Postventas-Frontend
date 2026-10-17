import type { ReactNode } from 'react';
import { Button, Modal, Select } from '@mantine/core';
import calendario from '@/assets/reembolsos/calendar.svg';
import type { ContextoCalificaciones, FiltrosCalificacionesProps } from '../calificaciones.types';
import styles from './VentanaCalificaciones.module.css';

interface VentanaCalificacionesProps extends FiltrosCalificacionesProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  ancho: number;
  claseContenido: string;
  onCerrar: () => void;
  children: ReactNode;
  nota?: string;
}

const canales: Array<{ value: ContextoCalificaciones['canal']; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
  { value: 'CHATBOT', label: 'Chatbot' },
  { value: 'RETAIL', label: 'Retail' },
];

export function VentanaCalificaciones({
  abierto, titulo, descripcion, contexto, opcionesPeriodos, onCambiarContexto,
  ancho, claseContenido, onCerrar, children, nota,
}: VentanaCalificacionesProps) {
  // El panel conserva el estado y los datos; los dos modales notifican el mismo cambio.
  function cambiarCanal(valor: string | null) {
    const canal = canales.find((opcion) => opcion.value === valor)?.value;
    if (canal && canal !== contexto.canal) onCambiarContexto({ ...contexto, canal });
  }

  const periodos = [...new Set([contexto.periodo, ...opcionesPeriodos])].filter(Boolean);

  return (
    <Modal.Root
      opened={abierto}
      onClose={onCerrar}
      size={ancho}
      centered
      padding={0}
      radius="lg"
      closeOnClickOutside={false}
      transitionProps={{ transition: 'fade', duration: 150, timingFunction: 'ease-out' }}
      classNames={{ content: styles.modal, body: styles.cuerpo }}
    >
      <Modal.Overlay backgroundOpacity={0} />
      <Modal.Content>
        <Modal.Body>
          <div className={`${styles.contenido} ${claseContenido}`}>
            <header>
              <Modal.Title className={styles.titulo}>{titulo}</Modal.Title>
              <p className={styles.descripcion}>{descripcion}</p>
            </header>
            <div className={styles.contexto} role="group" aria-label="Filtros de calificaciones">
              <Select
                label="Periodo"
                placeholder="Seleccionar periodo"
                data={periodos}
                value={contexto.periodo || null}
                onChange={(periodo) => {
                  if (periodo && periodo !== contexto.periodo) {
                    onCambiarContexto({ ...contexto, periodo });
                  }
                }}
                allowDeselect={false}
                leftSection={<img src={calendario} alt="" />}
                classNames={{ label: styles.etiquetaFiltro, input: styles.selector }}
                comboboxProps={{ withinPortal: false }}
              />
              <Select
                label="Canal"
                placeholder="Seleccionar canal"
                data={canales}
                value={contexto.canal}
                onChange={cambiarCanal}
                allowDeselect={false}
                classNames={{ label: styles.etiquetaFiltro, input: styles.selector }}
                comboboxProps={{ withinPortal: false }}
              />
            </div>
            {children}
            <footer className={styles.pie}>
              {nota && <p className={styles.nota}>{nota}</p>}
              <Button color="ink.9" className={styles.cerrar} onClick={onCerrar}>Cerrar</Button>
            </footer>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
