// Lo que se enseña de algo nuevo antes de preguntarlo.

import { useEffect, type ReactElement } from 'react';
import type { Voz } from '../../estado/voz';
import type { CeldaDeTabla, Presentacion as DatosPresentacion } from '../../motor';
import { Boton } from '../componentes/Boton';
import { BotonVoz } from '../componentes/BotonVoz';
import { ConNeerlandes } from '../componentes/ConNeerlandes';

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
      <p className="instruccion">
        <ConNeerlandes texto={presentacion.etiqueta ?? 'Nuevo'} />
      </p>
      <div className="tarjeta columna">
        <div className="fila fila--entre">
          <p className="presentacion__principal" lang="nl">
            {presentacion.principal}
          </p>
          <BotonVoz voz={voz} texto={presentacion.audio} />
        </div>
        {presentacion.significado ? (
          <p className="texto-2">
            <ConNeerlandes texto={presentacion.significado} />
          </p>
        ) : null}
        {presentacion.tabla ? (
          <table className="tabla">
            <tbody>
              {presentacion.tabla.map(([a, b]) => (
                <tr key={`${textoDe(a)}-${textoDe(b)}`}>
                  <Celda celda={a} />
                  <Celda celda={b} />
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {presentacion.ejemplos?.map((e) => (
          <div key={e.texto} className="ejemplo">
            <p lang="nl">{e.texto}</p>
            <p className="texto-2">
              <ConNeerlandes texto={e.significado} />
            </p>
          </div>
        ))}
        {presentacion.detalle ? (
          <p className="aclaracion">
            <ConNeerlandes texto={presentacion.detalle} />
          </p>
        ) : null}
        {presentacion.nota ? (
          <p className="texto-2 pequeno">
            <ConNeerlandes texto={presentacion.nota} />
          </p>
        ) : null}
      </div>
      <Boton ancho autoFocus onClick={onSeguir}>
        Entendido
      </Boton>
    </div>
  );
}

function textoDe(celda: CeldaDeTabla): string {
  return typeof celda === 'string' ? celda : celda.etiqueta;
}

/** El texto de la tabla va en neerlandés; las etiquetas, en español. */
function Celda({ celda }: { readonly celda: CeldaDeTabla }): ReactElement {
  return typeof celda === 'string' ? <td lang="nl">{celda}</td> : <td>{celda.etiqueta}</td>;
}
