// Bloque "Acciones disponibles" del Mockup 06 y sus modales (Dev Aprobar, Dev Rechazar, Dev Cambio,
// Dev Reembolso) más la confirmación de recepción física (2.5b). Solo se muestran las acciones que el
// estado actual permite; el backend vuelve a validar todo.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { ApiError } from '@/services/api';
import { obtenerDevolucion, resolverDevolucion } from '@/services/devoluciones';
import type { ResolverDevolucionRequest } from '@/types/devolucion';
import { IconoModal, mensajeError } from './comunes';
import { ModalRecepcion } from './ModalRecepcion';
import { TarjetaPanel } from './PanelesExpediente';
import { faltaRecepcion, type Expediente } from './expediente';
import { ETIQUETA_TIPO } from './formato';

type Modal = 'aprobar' | 'rechazar' | 'cambio' | 'reembolso' | 'sinStock' | 'recepcion';

export function AccionesExpediente({
  expediente,
  onCambio,
}: {
  expediente: Expediente;
  /** Se llama después de cada acción exitosa para recargar el expediente y la bandeja. */
  onCambio: () => void;
}) {
  const navigate = useNavigate();
  const { devolucion: e } = expediente;
  const [modal, setModal] = useState<Modal | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [fundamento, setFundamento] = useState('');
  const [requiereDevolucionFisica, setRequiereDevolucionFisica] = useState(true);

  const r = e.resolucion;
  const camino = r?.tipoResolucion ?? (e.tipo === 'CAMBIO' ? 'CAMBIO' : 'REEMBOLSO');
  const aprobada = e.estado === 'APROBADA';
  // Si F4 o M1 no confirmaron todavía, repetir la aprobación reintenta la coordinación sin duplicar (2.5).
  const reembolsoPorReintentar = !r?.referenciaOperacion || r.reembolso?.estado === 'FALLIDO';

  function cerrar() {
    setModal(null);
    setFundamento('');
    setRequiereDevolucionFisica(true);
  }

  async function ejecutar(accion: () => Promise<unknown>, exito: string) {
    setProcesando(true);
    try {
      await accion();
      notifications.show({ color: 'green', title: e.devolucionId, message: exito });
      cerrar();
      onCambio();
    } catch (error) {
      // Sin stock para el cambio: se ofrece resolverlo como reembolso (ESP-08 CA-05).
      if (error instanceof ApiError && error.codigo === 'SIN_STOCK') {
        setModal('sinStock');
        return;
      }
      notifications.show({ color: 'red', title: 'No se pudo completar la acción', message: mensajeError(error) });
    } finally {
      setProcesando(false);
    }
  }

  const resolver = (body: ResolverDevolucionRequest, exito: string) =>
    ejecutar(() => resolverDevolucion(e.devolucionId, body), exito);

  return (
    <TarjetaPanel titulo="Acciones disponibles">
      <Stack gap="xs">
        {/* Al abrir el expediente, 2.3 ya lo pasa a EN_EVALUACION: el botón solo aparece si eso no ocurrió. */}
        {e.estado === 'SOLICITADA' && (
          <Button
            fullWidth
            loading={procesando}
            onClick={() => ejecutar(() => obtenerDevolucion(e.devolucionId), 'El expediente pasó a evaluación.')}
          >
            Iniciar evaluación
          </Button>
        )}

        {e.estado === 'EN_EVALUACION' && (
          <>
            <Button fullWidth onClick={() => setModal('aprobar')}>
              Aprobar solicitud
            </Button>
            <Button fullWidth variant="outline" onClick={() => setModal('rechazar')}>
              Rechazar solicitud
            </Button>
          </>
        )}

        {aprobada && camino === 'CAMBIO' && !r?.referenciaOperacion && (
          <Button fullWidth onClick={() => setModal('cambio')}>
            Coordinar cambio
          </Button>
        )}

        {aprobada && camino === 'REEMBOLSO' && reembolsoPorReintentar && (
          <Button fullWidth onClick={() => setModal('reembolso')}>
            Derivar a reembolso
          </Button>
        )}

        {faltaRecepcion(expediente) && (
          <Button fullWidth variant="outline" onClick={() => setModal('recepcion')}>
            Confirmar recepción física
          </Button>
        )}

        {camino === 'REEMBOLSO' && r?.referenciaOperacion && (
          <Button fullWidth variant="light" onClick={() => navigate('/admin/postventa/reembolsos')}>
            Ver en Reembolsos
          </Button>
        )}

        {camino === 'CAMBIO' && r?.referenciaOperacion && (
          <Button
            fullWidth
            variant="light"
            onClick={() => navigate(`/admin/pedidos/${encodeURIComponent(r.referenciaOperacion!)}`)}
          >
            Ver pedido de reemplazo
          </Button>
        )}

        {aprobada && !faltaRecepcion(expediente) && r?.referenciaOperacion && (
          <Text size="xs" c="dimmed" ta="center">
            Se completa cuando {camino === 'CAMBIO' ? 'Ventas confirme la entrega del reemplazo' : 'F4 confirme el reembolso'}.
          </Text>
        )}

        {(e.estado === 'RECHAZADA' || e.estado === 'COMPLETADA') && (
          <Text size="sm" c="dimmed" ta="center" py={4}>
            Expediente resuelto: no hay acciones pendientes.
          </Text>
        )}

        <Button
          variant="default"
          fullWidth
          onClick={() => navigate(`/admin/pedidos/${encodeURIComponent(e.pedidoId)}`)}
        >
          Volver al pedido
        </Button>
      </Stack>

      <ModalConfirmacion
        abierto={modal === 'aprobar'}
        icono={<IconoModal tipo="check" />}
        titulo="CONFIRMAR APROBACIÓN"
        mensaje={`Vas a aprobar el expediente ${e.devolucionId} (${ETIQUETA_TIPO[e.tipo].toLowerCase()}) del pedido ${e.pedidoId}. ${
          camino === 'CAMBIO'
            ? 'Se pedirá a Ventas el pedido de reemplazo y el cliente debe devolver el producto.'
            : 'Se enviará el reembolso a F4.'
        }`}
        textoConfirmar="Confirmar"
        procesando={procesando}
        onCerrar={cerrar}
        onConfirmar={() =>
          resolver(
            camino === 'REEMBOLSO' ? { decision: 'APROBADA', requiereDevolucionFisica } : { decision: 'APROBADA' },
            'Solicitud aprobada.',
          )
        }
      >
        {camino === 'REEMBOLSO' && (
          <Checkbox
            label="El cliente debe devolver el producto al almacén"
            description="Desmárcalo si el cliente se queda con el producto (no se espera recepción ni se reintegra stock)."
            checked={requiereDevolucionFisica}
            onChange={(ev) => setRequiereDevolucionFisica(ev.currentTarget.checked)}
          />
        )}
      </ModalConfirmacion>

      <ModalConfirmacion
        abierto={modal === 'rechazar'}
        icono={<IconoModal tipo="rechazo" />}
        titulo="CONFIRMAR RECHAZO"
        mensaje={`Vas a rechazar el expediente ${e.devolucionId} del pedido ${e.pedidoId}. El fundamento queda registrado como sustento de la decisión.`}
        textoConfirmar="Confirmar rechazo"
        colorConfirmar="ink"
        procesando={procesando}
        confirmarDeshabilitado={!fundamento.trim()}
        onCerrar={cerrar}
        onConfirmar={() => resolver({ decision: 'RECHAZADA', fundamento: fundamento.trim() }, 'Solicitud rechazada.')}
      >
        <Textarea
          label="Fundamento del rechazo"
          placeholder="Evidencia insuficiente para validar la solicitud"
          required
          autosize
          minRows={2}
          maxLength={2000}
          value={fundamento}
          onChange={(ev) => setFundamento(ev.currentTarget.value)}
        />
      </ModalConfirmacion>

      <ModalConfirmacion
        abierto={modal === 'cambio'}
        icono={<IconoModal tipo="check" />}
        titulo="CONFIRMAR CAMBIO"
        mensaje={`Se volverá a pedir a Ventas el pedido de reemplazo del ${e.pedidoId}. No se duplica nada si ya existía. El expediente ${e.devolucionId} se completa cuando el reemplazo se entregue y el producto devuelto llegue al almacén.`}
        textoConfirmar="Confirmar"
        procesando={procesando}
        onCerrar={cerrar}
        onConfirmar={() => resolver({ decision: 'APROBADA', tipoResolucion: 'CAMBIO' }, 'Cambio coordinado con Ventas.')}
      />

      <ModalConfirmacion
        abierto={modal === 'reembolso'}
        icono={<IconoModal tipo="check" />}
        titulo="DERIVAR A REEMBOLSO"
        mensaje={`Se enviará el expediente ${e.devolucionId} a Reembolsos (F4) como origen aprobado del pedido ${e.pedidoId}. Si ya se había enviado, F4 no lo duplica. Esto no ejecuta el abono: el reembolso se procesa en su propio módulo.`}
        textoConfirmar="Confirmar"
        procesando={procesando}
        onCerrar={cerrar}
        onConfirmar={() => resolver({ decision: 'APROBADA', tipoResolucion: 'REEMBOLSO' }, 'Origen enviado a F4.')}
      />

      <ModalConfirmacion
        abierto={modal === 'sinStock'}
        icono={<IconoModal tipo="rechazo" />}
        titulo="SIN STOCK PARA EL CAMBIO"
        mensaje={`Productos no tiene stock para cambiar el producto del pedido ${e.pedidoId}. Puedes aprobar el expediente ${e.devolucionId} como reembolso (se envía a F4) o cancelar y rechazarlo.`}
        textoConfirmar="Aprobar como reembolso"
        procesando={procesando}
        onCerrar={cerrar}
        onConfirmar={() =>
          resolver({ decision: 'APROBADA', tipoResolucion: 'REEMBOLSO' }, 'Aprobada como reembolso por falta de stock.')
        }
      />

      <ModalRecepcion
        abierto={modal === 'recepcion'}
        expediente={expediente}
        onCerrar={cerrar}
        onConfirmado={() => {
          cerrar();
          onCambio();
        }}
      />
    </TarjetaPanel>
  );
}
