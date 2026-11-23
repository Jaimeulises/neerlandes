// Decir la frase en voz alta antes de verla: es lo más parecido a hablar. Una
// cuenta atrás da el tiempo de leer el español y decir la frase a ritmo de
// conversación: algo menos si la regla ya se domina y más si está floja, y el
// alumno puede pedir calma o quitarla. Al acabar se ve la buena y, un momento
// después, suena. Se puede ver antes. Después uno mismo dice si el verbo iba en
// su sitio y bien conjugado; si no, la dice otra vez con la buena antes de
// seguir, que es corregir pidiendo, pero de palabra.

import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { TiempoDecir } from '../../estado/ajustes';
import type { Voz } from '../../estado/voz';
import { palabras, UMBRAL_DOMINADA, UMBRAL_FLOJA, type Calificacion, type Diagnostico, type EjercicioDecir } from '../../motor';
import { Boton } from '../componentes/Boton';
import { BotonVoz } from '../componentes/BotonVoz';
import { ConNeerlandes } from '../componentes/ConNeerlandes';

interface Props {
  readonly ejercicio: EjercicioDecir;
  readonly repeticion: boolean;
  readonly voz: Voz;
  /** Cuánto tiempo da la cuenta atrás (lo elige el alumno en Ajustes). */
  readonly tiempo?: TiempoDecir;
  /** Qué regla falla en una respuesta. Vacío si no hay nada concreto. */
  readonly diagnosticar?: (respuesta: string) => readonly Diagnostico[];
  readonly onTerminar: (calificacion: Calificacion, diagnosticos?: readonly Diagnostico[]) => void;
}

/** Para situarse antes de empezar a hablar. */
const ARRANQUE = 2;
/** Lo que se tarda en leer cada palabra del español y de la pista. */
const POR_PALABRA_LEIDA = 0.25;
/** Lo que se tarda en decir cada palabra en neerlandés, a ritmo de conversación y con algo de margen para pensarla. */
const POR_PALABRA_DICHA = 0.7;
const MINIMO = 6;
const MAXIMO = 12;
/** Con la regla dominada la cuenta aprieta más; con la regla floja, menos. */
const CON_REGLA_DOMINADA = 0.8;
const CON_REGLA_FLOJA = 1.3;
const CON_CALMA = 1.5;
/** Cuántas de las otras formas buenas se enseñan con la frase; de las demás se dice cuántas son. */
const OTRAS_A_LA_VISTA = 3;

/** Cada cuánto avanza la cuenta: lo bastante fino para la pausa antes de que suene. */
const PASO = 100;
/** Al acabarse el tiempo, la frase sale enseguida y suena un poco después, para no pisar a quien aún la está diciendo. */
export const PAUSA_ANTES_DE_SONAR = 700;

/**
 * Los segundos para decir una frase, o null sin cuenta atrás: 2 para situarse, un cuarto de segundo por palabra
 * leída y 0,7 por palabra dicha, entre 6 y 12, y eso por lo que pida el nivel de la regla y el ajuste de calma.
 */
export function segundosParaDecir(ejercicio: Pick<EjercicioDecir, 'texto' | 'significado' | 'pista' | 'dominio'>, tiempo: TiempoDecir = 'normal'): number | null {
  if (tiempo === 'sin') return null;
  const leidas = palabras(ejercicio.significado).length + palabras(ejercicio.pista ?? '').length;
  const base = Math.min(MAXIMO, Math.max(MINIMO, ARRANQUE + POR_PALABRA_LEIDA * leidas + POR_PALABRA_DICHA * palabras(ejercicio.texto).length));
  const d = ejercicio.dominio;
  const nivel = d === undefined ? 1 : d >= UMBRAL_DOMINADA ? CON_REGLA_DOMINADA : d < UMBRAL_FLOJA ? CON_REGLA_FLOJA : 1;
  return Math.round(base * nivel * (tiempo === 'calma' ? CON_CALMA : 1));
}

/** cuenta: la frase aún no se ve. pausa: se acabó el tiempo y se ve, pero aún no suena. vista: ya ha sonado o se pidió verla. */
type Fase = 'cuenta' | 'pausa' | 'vista';

