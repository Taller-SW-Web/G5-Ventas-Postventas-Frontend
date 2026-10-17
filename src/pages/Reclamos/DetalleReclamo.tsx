// Panel de revisión de un reclamo (Mockup 07, secciones 6 a 9): detalle, plazo, historial,
// formato y acciones según la etapa. Responder y marcar como atendido son dos pasos separados.
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Alert,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Timeline,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { EstadoBadge } from '@/components/EstadoBadge';
import { EstadoCarga } from '@/components/EstadoCarga';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { useConsulta } from '@/hooks/useConsulta';
import { ApiError } from '@/services/api';
import { sesionActual } from '@/services/auth';
import { obtenerReclamo, responderReclamo } from '@/services/reclamos';
import type { ReclamoDetalle, ResponderReclamoRequest } from '@/types/reclamo';
import { FormatoReclamoModal } from './FormatoReclamoModal';
import { ETIQUETA_CANAL, ETIQUETA_MOTIVO, ETIQUETA_TIPO, fecha, fechaHora, textoPlazo } from './formato';

interface Props {
  codigo: string;
  onCerrar: () => void;
  /** Se llama después de cambiar el estado, para refrescar la bandeja. */
  onActualizado: () => void;
}

/** Quién atiende (atendidoPor, máx. 50): el sub del token. Sin login (solo dev) se usa un id de prueba. */
function gestorActual(): string {
  return sesionActual().usuarioId ?? 'GESTOR-LOCAL';
}

function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed" fw={600}>
        {titulo}
      </Text>
      {typeof children === 'string' ? <Text size="sm">{children}</Text> : children}
    </div>
  );
}

export function DetalleReclamo({ codigo, onCerrar, onActualizado }: Props) {
  const consulta = useConsulta(() => obtenerReclamo(codigo), [codigo]);

  return (
    <Paper withBorder radius="md" p="lg">
      <Group justify="space-between" mb="md">
        <Title order={3}>Detalle del reclamo</Title>
        <ActionIcon variant="subtle" color="gray" onClick={onCerrar} aria-label="Cerrar detalle">
          ✕
        </ActionIcon>
      </Group>
      <EstadoCarga
        cargando={consulta.cargando}
        error={consulta.error}
        datos={consulta.datos}
        onReintentar={consulta.recargar}
      >
        {(reclamo) => (
          <Contenido
            reclamo={reclamo}
            onActualizado={() => {
              consulta.recargar();
              onActualizado();
            }}
          />
        )}
      </EstadoCarga>
    </Paper>
  );
}

