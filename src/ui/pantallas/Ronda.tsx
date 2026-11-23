// Una ronda de ejercicios, de una pista o mezclando todas. Lo nuevo se
// presenta antes de preguntarlo y lo que se falla vuelve al final de la ronda,
// una vez, con otro ejercicio. Si el fallo tiene diagnóstico (una regla
// concreta), justo después sale otra frase que ya conoces con la misma regla,
// para arreglarlo en caliente. Lo que sale bien a la segunda, con pista, cuenta
// como fallo para el repaso y se cuenta aparte al terminar.

import { useState, type ReactElement } from 'react';
import type { Ajustes, Forma } from '../../estado/ajustes';
import { construirRondaDe, opcionesDeRonda, type PasoMixto } from '../../estado/ronda';
import type { Voz } from '../../estado/voz';
import {
  crearAzar,
  practicarDestreza,
  repetirTrasFallo,
  semillaNueva,
  type Calificacion,
  type Diagnostico,
  type Pista,
  type Progreso,
  type Veredicto,
} from '../../motor';
import { nombreDeDestreza } from '../../neerlandes/destrezas';
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
  /** Lo que domina el alumno cada destreza, para ajustar la dificultad. */
  readonly dominio?: (destreza: string) => number | null;
  readonly onRespuesta: (
    pistaId: string,
    elementoId: string,
    calificacion: Calificacion,
    forma: Forma,
    destrezas: readonly string[],
    falladas: readonly string[],
  ) => void;
  readonly onSalir: () => void;
}

interface Estado {
  readonly pasos: readonly PasoMixto[];
  readonly indice: number;
  readonly presentado: boolean;
  readonly aciertos: number;
  /** Bien a la segunda, con pista: para el repaso son fallos. */
  readonly segundas: number;
  readonly fallos: number;
  readonly repetidos: ReadonlyMap<string, number>;
  /** Destrezas que ya se han practicado en caliente en esta ronda: una vez cada una. */
  readonly practicadas: ReadonlySet<string>;
  /** Si es una ronda de práctica extra (repasar aunque no toque). */
  readonly extra: boolean;
}

type Dominio = Props['dominio'];

function empezar(pistas: readonly Pista[], progreso: Progreso, ajustes: Ajustes, formas: ReadonlySet<Forma>, extra: boolean, dominio: Dominio): Estado {
  const pasos = construirRondaDe(pistas, progreso, new Date(), crearAzar(semillaNueva()), opcionesDeRonda(ajustes, formas, extra, dominio));
  return { pasos, indice: 0, presentado: false, aciertos: 0, segundas: 0, fallos: 0, repetidos: new Map(), practicadas: new Set(), extra };
}

export function Ronda({ pistas, progreso, ajustes, formas, voz, dominio, onRespuesta, onSalir }: Props): ReactElement {
  const [estado, setEstado] = useState<Estado>(() => empezar(pistas, progreso, ajustes, formas, false, dominio));
  const [azar] = useState(() => crearAzar(semillaNueva()));
  const paso = estado.pasos[estado.indice];
  const total = estado.pasos.length;
  const pista = paso ? pistas.find((p) => p.id === paso.pistaId) : undefined;

  const terminar = (calificacion: Calificacion, diagnosticos: readonly Diagnostico[] = [], aLaSegunda = false): void => {
    if (!paso || !pista) return;
    const { ejercicio } = paso.paso;
    const falladas = calificacion === 'otra_vez' ? [...new Set(diagnosticos.map((d) => d.destreza))] : [];
    onRespuesta(pista.id, ejercicio.elementoId, calificacion, ejercicio.forma, ejercicio.destrezas ?? [], falladas);
    setEstado((e) => {
      let pasos = e.pasos;
      let repetidos = e.repetidos;
      let practicadas = e.practicadas;
      if (calificacion === 'otra_vez') {
        const opciones = opcionesDeRonda(ajustes, formas, e.extra, dominio);
        const clave = `${pista.id}/${ejercicio.elementoId}`;
        const veces = e.repetidos.get(clave) ?? 0;
        const elemento = pista.elementos.find((x) => x.id === ejercicio.elementoId);
        const vuelta = elemento ? repetirTrasFallo(pista, elemento, progreso, azar, veces, opciones) : null;
        if (vuelta) {
          pasos = [...pasos, { pistaId: pista.id, paso: vuelta }];
          repetidos = new Map(repetidos).set(clave, veces + 1);
        }
        // Practicar en caliente la regla fallada con otra frase que ya conoces, justo a continuación.
        const destreza = falladas.find((d) => !practicadas.has(d));
        if (destreza) {
          for (const p of [pista, ...pistas.filter((x) => x !== pista)]) {
            const enRonda = new Set(pasos.filter((x) => x.pistaId === p.id).map((x) => x.paso.ejercicio.elementoId));
            const practica = practicarDestreza(p, destreza, enRonda, progreso, azar, opciones);
            if (practica) {
              pasos = [...pasos.slice(0, e.indice + 1), { pistaId: p.id, paso: practica }, ...pasos.slice(e.indice + 1)];
              practicadas = new Set(practicadas).add(destreza);
              break;
            }
          }
        }
      }
      return {
        ...e,
        pasos,
        repetidos,
        practicadas,
        indice: e.indice + 1,
        presentado: false,
        aciertos: e.aciertos + (calificacion === 'otra_vez' ? 0 : 1),
        segundas: e.segundas + (aLaSegunda ? 1 : 0),
        fallos: e.fallos + (calificacion === 'otra_vez' && !aLaSegunda ? 1 : 0),
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
              setEstado(empezar(pistas, progreso, ajustes, formas, true, dominio));
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
            {estado.aciertos} bien{estado.segundas > 0 ? `, ${String(estado.segundas)} a la segunda` : ''} y {estado.fallos} {estado.fallos === 1 ? 'fallo' : 'fallos'}.{' '}
            {estado.fallos + estado.segundas > 0 ? 'Lo fallado volverá pronto.' : ''}
          </p>
          <Boton
            ancho
            onClick={() => {
              setEstado(empezar(pistas, progreso, ajustes, formas, false, dominio));
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

  const { ejercicio, presentacion, repeticion, practica } = paso.paso;
  const mostrarPresentacion = presentacion !== null && !estado.presentado;
  const diagnosticar = (respuesta: string): readonly Diagnostico[] => pista?.diagnosticar?.(ejercicio, respuesta) ?? [];
  const pistasDeReintento = (diagnosticos: readonly Diagnostico[], veredicto: Veredicto): readonly string[] =>
    pista?.pistasDeReintento?.(ejercicio, diagnosticos, veredicto) ?? [];
  const props = { repeticion: repeticion && !practica, voz, diagnosticar, onTerminar: terminar };

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

      {practica && !mostrarPresentacion ? <p className="practica">Practica la regla que acabas de fallar: {nombreDeDestreza(practica)}</p> : null}

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
        <Ordenar key={estado.indice} ejercicio={ejercicio} pistasDeReintento={pistasDeReintento} {...props} />
      ) : ejercicio.forma === 'decir' ? (
        <Decir key={estado.indice} ejercicio={ejercicio} {...props} />
      ) : (
        <Escrito key={estado.indice} ejercicio={ejercicio} pistasDeReintento={pistasDeReintento} {...props} />
      )}
    </div>
  );
}
