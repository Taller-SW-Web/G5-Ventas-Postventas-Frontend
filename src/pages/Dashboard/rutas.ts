// Enlaces del panel "Atención prioritaria" del Dashboard hacia la pantalla completa (Mockup 01, 7.3 y 7.4).
import type { TipoCaso } from '../AtencionPrioritaria/casosPrioritarios';

const RUTA_PRIORITARIOS = '/admin/postventa/prioritarios';

/** Valor del filtro "Tipo" que entiende la pantalla de Atención prioritaria (?tipo=...). */
const FILTRO_POR_TIPO: Record<TipoCaso, string> = {
  RECLAMO: 'RECLAMOS',
  DEVOLUCION: 'DEVOLUCIONES',
  CAMBIO: 'CAMBIOS',
};

/**
 * Sin caso: "Ver todas". Con caso: "Ver", filtrado por su tipo y con ese mismo código seleccionado.
 * desde=dashboard hace que "Atrás" vuelva al Dashboard y no al Hub.
 */
export function rutaPrioritarios(caso?: { tipo: TipoCaso; codigo: string }): string {
  const params = new URLSearchParams({ desde: 'dashboard' });
  if (caso) {
    params.set('tipo', FILTRO_POR_TIPO[caso.tipo]);
    params.set('caso', caso.codigo);
  }
  return `${RUTA_PRIORITARIOS}?${params.toString()}`;
}
