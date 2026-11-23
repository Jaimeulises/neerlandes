// Explicaciones de los fallos de una forma verbal: la conjugación (la -t que
// sobra o falta, el infinitivo sin conjugar, el plural del pasado), el
// participio (’t kofschip, ge-, los irregulares) y hebben o zijn. Cada una dice
// la regla con el verbo y el sujeto de la frase, no en abstracto.

import type { Caso, DiagnosticoNl } from './casos';
import { formasDe, mismoVerbo, presenteDelVerbo } from './formas';

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

/** La raíz y la forma con -t de un verbo del que se sabe el presente, si su singular sigue la regla: ik con la raíz, jij y hij con la -t (aunque se escriba distinto: ga, gaat). */
function singularRegular(presente: NonNullable<ReturnType<typeof presenteDelVerbo>>): { raiz: string; conT: string } | null {
  const [ik = [], jij = [], hij = []] = presente.formas;
  const [raiz] = ik;
  const [conT] = jij;
  if (raiz === undefined || conT === undefined || ik.length !== 1 || jij.length !== 1 || hij.length !== 1) return null;
  return hij[0] === conT && raiz !== conT ? { raiz, conT } : null;
}

/**
 * Por qué una forma conjugada no es la buena. null si las dos palabras no son del mismo verbo (entonces no es
 * un fallo de conjugación sino de palabra).
 */
