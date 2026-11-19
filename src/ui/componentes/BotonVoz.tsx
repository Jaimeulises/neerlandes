import type { ReactElement } from 'react';
import type { Voz } from '../../estado/voz';

interface Props {
  readonly voz: Voz;
  readonly texto: string | undefined;
  readonly etiqueta?: string;
}

/** Altavoz para escuchar un texto en neerlandés. No se pinta si no hay voz. */
export function BotonVoz({ voz, texto, etiqueta = 'Escuchar' }: Props): ReactElement | null {
  if (!voz.disponible || !texto) return null;
  return (
    <button
      type="button"
      className="boton-voz"
      aria-label={etiqueta}
      onClick={() => {
        voz.decir(texto);
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
        <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
