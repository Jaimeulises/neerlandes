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
      return { destreza: 'pasado', titulo, texto: `La frase va en pasado simple: el pasado${delVerbo} con ${suj} es ${cita(esperada)}. ${cita(dada)} es presente.` };
    }
    if (esperada === `${dada}n` || esperada === `${dada}en`) {
      return { destreza: 'pasado', titulo, texto: `En pasado, el plural (${suj}) lleva -n: ${cita(esperada)}. Sin -n es el singular (ik, jij, hij).` };
    }
    if (dada === `${esperada}n` || dada === `${esperada}en`) {
      return { destreza: 'pasado', titulo, texto: `Con ${suj} (singular), el pasado va sin -n: ${cita(esperada)}. La -n es para el plural (wij, jullie, zij).` };
    }
    const te = /te(n)?$/.test(esperada) && /de(n)?$/.test(dada);
    const de = /de(n)?$/.test(esperada) && /te(n)?$/.test(dada);
    if (te || de) {
      return {
        destreza: 'pasado',
        titulo,
        texto: `En los regulares, -te o -de sale de la misma regla que el participio, ’t kofschip: si en el infinitivo${delVerbo} va t, k, f, s, ch o p delante de -en, -te; si no, -de. Aquí: ${cita(esperada)}.`,
      };
    }
    return { destreza: 'pasado', titulo, texto: `El pasado${delVerbo} con ${suj} es ${cita(esperada)}: es irregular y hay que aprenderlo.` };
  }

  if (dada === `${esperada}t` && persona === 'jij' && invertido) {
    return {
      destreza: 'presente',
      titulo,
      texto: `Cuando jij o je va detrás del verbo (en una pregunta o tras «morgen», por ejemplo), la -t se cae: ${cita([esperada, ...sujeto])}. Con jij delante sí lleva -t: «jij ${dada}».`,
    };
  }
  if (dada === `${esperada}t` && persona === 'ik') {
    return { destreza: 'presente', titulo, texto: `Con ik va la raíz sola, sin -t: «ik ${esperada}». La -t es para jij, hij, zij y u.` };
  }
  if (esperada === `${dada}t`) {
    const quien = persona === 'jij' ? 'Con jij delante del verbo' : persona === 'u' ? 'Con u' : `Con ${suj} (él, ella, eso o un nombre en singular)`;
    return { destreza: 'presente', titulo, texto: `${quien} va raíz + t: ${cita([...sujeto, esperada])}. Solo se cae la -t si jij o je va detrás del verbo.` };
  }
  if (persona === 'plural') {
    return { destreza: 'presente', titulo, texto: `Con ${suj} (plural), el verbo va en infinitivo: ${cita([...sujeto, esperada])}.` };
  }
  const dadaEsInfinitivo = formasDe(dada).some((f) => f.tipo === 'infinitivo') || (inf !== null && dada === inf);
  if (dadaEsInfinitivo) {
    return { destreza: 'presente', titulo, texto: `Has dejado el verbo sin conjugar. Con ${suj}, ${cita(inf ?? dada)} es ${cita(esperada)}; el infinitivo solo va con wij, jullie y zij (plural).` };
  }
  const irregular = formasEsperada.some((f) => f.verbo?.presente !== undefined);
  return {
    destreza: 'presente',
    titulo,
    texto: `Con ${suj}, el presente${delVerbo} es ${cita(esperada)}.${irregular ? ' Es irregular: sus formas hay que aprenderlas.' : ''}`,
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

  if (separable) {
    return {
      destreza: 'separables',
      titulo,
      texto: `En los separables, ge- va entre la partícula y el verbo: ${cita(esperado)}. Primero la partícula, luego ge- y luego el participio del verbo.`,
    };
  }
  if (forma?.irregular) {
    return {
      destreza: 'participio-irregular',
      titulo,
      texto: `${cita(inf ?? esperado)} tiene participio irregular: ${cita(esperado)}. No sigue la regla de ge + raíz + t o d, así que hay que aprenderlo de memoria.`,
    };
  }
  if (!inf) return { destreza: 'participio', titulo, texto: `El participio es ${cita(esperado)}.` };

  const conGe = esperado.startsWith('ge');
  if (!conGe && dado.startsWith('ge')) {
    return {
      destreza: 'participio',
      titulo,
      texto: `${cita(inf)} empieza por un prefijo átono (be-, ver-, ge-, her-, ont-, er-), y con ellos el participio no lleva ge-: ${cita(esperado)}.`,
    };
  }
  if (conGe && !dado.startsWith('ge')) {
    return { destreza: 'participio', titulo, texto: `El participio regular empieza por ge-: ge + raíz + t o d. ${cita(inf)} da ${cita(esperado)}.` };
  }
  const letra = letraAntesDeEn(inf);
  const conT = KOFSCHIP.includes(letra);
  const raizAcabaEnTD = (letra === 't' || letra === 'd') && (dado === `${esperado}t` || dado === `${esperado}d` || /(tt|td|dt|dd)$/.test(dado));
  if (raizAcabaEnTD) {
    return { destreza: 'participio', titulo, texto: `La raíz de ${cita(inf)} ya acaba en ${letra}, y no se añade otra: ${cita(esperado)}.` };
  }
  return {
    destreza: 'participio',
    titulo,
    texto: `’t kofschip: en ${cita(inf)} va ${cita(letra)} delante de -en, ${conT ? 'que está en ’t kofschip (t, k, f, s, ch, p), así que acaba en -t' : 'que no está en ’t kofschip (t, k, f, s, ch, p), así que acaba en -d'}: ${cita(esperado)}. Se mira el infinitivo, no la raíz.`,
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
  };
}
