// Decir la frase en voz alta antes de verla: es lo más parecido a hablar.
// Después se escucha la buena y uno mismo dice si le ha salido.

import { useState, type ReactElement } from 'react';
import type { Voz } from '../../estado/voz';
import type { Calificacion, EjercicioDecir } from '../../motor';
import { Boton } from '../componentes/Boton';
import { BotonVoz } from '../componentes/BotonVoz';

interface Props {
  readonly ejercicio: EjercicioDecir;
  readonly repeticion: boolean;
  readonly voz: Voz;
  readonly onTerminar: (calificacion: Calificacion) => void;
}

export function Decir({ ejercicio, repeticion, voz, onTerminar }: Props): ReactElement {
  const [vista, setVista] = useState(false);
  return (
    <div className="columna">
      <p className="instruccion">
        {repeticion ? 'Otra vez: ' : ''}
        {ejercicio.instruccion}
      </p>
      <p className="enunciado">{ejercicio.significado}</p>
      {ejercicio.pista ? <p className="pista">{ejercicio.pista}</p> : null}
      {!vista ? (
        <Boton
          ancho
          onClick={() => {
            setVista(true);
            voz.decir(ejercicio.texto);
          }}
        >
          Ya la he dicho: ver la frase
        </Boton>
      ) : (
        <div className="resultado resultado--bien" aria-live="polite">
          <div className="fila fila--entre">
            <p className="enunciado enunciado--nl" lang="nl">
              {ejercicio.texto}
            </p>
            <BotonVoz voz={voz} texto={ejercicio.texto} />
          </div>
          {ejercicio.aclaracion ? <p className="aclaracion">{ejercicio.aclaracion}</p> : null}
          <p className="texto-2">¿Te ha salido igual, con el verbo en su sitio?</p>
          <div className="fila">
            <Boton
              variante="secundario"
              className="boton--ancho"
              onClick={() => {
                onTerminar('otra_vez');
              }}
            >
              Me he equivocado
            </Boton>
            <Boton
              className="boton--ancho"
              onClick={() => {
                onTerminar('bien');
              }}
            >
              Me ha salido
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
