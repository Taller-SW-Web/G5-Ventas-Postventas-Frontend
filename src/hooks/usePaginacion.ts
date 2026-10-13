// Estado de paginación con la convención del contrato: `pagina` desde 0 y `tamano`.
import { useState } from 'react';

export function usePaginacion(tamanoInicial = 10) {
  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(tamanoInicial);

  return {
    pagina,
    tamano,
    setPagina,
    setTamano: (nuevo: number) => {
      setTamano(nuevo);
      setPagina(0);
    },
    reiniciar: () => setPagina(0),
  };
}
