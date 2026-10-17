import { createContext, useContext, useState, type ReactNode } from 'react';
import { useConsulta, type ResultadoConsulta } from '@/hooks/useConsulta';
import { listarCalificaciones } from '@/services/calificaciones';
import type { ListadoCalificaciones } from '@/types/consultaCalificaciones';
import type { ContextoCalificaciones } from './calificaciones.types';
import { ComentariosClientes } from './ComentariosClientes';
import { DetalleSatisfaccion } from './DetalleSatisfaccion';
import { comentariosClientes, resumenSatisfaccion } from './consultaCalificaciones';
import { etiquetaPeriodo, opcionesPeriodo, rangoReporte, type PeriodoReporte } from './reportes';

interface EstadoCalificaciones {
  consulta: ResultadoConsulta<ListadoCalificaciones>;
  abrir: (ventana: 'satisfaccion' | 'comentarios') => void;
}

const Contexto = createContext<EstadoCalificaciones | null>(null);

export function useCalificaciones() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('Falta ProveedorCalificaciones en el panel de reportes.');
  return contexto;
}

interface Props {
  periodo: PeriodoReporte;
  canal: ContextoCalificaciones['canal'];
  onCambiarFiltros: (periodo: PeriodoReporte, canal: ContextoCalificaciones['canal']) => void;
  children: ReactNode;
}

export function ProveedorCalificaciones({ periodo, canal, onCambiarFiltros, children }: Props) {
  const [ventana, setVentana] = useState<'satisfaccion' | 'comentarios' | null>(null);
  const [pagina, setPagina] = useState(0);
  const rango = rangoReporte(periodo);
  const filtros = { ...rango, canal: canal === 'TODOS' ? undefined : canal };
  const consulta = useConsulta(() => listarCalificaciones({ ...filtros, tamano: 5 }),
    [rango.desde, rango.hasta, canal]);
  const lista = useConsulta(() => ventana === 'comentarios'
    ? listarCalificaciones({ ...filtros, pagina, tamano: 8 }) : Promise.resolve(null),
    [rango.desde, rango.hasta, canal, pagina, ventana === 'comentarios']);

  function abrir(siguiente: 'satisfaccion' | 'comentarios') {
    setPagina(0);
    setVentana(siguiente);
  }

  function cambiarContexto(contexto: ContextoCalificaciones) {
    const opcion = opcionesPeriodo().find((p) => p.label === contexto.periodo);
    if (!opcion) return;
    setPagina(0);
    onCambiarFiltros(opcion.value, contexto.canal);
  }

  const comunes = {
    contexto: { periodo: etiquetaPeriodo(periodo), canal },
    opcionesPeriodos: opcionesPeriodo().map((p) => p.label),
    onCambiarContexto: cambiarContexto,
    onCerrar: () => setVentana(null),
  };

  return (
    <Contexto.Provider value={{ consulta, abrir }}>
      {children}
      <DetalleSatisfaccion {...comunes} abierto={ventana === 'satisfaccion'}
        resumen={resumenSatisfaccion(consulta.datos)} estado={consulta} />
      <ComentariosClientes {...comunes} abierto={ventana === 'comentarios'}
        comentarios={comentariosClientes(lista.datos)} estado={lista}
        pagina={pagina + 1} totalPaginas={lista.datos?.totalPaginas ?? 0}
        onCambiarPagina={(p) => setPagina(p - 1)} />
    </Contexto.Provider>
  );
}
