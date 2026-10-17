// Bloque "Acciones disponibles" del Mockup 06 y sus cuatro modales (Dev Aprobar, Dev Rechazar,
// Dev Cambio, Dev Reembolso). Solo se muestran las acciones que el estado actual permite.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Center, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import iconoCheck from '@/assets/devoluciones/check.svg';
import iconoRechazo from '@/assets/devoluciones/rechazo.svg';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { ApiError } from '@/services/api';
import type { DevolucionDetalle, ResolverDevolucionRequest } from '@/types/devolucion';
import { TarjetaPanel } from './PanelesExpediente';
import { ETIQUETA_TIPO } from './formato';
import { fuenteDevoluciones } from './fuenteDevoluciones';

type Modal = 'aprobar' | 'rechazar' | 'cambio' | 'reembolso';

function IconoModal({ tipo }: { tipo: 'check' | 'rechazo' }) {
  return (
    <Center bg={tipo === 'check' ? 'volt.2' : 'red.1'} w={46} h={46} style={{ borderRadius: 12, flexShrink: 0 }}>
      <img src={tipo === 'check' ? iconoCheck : iconoRechazo} width={24} height={24} alt="" />
    </Center>
  );
}

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.noImplementado) return 'Esta acción todavía no está disponible en el servidor.';
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

export function AccionesExpediente({
  expediente: e,
  onCambio,
}: {
  expediente: DevolucionDetalle;
  /** Se llama después de cada acción exitosa para recargar el expediente y la bandeja. */
  onCambio: () => void;
}) {
  const navigate = useNavigate();
  const [modal, setModal] = useState<Modal | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [fundamento, setFundamento] = useState('');

  const tipoResolucion = e.resolucion?.tipoResolucion ?? (e.tipo === 'CAMBIO' ? 'CAMBIO' : 'REEMBOLSO');
  const enviadoAF4 = Boolean(e.resolucion?.referenciaOperacion || e.resolucion?.reembolso);

  async function ejecutar(accion: () => Promise<unknown>, exito: string) {
    setProcesando(true);
    try {
      await accion();
      notifications.show({ color: 'green', title: e.devolucionId, message: exito });
      setModal(null);
      setFundamento('');
      onCambio();
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo completar la acción', message: mensajeError(error) });
    } finally {
      setProcesando(false);
    }
  }

  const resolver = (body: ResolverDevolucionRequest, exito: string) =>
    ejecutar(() => fuenteDevoluciones.resolver(e.devolucionId, body), exito);

  const volverAlPedido = (
    <Button variant="default" fullWidth onClick={() => navigate(`/admin/pedidos/${encodeURIComponent(e.pedidoId)}`)}>
      Volver al pedido
    </Button>
  );

  return (
    <TarjetaPanel titulo="Acciones disponibles">
      <Stack gap="xs">
        {e.estado === 'SOLICITADA' && (
          <Button
            fullWidth
            loading={procesando}
            onClick={() =>
              ejecutar(() => fuenteDevoluciones.iniciarEvaluacion(e.devolucionId), 'El expediente pasó a evaluación.')
            }
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

        {e.estado === 'APROBADA' && tipoResolucion === 'CAMBIO' && (
          <Button fullWidth onClick={() => setModal('cambio')}>
            Coordinar cambio
          </Button>
        )}

        {e.estado === 'APROBADA' && tipoResolucion === 'REEMBOLSO' && !enviadoAF4 && (
          <Button fullWidth onClick={() => setModal('reembolso')}>
            Derivar a reembolso
          </Button>
        )}

        {tipoResolucion === 'REEMBOLSO' && enviadoAF4 && (
          <Button fullWidth variant="light" onClick={() => navigate('/admin/postventa/reembolsos')}>
            Ver en Reembolsos
          </Button>
        )}

        {(e.estado === 'RECHAZADA' || e.estado === 'COMPLETADA') && (
          <Text size="sm" c="dimmed" ta="center" py={4}>
            Expediente resuelto: no hay acciones pendientes.
          </Text>
        )}

        {volverAlPedido}
      </Stack>

      <ModalConfirmacion
        abierto={modal === 'aprobar'}
        icono={<IconoModal tipo="check" />}
        titulo="CONFIRMAR APROBACIÓN"
        mensaje={`Vas a aprobar el expediente ${e.devolucionId} (${ETIQUETA_TIPO[e.tipo].toLowerCase()}) del pedido ${e.pedidoId}. ${
          tipoResolucion === 'CAMBIO'
            ? 'Después tendrás que coordinar el cambio del producto.'
            : 'Después tendrás que derivar el reembolso a F4.'
        }`}
        textoConfirmar="Confirmar"
        procesando={procesando}
        onCerrar={() => setModal(null)}
        onConfirmar={() => resolver({ decision: 'APROBADA' }, 'Solicitud aprobada.')}
      />

      <ModalConfirmacion
        abierto={modal === 'rechazar'}
        icono={<IconoModal tipo="rechazo" />}
        titulo="CONFIRMAR RECHAZO"
        mensaje={`Vas a rechazar el expediente ${e.devolucionId} del pedido ${e.pedidoId}. El fundamento queda registrado como sustento de la decisión.`}
        textoConfirmar="Confirmar rechazo"
        colorConfirmar="ink"
        procesando={procesando}
        confirmarDeshabilitado={!fundamento.trim()}
        onCerrar={() => {
          setModal(null);
          setFundamento('');
        }}
        onConfirmar={() =>
          resolver({ decision: 'RECHAZADA', fundamento: fundamento.trim() }, 'Solicitud rechazada.')
        }
      >
        <Textarea
          label="Fundamento del rechazo"
          placeholder="Evidencia insuficiente para validar la solicitud"
          required
          autosize
          minRows={2}
          value={fundamento}
          onChange={(ev) => setFundamento(ev.currentTarget.value)}
        />
      </ModalConfirmacion>

      <ModalConfirmacion
        abierto={modal === 'cambio'}
        icono={<IconoModal tipo="check" />}
        titulo="CONFIRMAR CAMBIO"
        mensaje={`Se coordinará el nuevo despacho del producto del pedido ${e.pedidoId}. El expediente ${e.devolucionId} se completa cuando Despacho confirme la entrega.`}
        textoConfirmar="Confirmar"
        procesando={procesando}
        onCerrar={() => setModal(null)}
        onConfirmar={() =>
          resolver({ decision: 'APROBADA', tipoResolucion: 'CAMBIO' }, 'Cambio coordinado con Despacho.')
        }
      />

      <ModalConfirmacion
        abierto={modal === 'reembolso'}
        icono={<IconoModal tipo="check" />}
        titulo="DERIVAR A REEMBOLSO"
        mensaje={`Se enviará el expediente ${e.devolucionId} a Reembolsos (F4) como origen aprobado del pedido ${e.pedidoId}. Esto no ejecuta el abono: el reembolso se procesa en su propio módulo.`}
        textoConfirmar="Confirmar"
        procesando={procesando}
        onCerrar={() => setModal(null)}
        onConfirmar={() =>
          resolver({ decision: 'APROBADA', tipoResolucion: 'REEMBOLSO' }, 'Origen enviado a F4.')
        }
      />
    </TarjetaPanel>
  );
}
