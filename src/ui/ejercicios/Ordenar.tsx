// Ordenar las fichas de una frase: se toca cada ficha en el orden en que va y
// se devuelve tocándola otra vez. Si el orden no es bueno, se marca qué está
// fuera de sitio, y si el alumno sabe que el suyo también vale, lo da por bueno.
// Si la pista lo pide, el primer fallo deja las fichas donde están, da una pista
// y deja intentarlo otra vez (corregir pidiendo).

import { useState, type ReactElement } from 'react';
import type { Voz } from '../../estado/voz';
import { corregir, type Calificacion, type Correccion, type Diagnostico, type EjercicioOrdenar, type Veredicto } from '../../motor';
import { Boton } from '../componentes/Boton';
import { ConNeerlandes } from '../componentes/ConNeerlandes';
import { Marcas } from '../componentes/Marcas';
import { Reintento, VerSolucion } from '../componentes/Reintento';
import { Resultado } from '../componentes/Resultado';

interface Props {
  readonly ejercicio: EjercicioOrdenar;
  readonly repeticion: boolean;
  readonly voz: Voz;
  /** Qué regla falla en una respuesta. Vacío si no hay nada concreto. */
  readonly diagnosticar?: (respuesta: string) => readonly Diagnostico[];
  /** Las pistas para intentarlo otra vez tras el primer fallo. Vacío si no se reintenta. */
  readonly pistasDeReintento?: (diagnosticos: readonly Diagnostico[], veredicto: Veredicto) => readonly string[];
  /** aLaSegunda: salió bien después de la pista (cuenta como fallo para el repaso). */
  readonly onTerminar: (calificacion: Calificacion, diagnosticos?: readonly Diagnostico[], aLaSegunda?: boolean) => void;
}

/** El primer orden fallido, mientras se intenta otra vez con la pista. */
interface PrimerIntento {
  readonly puestas: readonly number[];
  readonly correccion: Correccion;
  readonly diagnosticos: readonly Diagnostico[];
  readonly pistas: readonly string[];
}

const esBuena = (c: Correccion): boolean => c.veredicto === 'exacta' || c.veredicto === 'tildes';

export function Ordenar({ ejercicio, repeticion, voz, diagnosticar, pistasDeReintento, onTerminar }: Props): ReactElement {
  const [puestas, setPuestas] = useState<number[]>([]);
  const [correccion, setCorreccion] = useState<Correccion | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<readonly Diagnostico[]>([]);
  const [primero, setPrimero] = useState<PrimerIntento | null>(null);
  const porId = new Map(ejercicio.fichas.map((f) => [f.id, f.texto]));
  const sueltas = ejercicio.fichas.filter((f) => !puestas.includes(f.id));
  const completa = puestas.length === ejercicio.fichas.length;
  const bien = correccion !== null && esBuena(correccion);
  const aLaSegunda = bien && primero !== null;
  // Mientras se reintenta, Comprobar espera a que cambie el orden: un doble toque no gasta el segundo intento.
  const igualQueElPrimero = primero !== null && correccion === null && puestas.join() === primero.puestas.join();

  const comprobar = (): void => {
    if (igualQueElPrimero) return;
    const respuesta = puestas.map((id) => porId.get(id) ?? '').join(' ');
    const c = corregir(respuesta, ejercicio.validas);
    const ds = esBuena(c) ? [] : (diagnosticar?.(respuesta) ?? []);
    if (!esBuena(c) && primero === null) {
      const pistas = pistasDeReintento?.(ds, c.veredicto) ?? [];
      if (pistas.length > 0) {
        // Las fichas se quedan donde están, sin voz ni solución: se oiría la respuesta.
        setPrimero({ puestas: [...puestas], correccion: c, diagnosticos: ds, pistas });
        return;
      }
    }
    setCorreccion(c);
    setDiagnosticos(ds);
    voz.decir(ejercicio.frase);
  };

  /** Rendirse en el segundo intento: la corrección del primero, como si no hubiera habido pista. */
  const verSolucion = (): void => {
    if (!primero) return;
    setPuestas([...primero.puestas]);
    setCorreccion(primero.correccion);
    setDiagnosticos(primero.diagnosticos);
    setPrimero(null);
    voz.decir(ejercicio.frase);
  };

  /** Lo que se ha fallado en los dos intentos, una vez cada regla: todo eso se practica. */
  const falladas = (): readonly Diagnostico[] => {
    const todos = [...(primero?.diagnosticos ?? []), ...diagnosticos];
    return todos.filter((d, i) => todos.findIndex((x) => x.destreza === d.destreza) === i);
  };

  return (
    <div className="columna">
      <p className="instruccion">
        {repeticion ? 'Otra vez: ' : ''}
        <ConNeerlandes texto={ejercicio.instruccion} />
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

      {correccion === null && primero ? <Reintento pistas={primero.pistas} /> : null}

      {correccion === null ? (
        <>
          <Boton ancho onClick={comprobar} disabled={!completa || igualQueElPrimero}>
            Comprobar
          </Boton>
          {primero ? <VerSolucion onVer={verSolucion} /> : null}
        </>
      ) : (
        <Resultado
          bien={bien}
          titulo={aLaSegunda ? 'Bien a la segunda' : bien ? 'Bien' : 'No va en ese orden'}
          voz={voz}
          audio={ejercicio.frase}
          aclaracion={bien && !aLaSegunda ? undefined : ejercicio.aclaracion}
          // A la segunda se explica lo que falló en el primer intento: para eso era la pista.
          diagnosticos={aLaSegunda ? primero.diagnosticos : diagnosticos}
          onSiguiente={() => {
            if (aLaSegunda) onTerminar('otra_vez', primero.diagnosticos, true);
            else onTerminar(bien ? 'bien' : 'otra_vez', falladas());
          }}
          extra={
            // Ninguna lista de órdenes buenos está completa: como al escribir, el alumno puede dar el suyo por bueno.
            bien ? null : (
              <Boton
                variante="texto"
                onClick={() => {
                  // Tras la pista, dar por bueno el segundo orden es acertar a la segunda, como si estuviera apuntado.
                  if (primero) onTerminar('otra_vez', primero.diagnosticos, true);
                  else onTerminar('bien');
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
              <Marcas marcas={correccion.dada} etiqueta="Tu orden" />
              <Marcas marcas={correccion.esperada} etiqueta="Correcta" />
            </>
          )}
        </Resultado>
      )}
    </div>
  );
}