export function explicarConjugacion(esperada: string, dada: string, sujeto: readonly string[], invertido: boolean): DiagnosticoNl | null {
  if (!mismoVerbo(esperada, dada) || esperada === dada) return null;
  const formasEsperada = formasDe(esperada);
  const formasDada = formasDe(dada);
  const esPasado = formasEsperada.some((f) => f.tipo === 'pasado') && !formasEsperada.some((f) => f.tipo === 'presente');
  const persona = personaDe(sujeto, esperada);
  const inf = infinitivoDe(esperada, dada);
  const suj = sujeto.length > 0 ? cita(sujeto) : 'el sujeto';
  const titulo = `${cita(dada)} no: ${cita(esperada)}`;
  const delVerbo = inf ? ` de ${cita(inf)}` : '';
  const explicar = (caso: Caso, destreza: string, texto: string, pista: string): DiagnosticoNl => ({ caso, destreza, titulo, texto, pista });

  if (esPasado) {
    const dadaEsPresente = formasDada.some((f) => f.tipo === 'presente' || f.tipo === 'infinitivo') && !formasDada.some((f) => f.tipo === 'pasado');
    if (dadaEsPresente) {
      return explicar(
        'pasado-con-presente',
        'pasado',
        `La frase va en pasado simple: el pasado${delVerbo} con ${suj} es ${cita(esperada)}. ${cita(dada)} es presente.`,
        `La frase va en pasado simple y ${cita(dada)} es presente. ¿Cuál es el pasado${delVerbo} con ${suj}?`,
      );
    }
    if (esperada === `${dada}n` || esperada === `${dada}en`) {
      return explicar(
        'pasado-plural-sin-n',
        'pasado',
        `En pasado, el plural (${suj}) lleva -n: ${cita(esperada)}. Sin -n es el singular (ik, jij, hij).`,
        // Igual que en el caso contrario: la pista no dice hacia dónde está el fallo.
        `Mira el sujeto: ${suj}. En pasado simple, ¿en qué se distingue el singular del plural?`,
      );
    }
    if (dada === `${esperada}n` || dada === `${esperada}en`) {
      return explicar(
        'pasado-singular-con-n',
        'pasado',
        `Con ${suj} (singular), el pasado va sin -n: ${cita(esperada)}. La -n es para el plural (wij, jullie, zij).`,
        `Mira el sujeto: ${suj}. En pasado simple, ¿en qué se distingue el singular del plural?`,
      );
    }
    const te = /te(n)?$/.test(esperada) && /de(n)?$/.test(dada);
    const de = /de(n)?$/.test(esperada) && /te(n)?$/.test(dada);
    if (te || de) {
      return explicar(
        'pasado-te-de',
        'pasado',
        `En los regulares, -te o -de sale de la misma regla que el participio, ’t kofschip: si en el infinitivo${delVerbo} va t, k, f, s, ch o p delante de -en, -te; si no, -de. Aquí: ${cita(esperada)}.`,
        `¿-te o -de? Mira qué letra va delante de -en en el infinitivo${delVerbo}: ¿está en ${cita('’t kofschip')} (t, k, f, s, ch, p)?`,
      );
    }
    return explicar(
      'pasado-irregular',
      'pasado',
      `El pasado${delVerbo} con ${suj} es ${cita(esperada)}: es irregular y hay que aprenderlo.`,
      `El pasado${delVerbo} es irregular: no lleva -te ni -de. ¿Cuál es con ${suj}?`,
    );
  }

  // Se esperaba el presente y ha puesto el pasado: falla el tiempo, no la persona.
  const dadaEsPasado = formasDada.some((f) => f.tipo === 'pasado') && !formasDada.some((f) => f.tipo === 'presente' || f.tipo === 'infinitivo');
  if (dadaEsPasado) {
    return explicar(
      'presente-con-pasado',
      'presente',
      `La frase va en presente: con ${suj}, ${cita(esperada)}. ${cita(dada)} es pasado simple.`,
      `La frase va en presente y ${cita(dada)} es pasado. ¿Cuál es el presente${delVerbo} con ${suj}?`,
    );
  }

  // Con los verbos de los datos se mira qué forma va con cada persona; con los demás, la regla (raíz, raíz + t).
  const presente = presenteDelVerbo(esperada) ?? presenteDelVerbo(dada);
  const regular = presente ? singularRegular(presente) : null;
  const jijDelante = presente ? (presente.formas[1] ?? []) : [`${esperada}t`];
  const conJij = presente ? presente.conJij : [esperada];
  const ikConT = regular ? esperada === regular.raiz && dada === regular.conT : !presente && dada === `${esperada}t`;
  const faltaT = regular ? esperada === regular.conT && dada === regular.raiz : !presente && esperada === `${dada}t`;

  if (persona === 'jij' && invertido && jijDelante.includes(dada) && !conJij.includes(dada) && conJij.includes(esperada)) {
    return explicar(
      'presente-jij-detras',
      'presente',
      `Cuando jij o je va detrás del verbo (en una pregunta o tras «morgen», por ejemplo), la -t se cae: ${cita([esperada, ...sujeto])}. Con jij delante sí lleva -t: «jij ${dada}».`,
      `Mira dónde va ${cita(sujeto)}: detrás del verbo. Con ${cita('jij')} y ${cita('je')}, ¿cambia algo la forma según vayan delante o detrás?`,
    );
  }
  if (persona === 'ik' && ikConT) {
    return explicar(
      'presente-ik-con-t',
      'presente',
      `Con ik va la raíz sola, sin -t: «ik ${esperada}». La -t es para jij, hij, zij y u.`,
      `Mira el sujeto: ${cita('ik')}. ¿Qué forma del presente va con ${cita('ik')}?`,
    );
  }
  if (faltaT) {
    const posesivo = sujeto[0];
    // «je zus», «jouw vriend»: ese je no es el sujeto «tú» sino «tu», y la -t no se cae aunque vaya detrás.
    if (persona === 'tercera' && sujeto.length > 1 && (posesivo === 'je' || posesivo === 'jouw')) {
      return explicar(
        'presente-je-posesivo',
        'presente',
        `Aquí ${cita(posesivo)} es «tu», no el sujeto «tú»: el sujeto es ${suj}, que va en tercera persona, así que el verbo lleva -t: ${cita(invertido ? [esperada, ...sujeto] : [...sujeto, esperada])}. La -t solo se cae si el sujeto es jij o je y va detrás del verbo.`,
        `Aquí ${cita(posesivo)} no es el sujeto “tú” sino “tu”: el sujeto es ${suj}. ¿Qué forma va con ese sujeto?`,
      );
    }
    const quien = persona === 'jij' ? 'Con jij delante del verbo' : persona === 'u' ? 'Con u' : `Con ${suj} (él, ella, eso o un nombre en singular)`;
    // La -s de «he works» es la misma idea que la -t de «hij werkt»: con la tercera persona, el inglés hace de disparador.
    const ingles = persona === 'tercera' ? ' En inglés dirías “he works”, no “he work”.' : '';
    return explicar(
      'presente-falta-t',
      'presente',
      `${quien} va raíz + t: ${cita([...sujeto, esperada])}. Solo se cae la -t si jij o je va detrás del verbo.`,
      `Mira el sujeto: ${suj}${persona === 'jij' ? ', delante del verbo' : ''}.${ingles} ¿Qué forma del presente le toca?`,
    );
  }
  if (persona === 'plural') {
    return explicar(
      'presente-plural',
      'presente',
      `Con ${suj} (plural), el verbo va en infinitivo: ${cita([...sujeto, esperada])}.`,
      `Mira el sujeto: ${suj}, que es plural. ¿Qué forma lleva el verbo en plural?`,
    );
  }
  const dadaEsInfinitivo = formasDada.some((f) => f.tipo === 'infinitivo') || (inf !== null && dada === inf);
  if (dadaEsInfinitivo) {
    return explicar(
      'presente-infinitivo',
      'presente',
      `Has dejado el verbo sin conjugar. Con ${suj}, ${cita(inf ?? dada)} es ${cita(esperada)}; el infinitivo solo va con wij, jullie y zij (plural).`,
      `${cita(dada)} está sin conjugar. Mira el sujeto, ${suj}: ¿qué forma del presente le toca?`,
    );
  }
  const irregular = formasEsperada.some((f) => f.verbo?.presente !== undefined);
  // Con jij detrás se dice, porque la forma no es la de jij delante.
  const con = persona === 'jij' && invertido ? `${suj} detrás del verbo` : suj;
  return explicar(
    'presente-otra',
    'presente',
    `Con ${con}, el presente${delVerbo} es ${cita(esperada)}.${irregular ? ' Es irregular: sus formas hay que aprenderlas.' : ''}`,
    irregular ? `${cita(inf ?? dada)} es irregular en presente: sus formas no salen de la regla. ¿Cuál va con ${con}?` : `Con ${con}, ¿va la raíz sola, raíz + t o el infinitivo?`,
  );
}

