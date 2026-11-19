// Lo que se enseña de algo nuevo antes de preguntarlo.

import { useEffect, type ReactElement } from 'react';
import type { Voz } from '../../estado/voz';
import type { Presentacion as DatosPresentacion } from '../../motor';
import { Boton } from '../componentes/Boton';
import { BotonVoz } from '../componentes/BotonVoz';

interface Props {
  readonly presentacion: DatosPresentacion;
  readonly voz: Voz;
  readonly onSeguir: () => void;
}

export function Presentacion({ presentacion, voz, onSeguir }: Props): ReactElement {
  const { decir } = voz;
  useEffect(() => {
    if (presentacion.audio) decir(presentacion.audio);
  }, [presentacion, decir]);

  return (
    <div className="columna">
      <p className="instruccion">{presentacion.etiqueta ?? 'Nuevo'}</p>
      <div className="tarjeta columna">
        <div className="fila fila--entre">
          <p className="presentacion__principal" lang="nl">
            {presentacion.principal}
          </p>
          <BotonVoz voz={voz} texto={presentacion.audio} />
        </div>
        {presentacion.significado ? <p className="texto-2">{presentacion.significado}</p> : null}
        {presentacion.tabla ? (
          <table className="tabla">
            <tbody>
              {presentacion.tabla.map(([a, b]) => (
                <tr key={`${a}-${b}`}>
                  <td lang="nl">{a}</td>
                  <td lang="nl">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {presentacion.detalle ? <p className="aclaracion">{presentacion.detalle}</p> : null}
        {presentacion.nota ? <p className="texto-2 pequeno">{presentacion.nota}</p> : null}
      </div>
      <Boton ancho autoFocus onClick={onSeguir}>
        Entendido
      </Boton>
    </div>
  );
}