function Contenido({ reclamo, onActualizado }: { reclamo: ReclamoDetalle; onActualizado: () => void }) {
  const navigate = useNavigate();
  const [borrador, setBorrador] = useState('');
  const [textoModal, setTextoModal] = useState('');
  const [modal, setModal] = useState<'responder' | 'cerrar' | 'formato' | null>(null);
  const [procesando, setProcesando] = useState(false);

  const abierto = reclamo.estado === 'EN_PROCESO' || reclamo.estado === 'DERIVADO';
  const tieneBorrador = borrador.trim().length > 0;

  async function enviar(body: Omit<ResponderReclamoRequest, 'atendidoPor'>, exito: string) {
    setProcesando(true);
    try {
      await responderReclamo(reclamo.codigoSeguimiento, { ...body, atendidoPor: gestorActual() });
      notifications.show({ color: 'green', message: exito });
      setModal(null);
      setBorrador('');
      onActualizado();
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo actualizar el reclamo',
        message: e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.',
      });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Stack gap="md">
      <Group gap="xs">
        <Text fw={700}>{reclamo.codigoSeguimiento}</Text>
        <EstadoBadge entidad="reclamo" estado={reclamo.estado} />
        {reclamo.estadoSla && <EstadoBadge entidad="sla" estado={reclamo.estadoSla} />}
        <Text size="sm" c="dimmed">
          {textoPlazo(reclamo.diasHabilesRestantes, reclamo.slaCumplido)}
        </Text>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Campo titulo="Cliente">{reclamo.consumidor?.nombreCompleto ?? '—'}</Campo>
        <Campo titulo="Pedido asociado">{reclamo.pedidoId ?? 'Sin pedido asociado'}</Campo>
        <Campo titulo="Tipo / canal">
          {`${ETIQUETA_TIPO[reclamo.tipo]} · ${ETIQUETA_CANAL[reclamo.canal]}`}
        </Campo>
        <Campo titulo="Motivo">{ETIQUETA_MOTIVO[reclamo.motivo]}</Campo>
        <Campo titulo="Fecha de creación">{fechaHora(reclamo.fechaRegistro)}</Campo>
        <Campo titulo="Fecha límite de respuesta">{fecha(reclamo.fechaLimiteSLA)}</Campo>
      </SimpleGrid>

      {reclamo.consumidor && (
        <Campo titulo="Contacto">
          {`${reclamo.consumidor.documento} · ${reclamo.consumidor.email} · ${reclamo.consumidor.telefono}`}
        </Campo>
      )}
      <Campo titulo="Descripción del problema">{reclamo.detalle}</Campo>
      <Campo titulo="Respuesta visible al cliente">
        <Text size="sm" c={reclamo.respuestaVisibleCliente || tieneBorrador ? undefined : 'dimmed'}>
          {reclamo.respuestaVisibleCliente ??
            (tieneBorrador ? `${borrador} (guardada, se envía al marcar como atendido)` : 'Pendiente de respuesta formal')}
        </Text>
      </Campo>

      <Divider label="Historial de atención" labelPosition="left" />
      <Timeline
        active={reclamo.estado === 'REGISTRADO' ? 0 : reclamo.estado === 'ATENDIDO' ? 2 : 1}
        bulletSize={14}
        lineWidth={2}
      >
        <Timeline.Item title="Reclamo registrado">
          <Text size="xs" c="dimmed">
            {fechaHora(reclamo.fechaRegistro)} · plazo de {reclamo.plazoDiasHabiles} días hábiles
          </Text>
        </Timeline.Item>
        <Timeline.Item title={reclamo.estado === 'DERIVADO' ? 'Reclamo derivado' : 'Atención en proceso'}>
          <Text size="xs" c="dimmed">
            {reclamo.estado === 'REGISTRADO' ? '—' : `Responsable: ${reclamo.atendidoPor ?? '—'}`}
          </Text>
        </Timeline.Item>
        <Timeline.Item title="Reclamo atendido">
          <Text size="xs" c="dimmed">
            {reclamo.estado === 'ATENDIDO' ? fechaHora(reclamo.fechaAtencion) : '—'}
          </Text>
        </Timeline.Item>
      </Timeline>

      {reclamo.estadoSla === 'VENCIDO' && reclamo.estado !== 'ATENDIDO' && (
        <Alert color="red" variant="light">
          El plazo legal venció: el reclamo sigue pendiente de respuesta formal.
        </Alert>
      )}

      <Divider label="Acciones" labelPosition="left" />
      <Group gap="sm">
        {reclamo.estado === 'REGISTRADO' && (
          <Button
            loading={procesando}
            onClick={() => enviar({ nuevoEstado: 'EN_PROCESO' }, 'Atención iniciada.')}
          >
            Iniciar atención
          </Button>
        )}
        {abierto && (
          <Button
            variant={tieneBorrador ? 'default' : 'filled'}
            onClick={() => {
              setTextoModal(borrador);
              setModal('responder');
            }}
          >
            Responder reclamo
          </Button>
        )}
        {abierto && (
          <Button disabled={!tieneBorrador} onClick={() => setModal('cerrar')}>
            Marcar como atendido
          </Button>
        )}
        <Button variant="default" onClick={() => setModal('formato')}>
          Generar PDF
        </Button>
        {reclamo.pedidoId ? (
          <Button variant="subtle" onClick={() => navigate(`/admin/pedidos/${reclamo.pedidoId}`)}>
            Volver al pedido
          </Button>
        ) : (
          <Text size="sm" c="dimmed">
            Sin pedido asociado
          </Text>
        )}
      </Group>

      {/* Modal_Responder_reclamo: guarda la respuesta en pantalla; el envío ocurre al confirmar el cierre. */}
      <Modal
        opened={modal === 'responder'}
        onClose={() => setModal(null)}
        title={<Text fw={700}>Responder reclamo {reclamo.codigoSeguimiento}</Text>}
      >
        <Stack>
          <Text size="sm">
            Esta respuesta será visible para el cliente al consultar su reclamo y quedará registrada con la fecha de
            atención.
          </Text>
          <Textarea
            label="Respuesta visible al cliente"
            autosize
            minRows={4}
            value={textoModal}
            onChange={(e) => setTextoModal(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!textoModal.trim()}
              onClick={() => {
                setBorrador(textoModal.trim());
                setModal(null);
              }}
            >
              Guardar respuesta
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal_Marcar_atendido: confirmación explícita (stack-frontend 8.1). */}
      <ModalConfirmacion
        abierto={modal === 'cerrar'}
        titulo="Marcar como atendido"
        mensaje={
          <Stack gap="xs">
            <Text size="sm">
              El reclamo {reclamo.codigoSeguimiento} pasará a ATENDIDO y el cliente verá esta respuesta. Esta acción no
              se puede deshacer.
            </Text>
            <Paper withBorder p="sm" bg="cloud.2">
              <Text size="sm">{borrador}</Text>
            </Paper>
          </Stack>
        }
        textoConfirmar="Confirmar cierre"
        procesando={procesando}
        confirmarDeshabilitado={!tieneBorrador}
        onConfirmar={() =>
          enviar({ nuevoEstado: 'ATENDIDO', respuestaVisibleCliente: borrador }, 'Reclamo marcado como atendido.')
        }
        onCerrar={() => setModal(null)}
      />

      <FormatoReclamoModal
        reclamo={reclamo}
        borrador={borrador}
        abierto={modal === 'formato'}
        onCerrar={() => setModal(null)}
      />
    </Stack>
  );
}
