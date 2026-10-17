// Fuente de datos de F3 para las pantallas de Postventa (Mockup 05 y 06).
// Mientras M2 no exponga 2.3–2.5 se trabaja con los datos fijos del Mockup 06 (guía frontend 1.2);
// las llamadas reales ya están escritas en services/devoluciones.ts. Para conectarlas, cambiar
// USAR_DATOS_DE_PRUEBA a false: las pantallas no necesitan ningún otro cambio.
import { ApiError } from '@/services/api';
import {
  listarDevoluciones,
  obtenerDevolucion,
  resolverDevolucion,
} from '@/services/devoluciones';
import type {
  DevolucionDetalle,
  DevolucionResumen,
  FiltrosDevoluciones,
  ListadoDevoluciones,
  ResolverDevolucionRequest,
  ResolverDevolucionResponse,
} from '@/types/devolucion';
import { DEVOLUCIONES_MOCKUP_06 } from './datosMockup06';

export const USAR_DATOS_DE_PRUEBA = true;

export interface FuenteDevoluciones {
  listar: (filtros: FiltrosDevoluciones) => Promise<ListadoDevoluciones>;
  /** Consulta el expediente (2.3). */
  obtener: (devolucionId: string) => Promise<DevolucionDetalle>;
  /**
   * SOLICITADA → EN_EVALUACION. En el backend real no hay endpoint propio: lo hace 2.3 cuando
   * el Gestor consulta el expediente (ESP-08 §7.1), así que en la práctica el botón casi nunca aparece.
   */
  iniciarEvaluacion: (devolucionId: string) => Promise<DevolucionDetalle>;
  /** 2.5. Repetir la aprobación sobre un expediente APROBADA reintenta la coordinación (cambio o F4). */
  resolver: (
    devolucionId: string,
    body: ResolverDevolucionRequest,
  ) => Promise<ResolverDevolucionResponse>;
}

// ---------- Implementación real (contrato api-postventas.md) ----------

const fuenteReal: FuenteDevoluciones = {
  listar: listarDevoluciones,
  obtener: obtenerDevolucion,
  iniciarEvaluacion: obtenerDevolucion,
  resolver: resolverDevolucion,
};

// ---------- Implementación con datos de prueba ----------

// Copia en memoria: las decisiones se mantienen mientras la app esté abierta (también las ve el Hub).
const expedientes: DevolucionDetalle[] = structuredClone(DEVOLUCIONES_MOCKUP_06);

const esperar = () => new Promise((r) => setTimeout(r, 300));

function buscarExpediente(devolucionId: string): DevolucionDetalle {
  const exp = expedientes.find((e) => e.devolucionId === devolucionId);
  if (!exp) throw new ApiError(404, 'DEVOLUCION_NO_ENCONTRADA', 'El expediente solicitado no existe.');
  return exp;
}

function aResumen(e: DevolucionDetalle): DevolucionResumen {
  return {
    devolucionId: e.devolucionId,
    pedidoId: e.pedidoId,
    tipo: e.tipo,
    estado: e.estado,
    motivo: e.motivo,
    estadoReembolso: e.resolucion?.reembolso?.estado ?? null,
    fechaRegistro: e.fechaRegistro,
    canal: e.canal,
    nombreCliente: e.nombreCliente,
  };
}

function coincide(e: DevolucionDetalle, f: FiltrosDevoluciones): boolean {
  if (f.clienteId && e.clienteId !== f.clienteId) return false;
  if (f.estado && e.estado !== f.estado) return false;
  if (f.tipo && e.tipo !== f.tipo) return false;
  if (f.canal && e.canal !== f.canal) return false;
  if (f.buscar) {
    const texto = f.buscar.toLowerCase();
    const campos = [e.devolucionId, e.pedidoId, e.nombreCliente ?? ''];
    if (!campos.some((c) => c.toLowerCase().includes(texto))) return false;
  }
  return true;
}

function respuestaResolucion(e: DevolucionDetalle): ResolverDevolucionResponse {
  const r = e.resolucion!;
  return {
    devolucionId: e.devolucionId,
    estado: e.estado,
    decision: r.decision,
    tipoResolucion: r.tipoResolucion,
    fundamento: r.fundamento,
    autorizadorId: r.autorizadorId,
    fechaResolucion: r.fechaResolucion,
    referenciaOperacion: r.referenciaOperacion,
  };
}

const fuentePrueba: FuenteDevoluciones = {
  async listar(filtros) {
    await esperar();
    const pagina = filtros.pagina ?? 0;
    const tamano = filtros.tamano ?? 10;
    const signo = filtros.orden === 'ANTIGUOS' ? 1 : -1;
    const todos = expedientes
      .filter((e) => coincide(e, filtros))
      .sort(
        (a, b) =>
          signo * (a.fechaRegistro.localeCompare(b.fechaRegistro) || a.devolucionId.localeCompare(b.devolucionId)),
      );
    return {
      contenido: todos.slice(pagina * tamano, (pagina + 1) * tamano).map(aResumen),
      pagina,
      totalPaginas: Math.max(1, Math.ceil(todos.length / tamano)),
      totalElementos: todos.length,
    };
  },

  async obtener(devolucionId) {
    await esperar();
    return structuredClone(buscarExpediente(devolucionId));
  },

  async iniciarEvaluacion(devolucionId) {
    await esperar();
    const exp = buscarExpediente(devolucionId);
    if (exp.estado === 'SOLICITADA') exp.estado = 'EN_EVALUACION';
    return structuredClone(exp);
  },

  async resolver(devolucionId, body) {
    await esperar();
    const exp = buscarExpediente(devolucionId);

    if (body.decision === 'RECHAZADA' && !body.fundamento?.trim()) {
      throw new ApiError(400, 'FUNDAMENTO_REQUERIDO', 'El rechazo necesita un fundamento.');
    }

    // Reintento sobre un expediente ya aprobado: coordina el cambio o confirma el envío a F4.
    if (exp.estado === 'APROBADA' && body.decision === 'APROBADA' && exp.resolucion) {
      if (exp.resolucion.tipoResolucion === 'CAMBIO') {
        // Simplificación del mockup: el cierre real depende de la confirmación de Despacho.
        exp.estado = 'COMPLETADA';
      } else {
        exp.resolucion.referenciaOperacion = `REEM-9${exp.devolucionId.slice(-4)}`;
      }
      return respuestaResolucion(exp);
    }

    if (exp.estado !== 'EN_EVALUACION') {
      throw new ApiError(
        409,
        'DEVOLUCION_NO_RESOLUBLE',
        'El expediente ya está resuelto o todavía no está en evaluación.',
      );
    }

    const ahora = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    exp.estado = body.decision;
    exp.resolucion = {
      decision: body.decision,
      tipoResolucion:
        body.decision === 'RECHAZADA'
          ? 'RECHAZO'
          : (body.tipoResolucion ?? (exp.tipo === 'CAMBIO' ? 'CAMBIO' : 'REEMBOLSO')),
      fundamento: body.decision === 'RECHAZADA' ? body.fundamento!.trim() : null,
      autorizadorId: 'GESTOR-03',
      fechaResolucion: ahora,
      referenciaOperacion: null,
    };
    return respuestaResolucion(exp);
  },
};

export const fuenteDevoluciones: FuenteDevoluciones = USAR_DATOS_DE_PRUEBA ? fuentePrueba : fuenteReal;
