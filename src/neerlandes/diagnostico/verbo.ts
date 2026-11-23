// Explicaciones de los fallos de una forma verbal: la conjugación (la -t que
// sobra o falta, el infinitivo sin conjugar, el plural del pasado), el
// participio (’t kofschip, ge-, los irregulares) y hebben o zijn. Cada una dice
// la regla con el verbo y el sujeto de la frase, no en abstracto.

import type { Diagnostico } from '../../motor';
import { SEPARABLES } from '../verbos/datos';
import { formasDe, mismoVerbo } from './formas';

const cita = (p: readonly string[] | string): string => `«${typeof p === 'string' ? p : p.join(' ')}»`;

type Persona = 'ik' | 'jij' | 'u' | 'tercera' | 'plural';

/** La persona del sujeto. Con ze, que puede ser ella o ellos, decide la forma buena: si acaba en -en, plural. */
function personaDe(sujeto: readonly string[], esperada: string): Persona {
  const s = sujeto.join(' ');
  if (s === 'ik') return 'ik';
  if (s === 'jij' || s === 'je') return 'jij';
  if (s === 'u') return 'u';
  if (s === 'we' || s === 'wij' || s === 'jullie') return 'plural';
  const esInfinitivoOPlural = formasDe(esperada).some((f) => f.tipo === 'infinitivo') || /en$/.test(esperada);
  if (s === 'ze' || s === 'zij') return esInfinitivoOPlural ? 'plural' : 'tercera';
  // Un sustantivo: si la forma buena es la del plural, el sujeto es plural (mijn ouders, de buren).
  return esInfinitivoOPlural && sujeto.length > 1 ? 'plural' : 'tercera';
}

/** El infinitivo del verbo de una forma, si se conoce. */
function infinitivoDe(...formas: string[]): string | null {
  for (const f of formas) {
    const inf = formasDe(f)[0]?.inf;
    if (inf) return inf;
  }
  return null;
}

/**
 * Por qué una forma conjugada no es la buena. null si las dos palabras no son del mismo verbo (entonces no es
 * un fallo de conjugación sino de palabra).
 */
