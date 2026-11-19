import type { ReactElement, ReactNode } from 'react';
import type { Voz } from '../../estado/voz';
import { Boton } from './Boton';
import { BotonVoz } from './BotonVoz';

interface Props {
  readonly bien: boolean;
  readonly titulo: string;
  readonly voz: Voz;
  readonly audio: string | undefined;
  readonly aclaracion: string | undefined;
  readonly children?: ReactNode;
  /** Botones antes de «Siguiente», por ejemplo «Mi respuesta también vale». */
  readonly extra?: ReactNode;
  readonly onSiguiente: () => void;
}

export function Resultado({ bien, titulo, voz, audio, aclaracion, children, extra, onSiguiente }: Props): ReactElement {
  return (
    <div className={`resultado ${bien ? 'resultado--bien' : 'resultado--mal'}`} aria-live="polite">
      <div className="fila fila--entre">
        <p className="resultado__titulo">{titulo}</p>
        <BotonVoz voz={voz} texto={audio} />
      </div>
      {children}
      {aclaracion ? <p className="aclaracion">{aclaracion}</p> : null}
      {extra}
      <Boton ancho autoFocus onClick={onSiguiente}>
        Siguiente
      </Boton>
    </div>
  );
}