function OtrasFormas({ otras }: { readonly otras: readonly string[] }): ReactElement {
  const vistas = otras.slice(0, OTRAS_A_LA_VISTA);
  const mas = otras.length - vistas.length;
  return (
    <div className="otras-formas">
      <p className="texto-3">También vale</p>
      <ul>
        {vistas.map((o) => (
          <li key={o} lang="nl">
            {o}
          </li>
        ))}
      </ul>
      {mas > 0 ? <p className="texto-3">Y {mas === 1 ? 'otra forma más' : `${String(mas)} formas más`}.</p> : null}
    </div>
  );
}

export function Decir({ ejercicio, repeticion, voz, tiempo = 'normal', onTerminar }: Props): ReactElement {
  const total = segundosParaDecir(ejercicio, tiempo);
  const [fase, setFase] = useState<Fase>('cuenta');
  const [quedan, setQuedan] = useState(total ?? 0);
  const [equivocado, setEquivocado] = useState(false);
  const transcurrido = useRef(0);
  // La barra va un segundo por delante del número, con una transición de un segundo: así baja seguida y se vacía
  // justo al acabar. Empieza llena y arranca un instante después de salir, para que se vea bajar desde el principio.
  const [arrancada, setArrancada] = useState(false);
  const { decir } = voz;
  const contando = fase !== 'vista';

  useEffect(() => {
    const arranque = setTimeout(() => {
      setArrancada(true);
    }, 30);
    return () => {
      clearTimeout(arranque);
    };
  }, []);

  const ver = (): void => {
    setFase('vista');
    decir(ejercicio.texto);
  };

  useEffect(() => {
    if (!contando || total === null) return;
    const fin = total * 1000;
    const reloj = setInterval(() => {
      // Con la app en segundo plano la cuenta se para: se sigue al volver.
      if (document.visibilityState === 'hidden') return;
      transcurrido.current += PASO;
      const t = transcurrido.current;
      setQuedan(Math.max(0, total - Math.floor(t / 1000)));
      if (t >= fin + PAUSA_ANTES_DE_SONAR) {
        clearInterval(reloj);
        setFase('vista');
        decir(ejercicio.texto);
      } else if (t >= fin) {
        setFase('pausa');
      }
    }, PASO);
    return () => {
      clearInterval(reloj);
    };
  }, [contando, total, decir, ejercicio.texto]);

  const otras = ejercicio.otras ?? [];

  return (
    <div className="columna">
      <p className="instruccion">
        {repeticion ? 'Otra vez: ' : ''}
        <ConNeerlandes texto={ejercicio.instruccion} />
      </p>
      <p className="enunciado">{ejercicio.significado}</p>
      {ejercicio.pista ? (
        <p className="pista">
          <ConNeerlandes texto={ejercicio.pista} />
        </p>
      ) : null}
      {fase === 'cuenta' ? (
        <>
          {total === null ? null : (
            // role="timer" no se anuncia cada segundo: el lector lo lee cuando se llega a él.
            <div className="cuenta-atras" role="timer" aria-label={`Quedan ${String(quedan)} segundos`}>
              <div className="cuenta-atras__barra">
                <div style={{ width: `${String(arrancada ? Math.round((Math.max(0, quedan - 1) / total) * 100) : 100)}%` }} />
              </div>
              <span className="cuenta-atras__numero" aria-hidden="true">
                {quedan}
              </span>
            </div>
          )}
          <Boton ancho onClick={ver}>
            Ya la he dicho: ver la frase
          </Boton>
        </>
      ) : (
        // Neutro hasta que el alumno se valore: un panel verde ya diría que ha salido bien.
        <div className="resultado resultado--neutro" aria-live="polite">
          <div className="fila fila--entre">
            <p className="enunciado enunciado--nl" lang="nl">
              {ejercicio.texto}
            </p>
            <BotonVoz voz={voz} texto={ejercicio.texto} />
          </div>
          {otras.length > 0 ? <OtrasFormas otras={otras} /> : null}
          {ejercicio.aclaracion ? (
            <p className="aclaracion">
              <ConNeerlandes texto={ejercicio.aclaracion} />
            </p>
          ) : null}
          {equivocado ? (
            <>
              <p className="texto-2">Dila otra vez en voz alta, ahora con la buena.</p>
              <Boton
                ancho
                onClick={() => {
                  onTerminar('otra_vez');
                }}
              >
                Siguiente
              </Boton>
            </>
          ) : (
            <>
              <p className="texto-2">¿Has puesto el verbo en su sitio y bien conjugado? Si lo demás iba en otro orden que también vale, cuenta como bien.</p>
              <div className="fila">
                <Boton
                  variante="secundario"
                  className="boton--ancho"
                  onClick={() => {
                    setEquivocado(true);
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