export function explicarConjugacion(esperada: string, dada: string, sujeto: readonly string[], invertido: boolean): Diagnostico | null {
  if (!mismoVerbo(esperada, dada) || esperada === dada) return null;
  const formasEsperada = formasDe(esperada);
  const esPasado = formasEsperada.some((f) => f.tipo === 'pasado') && !formasEsperada.some((f) => f.tipo === 'presente');
  const persona = personaDe(sujeto, esperada);
  const inf = infinitivoDe(esperada, dada);
  const suj = sujeto.length > 0 ? cita(sujeto) : 'el sujeto';
  const titulo = `${cita(dada)} no: ${cita(esperada)}`;
  const delVerbo = inf ? ` de ${cita(inf)}` : '';

  if (esPasado) {
    const dadaEsPresente = formasDe(dada).some((f) => f.tipo === 'presente' || f.tipo === 'infinitivo') && !formasDe(dada).some((f) => f.tipo === 'pasado');
    if (dadaEsPresente) {
      return {
        destreza: 'pasado',
        titulo,
        texto: `La frase va en pasado simple: el pasado${delVerbo} con ${suj} es ${cita(esperada)}. ${cita(dada)} es presente.`,
        pista: `La frase va en pasado simple y ${cita(dada)} es presente. ¿Cuál es el pasado${delVerbo} con ${suj}?`,
      };
    }
    if (esperada === `${dada}n` || esperada === `${dada}en`) {
      return {
        destreza: 'pasado',
        titulo,
        texto: `En pasado, el plural (${suj}) lleva -n: ${cita(esperada)}. Sin -n es el singular (ik, jij, hij).`,
        pista: `${cita(dada)} es el pasado del singular, y ${suj} es plural. ¿Qué le falta?`,
      };
    }
    if (dada === `${esperada}n` || dada === `${esperada}en`) {
      return {
        destreza: 'pasado',
        titulo,
        texto: `Con ${suj} (singular), el pasado va sin -n: ${cita(esperada)}. La -n es para el plural (wij, jullie, zij).`,
        pista: `${cita(dada)} es el pasado del plural, y ${suj} es singular. ¿Qué le sobra?`,
      };
    }
    const te = /te(n)?$/.test(esperada) && /de(n)?$/.test(dada);
    const de = /de(n)?$/.test(esperada) && /te(n)?$/.test(dada);
    if (te || de) {
      return {
        destreza: 'pasado',
        titulo,
        texto: `En los regulares, -te o -de sale de la misma regla que el participio, ’t kofschip: si en el infinitivo${delVerbo} va t, k, f, s, ch o p delante de -en, -te; si no, -de. Aquí: ${cita(esperada)}.`,
        pista: `¿-te o -de? Sale de la misma regla que el participio: mira qué letra va delante de -en en el infinitivo${delVerbo} y si está en ’t kofschip (t, k, f, s, ch, p).`,
      };
    }
    return {
      destreza: 'pasado',
      titulo,
      texto: `El pasado${delVerbo} con ${suj} es ${cita(esperada)}: es irregular y hay que aprenderlo.`,
      pista: `El pasado${delVerbo} es irregular: no lleva -te ni -de. ¿Cuál es con ${suj}?`,
    };
  }

  if (dada === `${esperada}t` && persona === 'jij' && invertido) {
    return {
      destreza: 'presente',
      titulo,
      texto: `Cuando jij o je va detrás del verbo (en una pregunta o tras «morgen», por ejemplo), la -t se cae: ${cita([esperada, ...sujeto])}. Con jij delante sí lleva -t: «jij ${dada}».`,
      pista: `Aquí ${cita(sujeto)} va detrás del verbo. Con jij o je detrás, el verbo pierde algo que lleva con jij delante. ¿Qué le sobra a ${cita(dada)}?`,
    };
  }
  if (dada === `${esperada}t` && persona === 'ik') {
    return {
      destreza: 'presente',
      titulo,
      texto: `Con ik va la raíz sola, sin -t: «ik ${esperada}». La -t es para jij, hij, zij y u.`,
      pista: `Con ik va la raíz sola, sin nada detrás. ¿Qué le sobra a ${cita(dada)}?`,
    };
  }
  if (esperada === `${dada}t`) {
    const quien = persona === 'jij' ? 'Con jij delante del verbo' : persona === 'u' ? 'Con u' : `Con ${suj} (él, ella, eso o un nombre en singular)`;
    // La -s de «he works» es la misma idea que la -t de «hij werkt»: con la tercera persona, el contraste ayuda.
    const ingles = persona === 'tercera' ? ' Como en inglés “he works” lleva -s, aquí la raíz también lleva algo detrás.' : '';
    return {
      destreza: 'presente',
      titulo,
      texto: `${quien} va raíz + t: ${cita([...sujeto, esperada])}. Solo se cae la -t si jij o je va detrás del verbo.`,
      pista: `${quien}, la raíz sola no basta.${ingles} ¿Qué le falta a ${cita(dada)}?`,
    };
  }
  if (persona === 'plural') {
    return {
      destreza: 'presente',
      titulo,
      texto: `Con ${suj} (plural), el verbo va en infinitivo: ${cita([...sujeto, esperada])}.`,
      pista: `${suj} es plural. ¿Qué forma lleva el verbo con wij, jullie y zij?`,
    };
  }
  const dadaEsInfinitivo = formasDe(dada).some((f) => f.tipo === 'infinitivo') || (inf !== null && dada === inf);
  if (dadaEsInfinitivo) {
    return {
      destreza: 'presente',
      titulo,
      texto: `Has dejado el verbo sin conjugar. Con ${suj}, ${cita(inf ?? dada)} es ${cita(esperada)}; el infinitivo solo va con wij, jullie y zij (plural).`,
      pista: `${cita(dada)} es el infinitivo, que solo va con wij, jullie y zij. ¿Qué forma lleva con ${suj}?`,
    };
  }
  const irregular = formasEsperada.some((f) => f.verbo?.presente !== undefined);
  return {
    destreza: 'presente',
    titulo,
    texto: `Con ${suj}, el presente${delVerbo} es ${cita(esperada)}.${irregular ? ' Es irregular: sus formas hay que aprenderlas.' : ''}`,
    pista: irregular
      ? `${cita(inf ?? dada)} es irregular en presente: sus formas no salen de la regla. ¿Cuál va con ${suj}?`
      : `Con ${suj}, ¿va la raíz sola, raíz + t o el infinitivo?`,
  };
}

const KOFSCHIP = ['t', 'k', 'f', 's', 'ch', 'p'];

/** La letra que va delante de -en en el infinitivo (ch cuenta como una). */
function letraAntesDeEn(inf: string): string {
  const sinEn = inf.replace(/en$/, '');
  return sinEn.endsWith('ch') ? 'ch' : sinEn.slice(-1);
}