const KOFSCHIP = ['t', 'k', 'f', 's', 'ch', 'p'];

/** La letra que va delante de -en en el infinitivo (ch cuenta como una). */
function letraAntesDeEn(inf: string): string {
  const sinEn = inf.replace(/en$/, '');
  return sinEn.endsWith('ch') ? 'ch' : sinEn.slice(-1);
}

/** Por qué un participio no es el bueno. null si no se puede decir nada concreto. */
export function explicarParticipio(esperado: string, dado: string): DiagnosticoNl | null {
  if (esperado === dado) return null;
  const forma = formasDe(esperado).find((f) => f.tipo === 'participio');
  const inf = forma?.inf ?? null;
  const titulo = `${cita(dado)} no: ${cita(esperado)}`;
  // Las pistas nombran el verbo por su infinitivo, salvo si el participio es igual (vergeten): lo darían hecho.
  const verbo = inf && inf !== esperado ? cita(inf) : 'este verbo';
  const Verbo = inf && inf !== esperado ? cita(inf) : 'Este verbo';

  if (forma?.separable) {
    return {
      caso: 'participio-separable',
      destreza: 'separables',
      titulo,
      texto: `En los separables, ge- va entre la partícula y el verbo: ${cita(esperado)}. Primero la partícula, luego ge- y luego el participio del verbo.`,
      pista: `${Verbo} es separable: en el participio, ge- no va delante de todo. ¿Dónde va?`,
    };
  }
  if (forma?.irregular) {
    return {
      caso: 'participio-irregular',
      destreza: 'participio-irregular',
      titulo,
      texto: `${cita(inf ?? esperado)} tiene participio irregular: ${cita(esperado)}. No sigue la regla de ge + raíz + t o d, así que hay que aprenderlo de memoria.`,
      pista: `${Verbo} tiene participio irregular, que no sale de ge + raíz + t o d. Muchos acaban en -en. ¿Cuál es?`,
    };
  }
  if (!inf) {
    return {
      caso: 'participio-sin-datos',
      destreza: 'participio',
      titulo,
      texto: `El participio es ${cita(esperado)}.`,
      pista: 'Repasa el participio: ge + raíz + t o d si es regular; si es irregular, hay que recordarlo.',
    };
  }

  const conGe = esperado.startsWith('ge');
  // Con ge- o sin él: la misma pregunta en las dos direcciones, para que haya que aplicar el criterio.
  const preguntaGe = `¿Lleva ge- el participio de ${verbo}? Mira cómo empieza el infinitivo: los que empiezan por be-, ver-, ge-, her-, ont- o er- no lo llevan.`;
  if (!conGe && dado.startsWith('ge')) {
    return {
      caso: 'participio-prefijo',
      destreza: 'participio',
      titulo,
      texto: `${cita(inf)} empieza por un prefijo átono (be-, ver-, ge-, her-, ont-, er-), y con ellos el participio no lleva ge-: ${cita(esperado)}.`,
      pista: preguntaGe,
    };
  }
  if (conGe && !dado.startsWith('ge')) {
    return {
      caso: 'participio-sin-ge',
      destreza: 'participio',
      titulo,
      texto: `El participio regular empieza por ge-: ge + raíz + t o d. ${cita(inf)} da ${cita(esperado)}.`,
      pista: preguntaGe,
    };
  }
  const letra = letraAntesDeEn(inf);
  const conT = KOFSCHIP.includes(letra);
  const raizAcabaEnTD = (letra === 't' || letra === 'd') && (dado === `${esperado}t` || dado === `${esperado}d` || /(tt|td|dt|dd)$/.test(dado));
  if (raizAcabaEnTD) {
    return {
      caso: 'participio-raiz-td',
      destreza: 'participio',
      titulo,
      texto: `La raíz de ${cita(inf)} ya acaba en ${letra}, y no se añade otra: ${cita(esperado)}.`,
      pista: `La raíz de ${verbo} ya acaba en ${letra}. ¿Hace falta añadir otra t o d?`,
    };
  }
  return {
    caso: 'participio-kofschip',
    destreza: 'participio',
    titulo,
    texto: `’t kofschip: en ${cita(inf)} va ${cita(letra)} delante de -en, ${conT ? 'que está en ’t kofschip (t, k, f, s, ch, p), así que acaba en -t' : 'que no está en ’t kofschip (t, k, f, s, ch, p), así que acaba en -d'}: ${cita(esperado)}. Se mira el infinitivo, no la raíz.`,
    pista: `¿-t o -d? Mira qué letra va delante de -en en el infinitivo de ${verbo}: ¿está en ${cita('’t kofschip')} (t, k, f, s, ch, p)?`,
  };
}

