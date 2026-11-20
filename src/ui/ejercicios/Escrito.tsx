// Los ejercicios en los que se escribe: traducir la frase entera, completar el
// hueco y el dictado. Al corregir se separa el fallo de orden del de palabras,
// y si la respuesta es buena pero no estaba en la lista, el alumno puede darla
// por buena.

import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement, type SyntheticEvent } from 'react';
import type { Voz } from '../../estado/voz';
import { calificacionDe, corregir, type Calificacion, type Correccion, type Diagnostico, type EjercicioEscrito, type Veredicto } from '../../motor';
import { Boton } from '../componentes/Boton';
import { BotonVoz } from '../componentes/BotonVoz';
import { Marcas } from '../componentes/Marcas';
import { Resultado } from '../componentes/Resultado';

interface Props {
  readonly ejercicio: EjercicioEscrito;
  readonly repeticion: boolean;
  readonly voz: Voz;
  /** Qué regla falla en una respuesta. Vacío si no hay nada concreto. */
  readonly diagnosticar?: (respuesta: string) => readonly Diagnostico[];
  readonly onTerminar: (calificacion: Calificacion, diagnosticos?: readonly Diagnostico[]) => void;
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

export function Escrito({ ejercicio, repeticion, voz, diagnosticar, onTerminar }: Props): ReactElement {
  const [respuesta, setRespuesta] = useState('');
  const [correccion, setCorreccion] = useState<Correccion | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<readonly Diagnostico[]>([]);
  const campo = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const { decir } = voz;
  const bien = correccion !== null && calificacionDe(correccion.veredicto) === 'bien';

  useEffect(() => {
    campo.current?.focus();
    if (ejercicio.forma === 'dictado') decir(ejercicio.dictar);
  }, [ejercicio, decir]);

  const comprobar = (): void => {
    if (respuesta.trim() === '' || correccion !== null) return;
    const c = corregir(respuesta, ejercicio.respuestas);
    setCorreccion(c);
    // El dictado es para el oído: sus fallos son de lo que se oye, no de gramática.
    if (calificacionDe(c.veredicto) !== 'bien' && ejercicio.forma !== 'dictado') setDiagnosticos(diagnosticar?.(respuesta) ?? []);
    if (ejercicio.audio) decir(ejercicio.audio);
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
        <Boton ancho type="submit" disabled={respuesta.trim() === ''}>
          Comprobar
        </Boton>
      ) : (
        <Resultado
          bien={bien}
          titulo={TITULOS[correccion.veredicto]}
          voz={voz}
          audio={ejercicio.audio}
          aclaracion={ejercicio.aclaracion}
          diagnosticos={diagnosticos}
          onSiguiente={() => {
            onTerminar(bien ? 'bien' : 'otra_vez', diagnosticos);
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
            <p className="marcas" lang="nl">
              {correccion.cercana}
            </p>
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
