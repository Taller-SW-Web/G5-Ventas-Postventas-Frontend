import type { ModalProps } from '@mantine/core';

/**
 * El título de un Modal de Mantine ya es un <h2>: un <Title> dentro anidaba un <h3> en el <h2> (HTML inválido,
 * React lo avisa en consola). Se pasa el texto como título y se le da el aspecto de un Title order 3 (Oswald en
 * mayúscula, ver theme/global.css).
 */
export const ESTILO_TITULO_MODAL: ModalProps['styles'] = {
  title: {
    fontFamily: 'var(--mantine-font-family-headings)',
    fontSize: 'var(--mantine-h3-font-size)',
    fontWeight: 'var(--mantine-h3-font-weight)',
    lineHeight: 'var(--mantine-h3-line-height)',
    textTransform: 'uppercase',
  },
};