/** Por qué un participio no es el bueno. null si no se puede decir nada concreto. */
export function explicarParticipio(esperado: string, dado: string): Diagnostico | null {
  if (esperado === dado) return null;
  const forma = formasDe(esperado).find((f) => f.tipo === 'participio');
  const inf = forma?.inf ?? null;
  const titulo = `${cita(dado)} no: ${cita(esperado)}`;
  const separable = inf ? SEPARABLES.find((s) => s.inf === inf) : undefined;
  // Las pistas nombran el verbo por su infinitivo, salvo si el participio es igual (vergeten): lo darían hecho.
  const verbo = inf && inf !== esperado ? cita(inf) : 'este verbo';
  const Verbo = inf && inf !== esperado ? cita(inf) : 'Este verbo';

  if (separable) {
    return {
      destreza: 'separables',
      titulo,
      texto: `En los separables, ge- va entre la partícula y el verbo: ${cita(esperado)}. Primero la partícula, luego ge- y luego el participio del verbo.`,
      pista: `${Verbo} es separable: en el participio, ge- no va delante de todo. ¿Dónde va?`,
    };
  }
  if (forma?.irregular) {
    return {
      destreza: 'participio-irregular',
      titulo,
      texto: `${cita(inf ?? esperado)} tiene participio irregular: ${cita(esperado)}. No sigue la regla de ge + raíz + t o d, así que hay que aprenderlo de memoria.`,
      pista: `${Verbo} es irregular: su participio no sale de ge + raíz + t o d. Muchos acaban en -en, a menudo con otra vocal, y otros en -cht. ¿Cuál es?`,
    };
  }
  if (!inf) {
    return {
      destreza: 'participio',
      titulo,
      texto: `El participio es ${cita(esperado)}.`,
      pista: 'Repasa el participio: ge + raíz + t o d si es regular; si es irregular, hay que recordarlo.',
    };
  }

  const conGe = esperado.startsWith('ge');
  if (!conGe && dado.startsWith('ge')) {
    return {
      destreza: 'participio',
      titulo,
      texto: `${cita(inf)} empieza por un prefijo átono (be-, ver-, ge-, her-, ont-, er-), y con ellos el participio no lleva ge-: ${cita(esperado)}.`,
      pista: `${Verbo} empieza por un prefijo átono (be-, ver-, ge-, her-, ont-, er-). Con esos prefijos, ¿qué le sobra a ${cita(dado)}?`,
    };
  }
  if (conGe && !dado.startsWith('ge')) {
    return {
      destreza: 'participio',
      titulo,
      texto: `El participio regular empieza por ge-: ge + raíz + t o d. ${cita(inf)} da ${cita(esperado)}.`,
      pista: `El participio regular tiene tres partes: ge + raíz + t o d. ¿Qué le falta a ${cita(dado)}?`,
    };
  }
  const letra = letraAntesDeEn(inf);
  const conT = KOFSCHIP.includes(letra);
  const raizAcabaEnTD = (letra === 't' || letra === 'd') && (dado === `${esperado}t` || dado === `${esperado}d` || /(tt|td|dt|dd)$/.test(dado));
  if (raizAcabaEnTD) {
    return {
      destreza: 'participio',
      titulo,
      texto: `La raíz de ${cita(inf)} ya acaba en ${letra}, y no se añade otra: ${cita(esperado)}.`,
      pista: `La raíz de ${verbo} ya acaba en ${letra}. ¿Hace falta añadir otra t o d?`,
    };
  }
  return {
    destreza: 'participio',
    titulo,
    texto: `’t kofschip: en ${cita(inf)} va ${cita(letra)} delante de -en, ${conT ? 'que está en ’t kofschip (t, k, f, s, ch, p), así que acaba en -t' : 'que no está en ’t kofschip (t, k, f, s, ch, p), así que acaba en -d'}: ${cita(esperado)}. Se mira el infinitivo, no la raíz.`,
    pista: `¿-t o -d? Mira qué letra va delante de -en en el infinitivo de ${verbo} y si está en ’t kofschip (t, k, f, s, ch, p). Se mira el infinitivo, no la raíz.`,
  };
}

/** Por qué el auxiliar del perfectum no es el bueno. */
export function explicarAuxiliar(usado: string, esperado: string, participio: string, fraseBuena: string): Diagnostico {
  const forma = formasDe(participio).find((f) => f.tipo === 'participio');
  const inf = forma?.inf;
  const conZijn = ['ben', 'bent', 'is', 'zijn', 'was', 'waren'].includes(esperado);
  const verbo = inf ? `El perfectum de ${cita(inf)}` : 'Este perfectum';
  const fin = fraseBuena.endsWith('?»') ? '' : '.';
  return {
    destreza: 'auxiliar',
    titulo: `${cita(usado)} no: ${cita(esperado)}`,
    texto: conZijn
      ? `${verbo} va con zijn: ${fraseBuena}${fin} Con zijn van los verbos de movimiento hacia un sitio o de cambio de estado (gaan, komen, verhuizen, worden…), y además zijn y blijven.`
      : `${verbo} va con hebben: ${fraseBuena}${fin} La gran mayoría van con hebben; zijn es solo para el movimiento hacia un sitio, el cambio de estado, zijn y blijven.`,
    // Se habla de la frase y no del verbo: fietsen va con zijn si se va a un sitio y con hebben si no.
    pista: conZijn
      ? 'En inglés todo va con have, pero en neerlandés el movimiento hacia un sitio, el cambio de estado, zijn y blijven llevan otro auxiliar. ¿Cuál va aquí, y en qué forma?'
      : 'Con zijn solo van el movimiento hacia un sitio, el cambio de estado, zijn y blijven, y aquí no hay nada de eso. ¿Qué auxiliar va, y en qué forma?',
  };
}
