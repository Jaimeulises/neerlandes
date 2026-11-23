// Decir la frase en voz alta antes de verla: es lo más parecido a hablar. Una
// cuenta atrás da el tiempo de una conversación (más si la frase es larga): al
// acabar se ve la buena y suena, para compararla. Se puede ver antes. Después
// uno mismo dice si le ha salido.

import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { Voz } from '../../estado/voz';
import { palabras, type Calificacion, type Diagnostico, type EjercicioDecir } from '../../motor';
import { Boton } from '../componentes/Boton';
import { BotonVoz } from '../componentes/BotonVoz';

interface Props {
  readonly ejercicio: EjercicioDecir;
  readonly repeticion: boolean;
  readonly voz: Voz;
  /** Qué regla falla en una respuesta. Vacío si no hay nada concreto. */
  readonly diagnosticar?: (respuesta: string) => readonly Diagnostico[];
  readonly onTerminar: (calificacion: Calificacion, diagnosticos?: readonly Diagnostico[]) => void;
}

/** Los segundos para decir una frase: 3 de arranque y algo más de medio por palabra, entre 5 y 8. */
export function segundosParaDecir(texto: string): number {
  return Math.min(8, Math.max(5, Math.round(3 + 0.6 * palabras(texto).length)));
}

export function Decir({ ejercicio, repeticion, voz, onTerminar }: Props): ReactElement {
  const [vista, setVista] = useState(false);
  const total = segundosParaDecir(ejercicio.texto);
  const [quedan, setQuedan] = useState(total);
  const restantes = useRef(total);
  // La barra va un segundo por delante del número, con una transición de un segundo: así baja seguida y se vacía
  // justo al acabar. Empieza llena y arranca un instante después de salir, para que se vea bajar desde el principio.
  const [arrancada, setArrancada] = useState(false);
  const { decir } = voz;

  useEffect(() => {
    const arranque = setTimeout(() => {
      setArrancada(true);
    }, 30);
    return () => {
      clearTimeout(arranque);
    };
  }, []);

  const ver = (): void => {
    setVista(true);
    decir(ejercicio.texto);
  };

  useEffect(() => {
    if (vista) return;
    const reloj = setInterval(() => {
      // Con la app en segundo plano la cuenta se para: se sigue al volver.
      if (document.visibilityState === 'hidden') return;
      restantes.current -= 1;
      setQuedan(restantes.current);
      if (restantes.current <= 0) {
        clearInterval(reloj);
        setVista(true);
        decir(ejercicio.texto);
      }
    }, 1000);
    return () => {
      clearInterval(reloj);
    };
  }, [vista, decir, ejercicio.texto]);

  return (
    <div className="columna">
      <p className="instruccion">
        {repeticion ? 'Otra vez: ' : ''}
        {ejercicio.instruccion}
      </p>
      <p className="enunciado">{ejercicio.significado}</p>
      {ejercicio.pista ? <p className="pista">{ejercicio.pista}</p> : null}
      {!vista ? (
        <>
          {/* role="timer" no se anuncia cada segundo: el lector lo lee cuando se llega a él. */}
          <div className="cuenta-atras" role="timer" aria-label={`Quedan ${String(quedan)} segundos`}>
            <div className="cuenta-atras__barra">
              <div style={{ width: `${String(arrancada ? Math.round((Math.max(0, quedan - 1) / total) * 100) : 100)}%` }} />
            </div>
            <span className="cuenta-atras__numero" aria-hidden="true">
              {quedan}
            </span>
          </div>
          <Boton ancho onClick={ver}>
            Ya la he dicho: ver la frase
          </Boton>
        </>
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