/** Por qué el auxiliar del perfectum no es el bueno. */
export function explicarAuxiliar(usado: string, esperado: string, participio: string, fraseBuena: string): DiagnosticoNl {
  const forma = formasDe(participio).find((f) => f.tipo === 'participio');
  const inf = forma?.inf;
  const conZijn = ['ben', 'bent', 'is', 'zijn', 'was', 'waren'].includes(esperado);
  const verbo = inf ? `El perfectum de ${cita(inf)}` : 'Este perfectum';
  const fin = fraseBuena.endsWith('?»') ? '' : '.';
  return {
    caso: conZijn ? 'auxiliar-zijn' : 'auxiliar-hebben',
    destreza: 'auxiliar',
    titulo: `${cita(usado)} no: ${cita(esperado)}`,
    texto: conZijn
      ? `${verbo} va con zijn: ${fraseBuena}${fin} Con zijn van los verbos de movimiento hacia un sitio o de cambio de estado (gaan, komen, verhuizen, worden…), y además zijn y blijven.`
      : `${verbo} va con hebben: ${fraseBuena}${fin} La gran mayoría van con hebben; zijn es solo para el movimiento hacia un sitio, el cambio de estado, zijn y blijven.`,
    // Se habla de la frase y no del verbo (fietsen va con zijn si se va a un sitio y con hebben si no), y con la
    // misma pregunta en las dos direcciones: la pista no decide por el alumno.
    pista: `En inglés todo va con “have”. En neerlandés, ¿hay aquí movimiento hacia un sitio, cambio de estado, ${cita('zijn')} o ${cita('blijven')}? Según eso, ¿qué auxiliar va?`,
  };
}
