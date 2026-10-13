// Ejecuta una consulta async y expone sus estados (loading / success / error).
// El estado "vacío" lo resuelve <EstadoCarga> a partir de `datos`.
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export interface ResultadoConsulta<T> {
  datos: T | null;
  cargando: boolean;
  error: unknown;
  recargar: () => void;
}

export function useConsulta<T>(consulta: () => Promise<T>, deps: DependencyList): ResultadoConsulta<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);
  const consultaRef = useRef(consulta);
  consultaRef.current = consulta;

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    consultaRef
      .current()
      .then((resultado) => {
        if (!cancelado) setDatos(resultado);
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [...deps, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { datos, cargando, error, recargar };
}
