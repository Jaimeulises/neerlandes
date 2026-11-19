// Elegir una opción. Se marca la buena y, si se falló, la elegida.

import { useEffect, useState, type ReactElement } from 'react';
import type { Voz } from '../../estado/voz';
import type { Calificacion, EjercicioOpcion } from '../../motor';
import { Resultado } from '../componentes/Resultado';

interface Props {
  readonly ejercicio: EjercicioOpcion;
  readonly repeticion: boolean;
  readonly voz: Voz;
  readonly onTerminar: (calificacion: Calificacion) => void;
}

export function Opcion({ ejercicio, repeticion, voz, onTerminar }: Props): ReactElement {
  const [elegida, setElegida] = useState<string | null>(null);
  const acierto = elegida === ejercicio.respuestaCorrecta;
  const { decir } = voz;

  useEffect(() => {
    if (ejercicio.enunciadoEnIdioma && !ejercicio.enunciado.includes('___')) decir(ejercicio.enunciado);
  }, [ejercicio, decir]);

  return (
    <div className="columna">
      <p className="instruccion">
        {repeticion ? 'Otra vez: ' : ''}
        {ejercicio.instruccion}
      </p>
      <p className={ejercicio.enunciadoEnIdioma ? 'enunciado enunciado--nl' : 'enunciado'} lang={ejercicio.enunciadoEnIdioma ? 'nl' : 'es'}>
        {ejercicio.enunciado}
      </p>
      <div className="opciones" role="group" aria-label="Opciones">
        {ejercicio.opciones.map((o) => {
          const clase =
            elegida === null ? 'opcion' : o === ejercicio.respuestaCorrecta ? 'opcion opcion--buena' : o === elegida ? 'opcion opcion--mala' : 'opcion';
          return (
            <button
              key={o}
              type="button"
              className={clase}
              lang={ejercicio.opcionesEnIdioma ? 'nl' : 'es'}
              disabled={elegida !== null}
              onClick={() => {
                setElegida(o);
                if (o === ejercicio.respuestaCorrecta && ejercicio.audio) decir(ejercicio.audio);
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
      {elegida !== null ? (
        <Resultado
          bien={acierto}
          titulo={acierto ? 'Bien' : `Era «${ejercicio.respuestaCorrecta}»`}
          voz={voz}
          audio={ejercicio.audio}
          aclaracion={ejercicio.aclaracion}
          onSiguiente={() => {
            onTerminar(acierto ? 'bien' : 'otra_vez');
          }}
        />
      ) : null}
    </div>
  );
}
