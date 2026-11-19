// Una ronda de ejercicios, de una pista o mezclando todas. Lo nuevo se
// presenta antes de preguntarlo y lo que se falla vuelve al final de la ronda,
// una vez, con otro ejercicio.

import { useState, type ReactElement } from 'react';
import type { Ajustes, Forma } from '../../estado/ajustes';
import { construirRondaDe, type PasoMixto } from '../../estado/ronda';
import type { Voz } from '../../estado/voz';
import { crearAzar, repetirTrasFallo, RONDA_POR_DEFECTO, semillaNueva, type Calificacion, type OpcionesRonda, type Pista, type Progreso } from '../../motor';
import { Boton } from '../componentes/Boton';
import { Decir } from '../ejercicios/Decir';
import { Escrito } from '../ejercicios/Escrito';
import { Opcion } from '../ejercicios/Opcion';
import { Ordenar } from '../ejercicios/Ordenar';
import { Presentacion } from '../ejercicios/Presentacion';

interface Props {
  readonly pistas: readonly Pista[];
  readonly progreso: Progreso;
  readonly ajustes: Ajustes;
  readonly formas: ReadonlySet<Forma>;
  readonly voz: Voz;
  readonly onRespuesta: (pistaId: string, elementoId: string, calificacion: Calificacion, forma: Forma) => void;
  readonly onSalir: () => void;
}

interface Estado {
  readonly pasos: readonly PasoMixto[];
  readonly indice: number;
  readonly presentado: boolean;
  readonly aciertos: number;
  readonly fallos: number;
  readonly repetidos: ReadonlyMap<string, number>;
  /** Si es una ronda de práctica extra (repasar aunque no toque). */
  readonly extra: boolean;
}

function opcionesDe(ajustes: Ajustes, formas: ReadonlySet<Forma>, extra: boolean): OpcionesRonda {
  return {
    ...RONDA_POR_DEFECTO,
    tamano: ajustes.tamanoRonda,
    nuevosMaximo: extra ? 0 : ajustes.nuevosPorRonda,
    formas,
    ...(extra ? { incluirNoVencidos: true } : {}),
  };
}

function empezar(pistas: readonly Pista[], progreso: Progreso, ajustes: Ajustes, formas: ReadonlySet<Forma>, extra: boolean): Estado {
  const pasos = construirRondaDe(pistas, progreso, new Date(), crearAzar(semillaNueva()), opcionesDe(ajustes, formas, extra));
  return { pasos, indice: 0, presentado: false, aciertos: 0, fallos: 0, repetidos: new Map(), extra };
}

export function Ronda({ pistas, progreso, ajustes, formas, voz, onRespuesta, onSalir }: Props): ReactElement {
  const [estado, setEstado] = useState<Estado>(() => empezar(pistas, progreso, ajustes, formas, false));
  const [azar] = useState(() => crearAzar(semillaNueva()));
  const paso = estado.pasos[estado.indice];
  const total = estado.pasos.length;
  const pista = paso ? pistas.find((p) => p.id === paso.pistaId) : undefined;

  const terminar = (calificacion: Calificacion): void => {
    if (!paso || !pista) return;
    const { ejercicio } = paso.paso;
    onRespuesta(pista.id, ejercicio.elementoId, calificacion, ejercicio.forma);
    setEstado((e) => {
      let pasos = e.pasos;
      let repetidos = e.repetidos;
      if (calificacion === 'otra_vez') {
        const clave = `${pista.id}/${ejercicio.elementoId}`;
        const veces = e.repetidos.get(clave) ?? 0;
        const elemento = pista.elementos.find((x) => x.id === ejercicio.elementoId);
        const vuelta = elemento ? repetirTrasFallo(pista, elemento, progreso, azar, veces, opcionesDe(ajustes, formas, e.extra)) : null;
        if (vuelta) {
          pasos = [...pasos, { pistaId: pista.id, paso: vuelta }];
          repetidos = new Map(repetidos).set(clave, veces + 1);
        }
      }
      return {
        ...e,
        pasos,
        repetidos,
        indice: e.indice + 1,
        presentado: false,
        aciertos: e.aciertos + (calificacion === 'otra_vez' ? 0 : 1),
        fallos: e.fallos + (calificacion === 'otra_vez' ? 1 : 0),
      };
    });
  };

  if (total === 0) {
    return (
      <div className="columna">
        <div className="tarjeta columna">
          <h2>Nada pendiente por ahora</h2>
          <p className="texto-2">Lo que has visto aún no toca repasarlo y no queda nada nuevo abierto aquí. Puedes practicar igualmente lo que ya has visto.</p>
          <Boton
            ancho
            onClick={() => {
              setEstado(empezar(pistas, progreso, ajustes, formas, true));
            }}
          >
            Practicar igualmente
          </Boton>
          <Boton ancho variante="secundario" onClick={onSalir}>
            Volver
          </Boton>
        </div>
      </div>
    );
  }

  if (!paso) {
    return (
      <div className="columna">
        <div className="tarjeta columna">
          <h2>Ronda terminada</h2>
          <p className="texto-2">
            {estado.aciertos} bien y {estado.fallos} {estado.fallos === 1 ? 'fallo' : 'fallos'}. Lo fallado volverá pronto.
          </p>
          <Boton
            ancho
            onClick={() => {
              setEstado(empezar(pistas, progreso, ajustes, formas, false));
            }}
          >
            Otra ronda
          </Boton>
          <Boton ancho variante="secundario" onClick={onSalir}>
            Volver
          </Boton>
        </div>
      </div>
    );
  }

  const { ejercicio, presentacion, repeticion } = paso.paso;
  const mostrarPresentacion = presentacion !== null && !estado.presentado;
  const props = { repeticion, voz, onTerminar: terminar };

  return (
    <div className="columna">
      <div className="fila">
        <Boton variante="texto" onClick={onSalir} aria-label="Salir de la ronda">
          Salir
        </Boton>
        <div className="progreso-ronda" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={estado.indice}>
          <div style={{ width: `${Math.round((estado.indice / total) * 100)}%` }} />
        </div>
        <span className="texto-3">
          {estado.indice + 1}/{total}
        </span>
      </div>

      {mostrarPresentacion ? (
        <Presentacion
          key={`p${estado.indice}`}
          presentacion={presentacion}
          voz={voz}
          onSeguir={() => {
            setEstado((e) => ({ ...e, presentado: true }));
          }}
        />
      ) : ejercicio.forma === 'opcion' ? (
        <Opcion key={estado.indice} ejercicio={ejercicio} {...props} />
      ) : ejercicio.forma === 'ordenar' ? (
        <Ordenar key={estado.indice} ejercicio={ejercicio} {...props} />
      ) : ejercicio.forma === 'decir' ? (
        <Decir key={estado.indice} ejercicio={ejercicio} {...props} />
      ) : (
        <Escrito key={estado.indice} ejercicio={ejercicio} {...props} />
      )}
    </div>
  );
}
