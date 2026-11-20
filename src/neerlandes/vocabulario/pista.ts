// La pista del vocabulario. Primero se reconoce (elegir el significado), luego
// se elige en neerlandés y a partir de ahí se escribe con su artículo, que es
// lo que de verdad cuesta.

import { palabras, type ContextoEjercicio, type Diagnostico, type Ejercicio, type Elemento, type Pista, type Presentacion } from '../../motor';
import { conFormasTonicas, elegirForma, idDe, opcionesCon } from '../comun';
import { GRUPOS_VOCABULARIO, NOMBRES_GRUPO_VOCABULARIO, PALABRAS, type DatosPalabra, type GrupoVocabulario } from './datos';

export interface Palabra extends Elemento {
  readonly grupo: GrupoVocabulario;
  readonly nl: string;
  readonly es: string;
  readonly otras: readonly string[];
  /** Si se escribe con su artículo (de o het): los sustantivos, también los que solo van en plural. */
  readonly sustantivo: boolean;
  /** de o het, si es un sustantivo en singular. */
  readonly articulo: 'de' | 'het' | null;
  /** Palabras (en neerlandés) cuyo significado también valdría: no salen como opción mala con esta, ni al revés. */
  readonly parecidas: readonly string[];
  readonly nota: string | null;
}

export function crearPalabra(d: DatosPalabra): Palabra {
  const sustantivo = !d.expresion && /^(de|het) /.test(d.nl);
  const articulo = !sustantivo || d.plural ? null : d.nl.startsWith('de ') ? 'de' : 'het';
  return {
    id: `${d.grupo}:${idDe(d.nl)}`,
    grupo: d.grupo,
    nl: d.nl,
    es: d.es,
    otras: d.otras ?? [],
    sustantivo,
    articulo,
    parecidas: d.parecidas ?? [],
    nota: d.nota ?? null,
  };
}

export const ELEMENTOS_VOCABULARIO: readonly Palabra[] = PALABRAS.map(crearPalabra);

/** Distractores: primero los del mismo tema que ya se han visto, luego los del tema, luego cualquiera. */
function distractores(e: Palabra, contexto: ContextoEjercicio, campo: (p: Palabra) => string): string[] {
  const otras = ELEMENTOS_VOCABULARIO.filter((p) => p.id !== e.id && !e.parecidas.includes(p.nl) && !p.parecidas.includes(e.nl));
  const tema = otras.filter((p) => p.grupo === e.grupo);
  const vistosTema = tema.filter((p) => contexto.vistos.has(p.id));
  const orden = [...contexto.azar.barajar(vistosTema), ...contexto.azar.barajar(tema), ...contexto.azar.barajar(otras)];
  return [...new Set(orden.map(campo))];
}

function sinArticulo(nl: string): string {
  return nl.replace(/^(de|het) /, '');
}

function aclaracionDe(e: Palabra): string | undefined {
  const partes = [`${e.nl}: ${e.es}.`];
  if (e.nota) partes.push(e.nota);
  return partes.join(' ');
}

export const vocabulario: Pista<Palabra> = {
  id: 'vocabulario',
  nombre: 'Vocabulario',
  descripcion: 'Palabras y expresiones de la vida diaria, siempre con su de o het.',
  grupos: GRUPOS_VOCABULARIO,
  nombresDeGrupo: NOMBRES_GRUPO_VOCABULARIO,
  elementos: ELEMENTOS_VOCABULARIO,
  crearEjercicio(e, contexto): Ejercicio {
    const { azar } = contexto;
    const aclaracion = aclaracionDe(e);
    const base = { elementoId: e.id, audio: e.nl, ...(aclaracion ? { aclaracion } : {}) };

    if (contexto.repeticiones === 0) {
      return {
        ...base,
        forma: 'opcion',
        tipo: 'vocabulario.significado',
        instruccion: '¿Qué significa?',
        enunciado: e.nl,
        enunciadoEnIdioma: true,
        opciones: opcionesCon(e.es, distractores(e, contexto, (p) => p.es), azar),
        opcionesEnIdioma: false,
        respuestaCorrecta: e.es,
      };
    }
    // Elegir en neerlandés, en el primer repaso, solo si las opciones están activadas.
    if (contexto.repeticiones === 1 && contexto.formas.has('opcion')) {
      return {
        ...base,
        forma: 'opcion',
        tipo: 'vocabulario.elegir',
        instruccion: '¿Cómo se dice en neerlandés?',
        enunciado: e.es,
        enunciadoEnIdioma: false,
        opciones: opcionesCon(e.nl, distractores(e, contexto, (p) => p.nl), azar),
        opcionesEnIdioma: true,
        respuestaCorrecta: e.nl,
      };
    }

    const forma = elegirForma(
      azar,
      contexto.formas,
      [
        ['traducir', 5],
        ['opcion', e.articulo ? 2 : 0],
        ['dictado', 1],
      ],
      'traducir',
    );
    if (forma === 'opcion' && e.articulo) {
      return {
        ...base,
        forma: 'opcion',
        tipo: 'vocabulario.articulo',
        destrezas: ['articulo'],
        instruccion: '¿De o het?',
        enunciado: sinArticulo(e.nl),
        enunciadoEnIdioma: true,
        significado: e.es,
        opciones: ['de', 'het'],
        opcionesEnIdioma: true,
        respuestaCorrecta: e.articulo,
      };
    }
    if (forma === 'dictado') {
      return {
        ...base,
        forma: 'dictado',
        tipo: 'vocabulario.dictado',
        instruccion: 'Escucha y escríbela',
        dictar: e.nl,
        significado: e.es,
        // Se escribe lo que se oye: las otras formas valen al escribirla en neerlandés, no aquí.
        respuestas: [e.nl],
      };
    }
    return {
      ...base,
      forma: 'traducir',
      tipo: 'vocabulario.escribir',
      instruccion: 'Escríbela en neerlandés',
      significado: e.es,
      ...(e.sustantivo ? { pista: 'Con su artículo (de o het).' } : {}),
      respuestas: conFormasTonicas([e.nl, ...e.otras]),
    };
  },
  destrezasDe() {
    return ['vocabulario'];
  },
  diagnosticar(ejercicio, respuesta): Diagnostico[] {
    const e = ELEMENTOS_VOCABULARIO.find((x) => x.id === ejercicio.elementoId);
    if (!e?.articulo) return [];
    const dado = ejercicio.forma === 'opcion' ? [respuesta] : palabras(respuesta);
    const articulo = dado[0];
    const sustantivo = palabras(sinArticulo(e.nl)).join(' ');
    const mismoSustantivo = ejercicio.forma === 'opcion' || dado.slice(1).join(' ') === sustantivo;
    if ((articulo !== 'de' && articulo !== 'het') || articulo === e.articulo || !mismoSustantivo) return [];
    const diminutivo = sustantivo.endsWith('je');
    return [
      {
        destreza: 'articulo',
        titulo: `Es «${e.articulo} ${sustantivo}», no «${articulo} ${sustantivo}»`,
        texto: diminutivo
          ? 'Acaba en -je: los diminutivos siempre van con het.'
          : e.articulo === 'het'
            ? 'Es de las palabras con het: hay menos que con de, así que conviene aprenderlas con su artículo, como una sola palabra.'
            : 'Va con de, que es lo más común (todos los plurales y la mayoría de las palabras en singular). Apréndela con su artículo, como una sola palabra.',
      },
    ];
  },
  presentar(e): Presentacion {
    return { principal: e.nl, significado: e.es, nota: e.nota, audio: e.nl };
  },
};
