// Los ejercicios en los que se escribe: traducir la frase entera, completar el
// hueco y el dictado. Al corregir se separa el fallo de orden del de palabras,
// y si la respuesta es buena pero no estaba en la lista, el alumno puede darla
// por buena. Si la pista lo pide, el primer fallo no enseña la solución: da una
// pista y deja intentarlo otra vez (corregir pidiendo). La pista va encima del
// campo y sin volver a enfocarlo: en el móvil, el teclado tapa lo de debajo.

import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement, type SyntheticEvent } from 'react';
import type { Voz } from '../../estado/voz';
import { calificacionDe, corregir, normalizar, type Calificacion, type Correccion, type Diagnostico, type EjercicioEscrito, type Veredicto } from '../../motor';
import { Boton } from '../componentes/Boton';
import { BotonVoz } from '../componentes/BotonVoz';
import { Marcas } from '../componentes/Marcas';
import { Reintento, VerSolucion } from '../componentes/Reintento';
import { Resultado } from '../componentes/Resultado';

interface Props {
  readonly ejercicio: EjercicioEscrito;
  readonly repeticion: boolean;
  readonly voz: Voz;
  /** Qué regla falla en una respuesta. Vacío si no hay nada concreto. */
  readonly diagnosticar?: (respuesta: string) => readonly Diagnostico[];
  /** Las pistas para intentarlo otra vez tras el primer fallo. Vacío si no se reintenta. */
  readonly pistasDeReintento?: (diagnosticos: readonly Diagnostico[], veredicto: Veredicto) => readonly string[];
  /** aLaSegunda: salió bien después de la pista (cuenta como fallo para el repaso). */
  readonly onTerminar: (calificacion: Calificacion, diagnosticos?: readonly Diagnostico[], aLaSegunda?: boolean) => void;
}

/** El primer intento fallido, mientras se intenta otra vez con la pista. */
interface PrimerIntento {
  readonly respuesta: string;
  readonly correccion: Correccion;
  readonly diagnosticos: readonly Diagnostico[];
  readonly pistas: readonly string[];
}

const TITULOS: Readonly<Record<Veredicto, string>> = {
  exacta: 'Bien',
  tildes: 'Bien (ojo con las tildes)',
  orden: 'Las palabras están bien, falla el orden',
  distinta: 'No es así',
  vacia: 'Sin respuesta',
};

const ATRIBUTOS_CAMPO = {
  autoCapitalize: 'off',
  autoCorrect: 'off',
  autoComplete: 'off',
  spellCheck: false,
  lang: 'nl',
} as const;

