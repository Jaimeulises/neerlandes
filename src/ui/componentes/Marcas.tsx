import type { ReactElement } from 'react';
import type { Marca } from '../../motor';

interface Props {
  readonly marcas: readonly Marca[];
  readonly etiqueta: string;
}

/** Una frase palabra a palabra: lo que sobra tachado, lo que faltaba subrayado. */
export function Marcas({ marcas, etiqueta }: Props): ReactElement {
  return (
    <p className="marcas" lang="nl" aria-label={etiqueta}>
      {marcas.map((m, i) => (
        <span key={i}>
          {i > 0 ? ' ' : ''}
          <span className={m.estado === 'bien' ? undefined : `marca--${m.estado}`}>{m.texto}</span>
        </span>
      ))}
    </p>
  );
}
