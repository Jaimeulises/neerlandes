// Ordenar las fichas de una frase: se toca cada ficha en el orden en que va y
// se devuelve tocándola otra vez. Si el orden no es bueno, se marca qué está
// fuera de sitio.

import { useState, type ReactElement } from 'react';
import type { Voz } from '../../estado/voz';
import { corregir, type Calificacion, type Correccion, type EjercicioOrdenar } from '../../motor';
import { Boton } from '../componentes/Boton';
import { Marcas } from '../componentes/Marcas';
import { Resultado } from '../componentes/Resultado';

interface Props {
  readonly ejercicio: EjercicioOrdenar;
  readonly repeticion: boolean;
  readonly voz: Voz;
  readonly onTerminar: (calificacion: Calificacion) => void;
}

export function Ordenar({ ejercicio, repeticion, voz, onTerminar }: Props): ReactElement {
  const [puestas, setPuestas] = useState<number[]>([]);
  const [correccion, setCorreccion] = useState<Correccion | null>(null);
  const porId = new Map(ejercicio.fichas.map((f) => [f.id, f.texto]));
  const sueltas = ejercicio.fichas.filter((f) => !puestas.includes(f.id));
  const completa = puestas.length === ejercicio.fichas.length;
  const bien = correccion?.veredicto === 'exacta' || correccion?.veredicto === 'tildes';

  const comprobar = (): void => {
    const c = corregir(puestas.map((id) => porId.get(id) ?? '').join(' '), ejercicio.validas);
    setCorreccion(c);
    voz.decir(ejercicio.frase);
  };

  return (
    <div className="columna">
      <p className="instruccion">
        {repeticion ? 'Otra vez: ' : ''}
        {ejercicio.instruccion}
      </p>
      <p className="enunciado">{ejercicio.significado}</p>

      <div className="fichas fichas--respuesta" aria-label="Tu frase" lang="nl">
        {puestas.length === 0 ? <span className="texto-3">Toca las palabras en orden</span> : null}
        {puestas.map((id) => (
          <button
            key={id}
            type="button"
            className="ficha ficha--puesta"
            disabled={correccion !== null}
            onClick={() => {
              setPuestas((p) => p.filter((x) => x !== id));
            }}
          >
            {porId.get(id)}
          </button>
        ))}
      </div>

      <div className="fichas" aria-label="Fichas sueltas" lang="nl">
        {sueltas.map((f) => (
          <button
            key={f.id}
            type="button"
            className="ficha"
            disabled={correccion !== null}
            onClick={() => {
              setPuestas((p) => [...p, f.id]);
            }}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {correccion === null ? (
        <Boton ancho onClick={comprobar} disabled={!completa}>
          Comprobar
        </Boton>
      ) : (
        <Resultado
          bien={bien}
          titulo={bien ? 'Bien' : 'No va en ese orden'}
          voz={voz}
          audio={ejercicio.frase}
          aclaracion={bien ? undefined : ejercicio.aclaracion}
          onSiguiente={() => {
            onTerminar(bien ? 'bien' : 'otra_vez');
          }}
        >
          {bien ? (
            <p className="marcas" lang="nl">
              {correccion.cercana}
            </p>
          ) : (
            <>
              <Marcas marcas={correccion.dada} etiqueta="Tu orden" />
              <Marcas marcas={correccion.esperada} etiqueta="Correcta" />
            </>
          )}
        </Resultado>
      )}
    </div>
  );
}