export function Escrito({ ejercicio, repeticion, voz, diagnosticar, pistasDeReintento, onTerminar }: Props): ReactElement {
  const [respuesta, setRespuesta] = useState('');
  const [correccion, setCorreccion] = useState<Correccion | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<readonly Diagnostico[]>([]);
  const [primero, setPrimero] = useState<PrimerIntento | null>(null);
  const campo = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const { decir } = voz;
  const bien = correccion !== null && calificacionDe(correccion.veredicto) === 'bien';
  const aLaSegunda = bien && primero !== null;
  // Mientras se reintenta, Comprobar espera a que la respuesta cambie: un doble toque no gasta el segundo intento.
  const igualQueLaPrimera = primero !== null && correccion === null && normalizar(respuesta) === normalizar(primero.respuesta);

  useEffect(() => {
    campo.current?.focus();
    if (ejercicio.forma === 'dictado') decir(ejercicio.dictar);
  }, [ejercicio, decir]);

  const comprobar = (): void => {
    if (respuesta.trim() === '' || correccion !== null || igualQueLaPrimera) return;
    const c = corregir(respuesta, ejercicio.respuestas);
    // El dictado es para el oído: sus fallos son de lo que se oye, no de gramática.
    const ds = calificacionDe(c.veredicto) !== 'bien' && ejercicio.forma !== 'dictado' ? (diagnosticar?.(respuesta) ?? []) : [];
    if (calificacionDe(c.veredicto) !== 'bien' && primero === null) {
      const pistas = pistasDeReintento?.(ds, c.veredicto) ?? [];
      if (pistas.length > 0) {
        // Sin voz ni solución: se oiría la respuesta.
        setPrimero({ respuesta, correccion: c, diagnosticos: ds, pistas });
        return;
      }
    }
    setCorreccion(c);
    setDiagnosticos(ds);
    if (ejercicio.audio) decir(ejercicio.audio);
  };

  /** Rendirse en el segundo intento: la corrección del primero, como si no hubiera habido pista. */
  const verSolucion = (): void => {
    if (!primero) return;
    setRespuesta(primero.respuesta);
    setCorreccion(primero.correccion);
    setDiagnosticos(primero.diagnosticos);
    setPrimero(null);
    if (ejercicio.audio) decir(ejercicio.audio);
  };

  /** Lo que se ha fallado en los dos intentos, una vez cada regla: todo eso se practica. */
  const falladas = (): readonly Diagnostico[] => {
    const todos = [...(primero?.diagnosticos ?? []), ...diagnosticos];
    return todos.filter((d, i) => todos.findIndex((x) => x.destreza === d.destreza) === i);
  };

  const alEnviar = (e: SyntheticEvent): void => {
    e.preventDefault();
    comprobar();
  };

  const alTeclear = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      comprobar();
    }
  };

  const resuelto = correccion !== null;

  return (
    <form className="columna" onSubmit={alEnviar}>
      <p className="instruccion">
        {repeticion ? 'Otra vez: ' : ''}
        {ejercicio.instruccion}
      </p>

      {ejercicio.forma === 'traducir' ? (
        <>
          <p className="enunciado">{ejercicio.significado}</p>
          {ejercicio.pista ? <p className="pista">{ejercicio.pista}</p> : null}
        </>
      ) : null}

      {ejercicio.forma === 'dictado' ? (
        <div className="fila">
          <BotonVoz voz={voz} texto={ejercicio.dictar} etiqueta="Escuchar otra vez" />
          <span className="texto-2">Escucha y escribe lo que oyes</span>
        </div>
      ) : null}

      {correccion === null && primero ? <Reintento pistas={primero.pistas} /> : null}

      {ejercicio.forma === 'completar' ? (
        <>
          <p className="frase-hueco" lang="nl">
            {ejercicio.antes}
            <input
              ref={campo}
              className="campo campo--hueco"
              value={respuesta}
              aria-label={`Hueco: ${ejercicio.pista}`}
              placeholder={ejercicio.pista}
              readOnly={resuelto}
              onChange={(e) => {
                setRespuesta(e.target.value);
              }}
              {...ATRIBUTOS_CAMPO}
            />
            {ejercicio.despues}
          </p>
          {ejercicio.significado ? <p className="texto-2">{ejercicio.significado}</p> : null}
        </>
      ) : (
        <textarea
          ref={campo}
          className="campo"
          rows={3}
          value={respuesta}
          aria-label="Tu respuesta"
          placeholder="Escribe en neerlandés"
          readOnly={resuelto}
          onChange={(e) => {
            setRespuesta(e.target.value);
          }}
          onKeyDown={alTeclear}
          {...ATRIBUTOS_CAMPO}
        />
      )}

      {correccion === null ? (
        <>
          <Boton ancho type="submit" disabled={respuesta.trim() === '' || igualQueLaPrimera}>
            Comprobar
          </Boton>
          {primero ? <VerSolucion onVer={verSolucion} /> : null}
        </>
      ) : (
        <Resultado
          bien={bien}
          titulo={aLaSegunda ? 'Bien a la segunda' : TITULOS[correccion.veredicto]}
          voz={voz}
          audio={ejercicio.audio}
          aclaracion={ejercicio.aclaracion}
          // A la segunda se explica lo que falló en el primer intento: para eso era la pista.
          diagnosticos={aLaSegunda ? primero.diagnosticos : diagnosticos}
          onSiguiente={() => {
            if (aLaSegunda) onTerminar('otra_vez', primero.diagnosticos, true);
            else onTerminar(bien ? 'bien' : 'otra_vez', falladas());
          }}
          extra={
            bien ? null : (
              <Boton
                variante="texto"
                onClick={() => {
                  onTerminar('bien');
                }}
              >
                Mi respuesta también vale
              </Boton>
            )
          }
        >
          {bien ? (
            <>
              <p className="marcas" lang="nl">
                {correccion.cercana}
              </p>
              {aLaSegunda ? <p className="texto-2">Volverá pronto, para que salga a la primera.</p> : null}
              {aLaSegunda && primero.diagnosticos.length > 0 ? <p className="texto-3">En el primer intento</p> : null}
            </>
          ) : (
            <>
              <p className="texto-3">Tu respuesta</p>
              <Marcas marcas={correccion.dada} etiqueta="Tu respuesta" />
              <p className="texto-3">Correcta</p>
              <Marcas marcas={correccion.esperada} etiqueta="Respuesta correcta" />
              {ejercicio.forma === 'dictado' ? <p className="texto-2">{ejercicio.significado}</p> : null}
            </>
          )}
        </Resultado>
      )}
    </form>
  );
}
