// Confirmar recepción física (2.5b): las unidades devueltas llegaron al almacén y cuántas son aptas para
// reventa. No está en el Figma (2.5b es posterior al mockup); sigue el estilo de los modales del Mockup 06.
import { useState } from 'react';
import { Alert, FileInput, Group, NumberInput, Paper, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { confirmarRecepcion, subirEvidencia } from '@/services/devoluciones';
import {
  EVIDENCIA_FORMATOS_PERMITIDOS,
  EVIDENCIA_TAMANO_MAXIMO_BYTES,
} from '@/types/devolucion';
import { IconoModal, mensajeError } from './comunes';
import { lineasDevueltas, type Expediente } from './expediente';

interface Cantidades {
  recibida: number;
  apta: number;
}

/** Validación en cliente antes de subir (el backend vuelve a validar, 2.1). */
function errorArchivo(archivo: File | null): string | null {
  if (!archivo) return null;
  if (!(EVIDENCIA_FORMATOS_PERMITIDOS as readonly string[]).includes(archivo.type)) {
    return 'Solo JPG, PNG, WEBP o PDF.';
  }
  if (archivo.size > EVIDENCIA_TAMANO_MAXIMO_BYTES) return 'El archivo supera los 5 MB.';
  return null;
}

export function ModalRecepcion({
  abierto,
  expediente,
  onCerrar,
  onConfirmado,
}: {
  abierto: boolean;
  expediente: Expediente;
  onCerrar: () => void;
  onConfirmado: () => void;
}) {
  const { devolucion } = expediente;
  // Solo las líneas con unidades que todavía no llegaron.
  const pendientes = lineasDevueltas(expediente).filter((l) => l.recibidas < l.cantidad);
  const [cantidades, setCantidades] = useState<Record<string, Cantidades>>({});
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);

  const valor = (productoId: string, porDefecto: number): Cantidades =>
    cantidades[productoId] ?? { recibida: porDefecto, apta: porDefecto };

  const lineas = pendientes
    .filter((l) => l.sku !== null)
    .map((l) => ({ ...l, ...valor(l.productoId, l.cantidad - l.recibidas) }));
  const sinSku = pendientes.filter((l) => l.sku === null);
  const errorEvidencia = errorArchivo(archivo);
  const invalida =
    lineas.every((l) => l.recibida === 0) ||
    lineas.some((l) => l.apta > l.recibida || l.recibida > l.cantidad - l.recibidas) ||
    errorEvidencia !== null;

  function cambiar(productoId: string, porDefecto: number, campo: keyof Cantidades, nuevo: number) {
    setCantidades((c) => {
      const actual = c[productoId] ?? { recibida: porDefecto, apta: porDefecto };
      const siguiente = { ...actual, [campo]: nuevo };
      // Al bajar las recibidas, las aptas no pueden quedar por encima.
      if (campo === 'recibida' && siguiente.apta > nuevo) siguiente.apta = nuevo;
      return { ...c, [productoId]: siguiente };
    });
  }

  function cerrar() {
    setCantidades({});
    setArchivo(null);
    onCerrar();
  }

  async function confirmar() {
    setProcesando(true);
    try {
      const evidencia = archivo ? (await subirEvidencia(archivo)).url : undefined;
      const respuesta = await confirmarRecepcion(devolucion.devolucionId, {
        lineas: lineas
          .filter((l) => l.recibida > 0)
          .map((l) => ({ sku: l.sku!, cantidadRecibida: l.recibida, cantidadApta: l.apta })),
        evidencia,
      });
      notifications.show({
        color: 'green',
        title: devolucion.devolucionId,
        message: respuesta.reintegroSolicitado
          ? 'Recepción confirmada. Se pidió a Productos reintegrar las unidades aptas.'
          : 'Recepción confirmada. Ninguna unidad era apta: no se reintegra stock.',
      });
      setCantidades({});
      setArchivo(null);
      onConfirmado();
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo confirmar la recepción', message: mensajeError(error) });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <ModalConfirmacion
      abierto={abierto}
      icono={<IconoModal tipo="check" />}
      titulo="CONFIRMAR RECEPCIÓN"
      mensaje={`Registra las unidades del expediente ${devolucion.devolucionId} que llegaron al almacén. Solo las aptas para reventa se reintegran al inventario, y esta confirmación no se puede repetir para las mismas unidades.`}
      textoConfirmar="Confirmar recepción"
      procesando={procesando}
      confirmarDeshabilitado={invalida}
      onCerrar={cerrar}
      onConfirmar={confirmar}
    >
      <Stack gap="sm">
        {lineas.map((l) => (
          <Paper key={l.productoId} withBorder radius="sm" p="sm">
            <Text size="sm" fw={600}>
              {l.descripcion}
            </Text>
            <Text size="xs" c="dimmed" mb="xs">
              SKU {l.sku} · faltan {l.cantidad - l.recibidas} de {l.cantidad}
            </Text>
            <Group grow>
              <NumberInput
                label="Recibidas"
                min={0}
                max={l.cantidad - l.recibidas}
                allowDecimal={false}
                value={l.recibida}
                onChange={(v) => cambiar(l.productoId, l.cantidad - l.recibidas, 'recibida', Number(v) || 0)}
              />
              <NumberInput
                label="Aptas para reventa"
                min={0}
                max={l.recibida}
                allowDecimal={false}
                value={l.apta}
                error={l.apta > l.recibida ? 'No puede superar las recibidas' : undefined}
                onChange={(v) => cambiar(l.productoId, l.cantidad - l.recibidas, 'apta', Number(v) || 0)}
              />
            </Group>
          </Paper>
        ))}

        {sinSku.length > 0 && (
          <Alert color="yellow" title="Faltan datos del pedido">
            No se encontró el SKU de {sinSku.map((l) => l.productoId).join(', ')} en el pedido {devolucion.pedidoId}.
            Esas unidades no se pueden confirmar hasta que Ventas (M1) responda.
          </Alert>
        )}

        <FileInput
          label="Foto de la recepción (opcional)"
          placeholder="JPG, PNG, WEBP o PDF hasta 5 MB"
          accept={EVIDENCIA_FORMATOS_PERMITIDOS.join(',')}
          clearable
          value={archivo}
          onChange={setArchivo}
          error={errorEvidencia}
        />
      </Stack>
    </ModalConfirmacion>
  );
}
