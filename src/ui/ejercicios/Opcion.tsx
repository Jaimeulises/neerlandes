// Elegir una opción. Se marca la buena y, si se falló, la elegida.

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import type { Voz } from '../../estado/voz';
import type { Calificacion, Diagnostico, EjercicioOpcion } from '../../motor';
import { ConNeerlandes } from '../componentes/ConNeerlandes';
import { Resultado } from '../componentes/Resultado';

interface Props {
  readonly ejercicio: EjercicioOpcion;
  readonly repeticion: boolean;
  readonly voz: Voz;
  /** Qué regla falla en una respuesta. Vacío si no hay nada concreto. */
  readonly diagnosticar?: (respuesta: string) => readonly Diagnostico[];
  readonly onTerminar: (calificacion: Calificacion, diagnosticos?: readonly Diagnostico[]) => void;
}

export function Opcion({ ejercicio, repeticion, voz, diagnosticar, onTerminar }: Props): ReactElement {
  const [elegida, setElegida] = useState<string | null>(null);
  const acierto = elegida === ejercicio.respuestaCorrecta;
  const diagnosticos = useMemo(() => (elegida !== null && !acierto ? (diagnosticar?.(elegida) ?? []) : []), [elegida, acierto, diagnosticar]);
  const { decir } = voz;

  useEffect(() => {
    if (ejercicio.enunciadoEnIdioma && !ejercicio.enunciado.includes('___')) decir(ejercicio.enunciado);
  }, [ejercicio, decir]);

  return (
    <div className="columna">
      <p className="instruccion">
        {repeticion ? 'Otra vez: ' : ''}
        <ConNeerlandes texto={ejercicio.instruccion} />
      </p>
      <p className={ejercicio.enunciadoEnIdioma ? 'enunciado enunciado--nl' : 'enunciado'} lang={ejercicio.enunciadoEnIdioma ? 'nl' : 'es'}>
        {ejercicio.enunciado}
      </p>
      {ejercicio.significado ? <p className="texto-2">{ejercicio.significado}</p> : null}
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
          titulo={acierto ? 'Bien' : ejercicio.opcionesEnIdioma ? `Era «${ejercicio.respuestaCorrecta}»` : `Era “${ejercicio.respuestaCorrecta}”`}
          voz={voz}
          audio={ejercicio.audio}
          aclaracion={ejercicio.aclaracion}
          diagnosticos={diagnosticos}
          onSiguiente={() => {
            onTerminar(acierto ? 'bien' : 'otra_vez', diagnosticos);
          }}
        />
      ) : null}
    </div>
  );
}
