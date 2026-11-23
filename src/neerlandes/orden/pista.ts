// La pista del orden de la frase. Cada frase se aprende primero ordenando sus
// fichas y después se produce entera: traduciéndola, diciéndola en voz alta o
// escribiéndola al oído. Es donde se trabaja lo de no hablar con el orden del
// inglés.

import { UMBRAL_DOMINADA, type ContextoEjercicio, type Ejercicio, type Elemento, type Pista, type Presentacion } from '../../motor';
import { barajarFichas, comoFrase, conFormasTonicas, elegirForma, idFijo } from '../comun';
import { diagnosticarConFrase, pistasDeReintento } from '../diagnostico';
import type { IdDestreza } from '../destrezas';
import { FRASES, GRUPOS_ORDEN, NOMBRES_GRUPO_ORDEN, REGLAS_ORDEN, type DatosFrase, type GrupoOrden } from './datos';

export interface Frase extends Elemento {
  readonly grupo: GrupoOrden;
  /** Su código permanente (O12; en los separables, S3). */
  readonly codigo: string;
  /** Las fichas en su orden. */
  readonly fichas: readonly string[];
  /** La frase entera, con mayúscula y puntuación. */
  readonly frase: string;
  readonly es: string;
  /** Todas las formas buenas: la primera es la frase. */
  readonly validas: readonly string[];
  readonly pista?: string;
}

export function crearFrase(d: DatosFrase): Frase {
  const fichas = d.fichas.split('|').map((f) => f.trim());
  const final = d.final ?? '.';
  const frase = comoFrase(fichas.join(' '), final);
  return {
    id: idFijo(d.codigo),
    codigo: d.codigo,
    grupo: d.grupo,
    fichas,
    frase,
    es: d.es,
    validas: [frase, ...(d.otras ?? []).map((o) => comoFrase(o, final))],
    ...(d.pista ? { pista: d.pista } : {}),
  };
}

export const ELEMENTOS_ORDEN: readonly Frase[] = FRASES.map(crearFrase);

/** La frase que abre cada grupo: la primera, que es la primera que entra. */
const ABRE_GRUPO = new Set(GRUPOS_ORDEN.map((g) => ELEMENTOS_ORDEN.find((e) => e.grupo === g)?.id));

/** El ejemplo de la regla: la última frase del grupo, para no enseñar la que se pregunta justo después. */
function ejemploDe(grupo: GrupoOrden): Frase | undefined {
  return ELEMENTOS_ORDEN.filter((e) => e.grupo === grupo).at(-1);
}

/** El ejercicio para una frase en una forma concreta. */
export function ejercicioDeFrase(e: Frase, forma: Ejercicio['forma'], contexto: ContextoEjercicio, prefijo = 'orden'): Ejercicio {
  const base = { elementoId: e.id, audio: e.frase, aclaracion: REGLAS_ORDEN[e.grupo] };
  switch (forma) {
    case 'traducir':
      return {
        ...base,
        forma: 'traducir',
        tipo: `${prefijo}.traducir`,
        instruccion: 'Escríbela en neerlandés',
        significado: e.es,
        respuestas: conFormasTonicas(e.validas),
        ...(e.pista ? { pista: e.pista } : {}),
      };
    case 'decir':
      return {
        ...base,
        forma: 'decir',
        tipo: `${prefijo}.decir`,
        instruccion: 'Dila en voz alta antes de que se acabe el tiempo',
        significado: e.es,
        texto: e.frase,
        ...(e.pista ? { pista: e.pista } : {}),
      };
    case 'dictado':
      return {
        ...base,
        forma: 'dictado',
        tipo: `${prefijo}.dictado`,
        instruccion: 'Escucha y escríbela',
        dictar: e.frase,
        significado: e.es,
        // Se escribe lo que se oye: las otras formas valen al ordenar y al traducir, no aquí.
        respuestas: [e.frase],
      };
    default:
      return {
        ...base,
        forma: 'ordenar',
        tipo: `${prefijo}.ordenar`,
        instruccion: 'Ordena la frase',
        significado: e.es,
        fichas: barajarFichas(e.fichas, contexto.azar),
        validas: e.validas,
        frase: e.frase,
      };
  }
}

