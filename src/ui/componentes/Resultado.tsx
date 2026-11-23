import type { ReactElement, ReactNode } from 'react';
import type { Voz } from '../../estado/voz';
import type { Diagnostico } from '../../motor';
import { Boton } from './Boton';
import { BotonVoz } from './BotonVoz';
import { Diagnosticos } from './Diagnosticos';

interface Props {
  readonly bien: boolean;
  readonly titulo: string;
  readonly voz: Voz;
  readonly audio: string | undefined;
  readonly aclaracion: string | undefined;
  /** Lo que ha fallado, regla a regla. Si hay, la regla general queda plegada debajo. */
  readonly diagnosticos?: readonly Diagnostico[];
  readonly children?: ReactNode;
  /** Botones antes de «Siguiente», por ejemplo «Mi respuesta también vale». */
  readonly extra?: ReactNode;
  readonly onSiguiente: () => void;
}

export function Resultado({ bien, titulo, voz, audio, aclaracion, diagnosticos = [], children, extra, onSiguiente }: Props): ReactElement {
  const hayDiagnostico = !bien && diagnosticos.length > 0;
  return (
    <div className={`resultado ${bien ? 'resultado--bien' : 'resultado--mal'}`} aria-live="polite">
      <div className="fila fila--entre">
        <p className="resultado__titulo">{titulo}</p>
        <BotonVoz voz={voz} texto={audio} />
      </div>
      {children}
      {hayDiagnostico ? <Diagnosticos diagnosticos={diagnosticos} /> : null}
      {aclaracion && hayDiagnostico ? (
        <details className="regla-completa">
          <summary>La regla completa</summary>
          <p className="aclaracion">{aclaracion}</p>
        </details>
      ) : aclaracion ? (
        <p className="aclaracion">{aclaracion}</p>
      ) : null}
      {extra}
      <Boton ancho autoFocus onClick={onSiguiente}>
        Siguiente
      </Boton>
    </div>
  );
}