/** La destreza que entrena cada grupo. */
export const DESTREZA_DE_GRUPO: Readonly<Record<GrupoOrden, IdDestreza>> = {
  inversion: 'inversion',
  modal: 'modal',
  perfectum: 'perfectum-orden',
  separables: 'separables',
  niet: 'niet',
  preguntas: 'preguntas',
  subordinada: 'subordinada',
  'subordinada-delante': 'subordinada-delante',
};

const POR_ID = new Map(ELEMENTOS_ORDEN.map((e) => [e.id, e]));

export const orden: Pista<Frase> = {
  id: 'orden',
  nombre: 'Orden de la frase',
  descripcion: 'Dónde va el verbo: inversión, modales, perfectum, separables, niet, preguntas y subordinadas.',
  grupos: GRUPOS_ORDEN,
  nombresDeGrupo: NOMBRES_GRUPO_ORDEN,
  elementos: ELEMENTOS_ORDEN,
  // La dificultad sigue al nivel de la regla: si ya la dominas, ni las frases nuevas se ordenan con fichas
  // (se escriben o se dicen directamente); si está floja, vuelven más las fichas.
  crearEjercicio(e, contexto) {
    const dominio = contexto.dominio?.(DESTREZA_DE_GRUPO[e.grupo]) ?? null;
    const nivel = dominio === null ? 'normal' : dominio >= UMBRAL_DOMINADA ? 'alto' : dominio < 0.45 ? 'bajo' : 'normal';
    const { azar, formas } = contexto;
    let forma: Ejercicio['forma'];
    if (nivel === 'alto') {
      forma =
        contexto.repeticiones === 0
          ? elegirForma(azar, formas, [['traducir', 1]], 'ordenar')
          : elegirForma(
              azar,
              formas,
              [
                ['traducir', 4],
                ['decir', 2],
                ['dictado', 1],
              ],
              'ordenar',
            );
    } else if (contexto.repeticiones === 0) {
      forma = 'ordenar';
    } else if (contexto.repeticiones === 1) {
      forma = elegirForma(azar, formas, [['traducir', 1]], 'ordenar');
    } else {
      forma = elegirForma(
        azar,
        formas,
        [
          ['traducir', 4],
          ['decir', 2],
          ['ordenar', nivel === 'bajo' ? 3 : 1],
          ['dictado', 1],
        ],
        'ordenar',
      );
    }
    return ejercicioDeFrase(e, forma, contexto);
  },
  // Lo que se aprende es la regla, no cada frase: la regla se presenta una vez, al abrir el grupo, y las
  // frases se intentan sin verlas antes, que es lo que hay que saber hacer al hablar. Si cada frase se
  // enseñara antes de ordenarla, el ejercicio sería copiar lo que se acaba de leer.
  destrezasDe(e) {
    return [DESTREZA_DE_GRUPO[e.grupo]];
  },
  diagnosticar(ejercicio, respuesta) {
    const frase = POR_ID.get(ejercicio.elementoId);
    return frase ? diagnosticarConFrase(frase, ejercicio, respuesta) : [];
  },
  pistasDeReintento,
  presentar(e): Presentacion | null {
    if (!ABRE_GRUPO.has(e.id)) return null;
    const ejemplo = ejemploDe(e.grupo) ?? e;
    return {
      etiqueta: `Regla nueva: ${NOMBRES_GRUPO_ORDEN[e.grupo]}`,
      principal: ejemplo.frase,
      significado: ejemplo.es,
      nota: null,
      audio: ejemplo.frase,
      detalle: REGLAS_ORDEN[e.grupo],
    };
  },
};
