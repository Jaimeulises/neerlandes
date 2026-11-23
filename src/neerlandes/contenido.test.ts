// Comprueba el contenido: que cada frase de ejemplo contenga la forma que se
// pregunta, que los participios regulares sigan la regla, que no haya
// significados repetidos y que cada ejercicio que se puede crear tenga una
// respuesta buena alcanzable. Si una corrección de una persona nativa rompe
// algo, salta aquí.

import { describe, expect, it } from 'vitest';
import { corregir, crearAzar, normalizar, TODAS_LAS_FORMAS, validarPista, type ContextoEjercicio, type Ejercicio } from '../motor';
import { alternativas, conFormasTonicas, hueco, opcionesCon, primera } from './comun';
import { FRASES, GRUPOS_ORDEN, REGLAS_ORDEN } from './orden/datos';
import { ejercicioDeFrase, ELEMENTOS_ORDEN, orden } from './orden/pista';
import { PISTAS } from './paquete';
import { SEPARABLES, VERBOS } from './verbos/datos';
import { EJEMPLO_DE_REGLA, ELEMENTOS_VERBOS, formasPresente, frasePresenteEs, preguntaPresenteEs, REGLAS_VERBOS, SUJETOS, verbos } from './verbos/pista';
import { ELEMENTOS_VOCABULARIO, vocabulario } from './vocabulario/pista';

const AUX_HEBBEN = new Set(['heb', 'hebt', 'heeft', 'hebben']);
const AUX_ZIJN = new Set(['ben', 'bent', 'is', 'zijn']);
const SIN_GE = /^(be|ver|ge|her|ont|er)/;

function auxiliarDe(frase: string): string | undefined {
  return frase.split(/\s+/).find((p) => AUX_HEBBEN.has(p) || AUX_ZIJN.has(p));
}

/** El participio regular sin el ge- del principio: raíz + t (’t kofschip) o d. */
function participioSinGe(inf: string, raiz: string): string {
  const original = inf.slice(0, -2);
  const sorda = /(t|k|f|s|ch|p)$/.test(original);
  const final = /[td]$/.test(raiz) ? '' : sorda ? 't' : 'd';
  return `${raiz}${final}`;
}

function textos(): string[] {
  return [
    ...FRASES.flatMap((f) => [f.fichas, f.es, ...(f.otras ?? []), f.pista ?? '']),
    ...Object.values(REGLAS_ORDEN),
    ...VERBOS.flatMap((v) => [v.inf, v.es, ...(v.perf ?? []), ...(v.perfOtras ?? []), ...(v.pasadoEj ?? []), ...(v.pasadoOtras ?? []), v.nota ?? '', v.comp ?? '', v.compEs ?? '', ...(v.presenteEs ?? [])]),
    ...SEPARABLES.flatMap((s) => [s.inf, s.es, s.presente, s.presenteEs, ...(s.otras ?? []), ...s.perf]),
    ...ELEMENTOS_VOCABULARIO.flatMap((p) => [p.nl, p.es, ...p.otras, p.nota ?? '']),
    ...ELEMENTOS_VERBOS.flatMap((e) => [verbos.presentar?.(e)?.detalle ?? '']),
  ];
}

describe('el contenido está bien formado', () => {
  it('cada pista pasa la validación del motor', () => {
    for (const pista of PISTAS) expect(validarPista(pista), pista.id).toEqual([]);
  });

  it('sin rayas largas ni medias en ningún texto', () => {
    const conRaya = textos().filter((t) => /[\u2013\u2014]/.test(t));
    expect(conRaya).toEqual([]);
  });

  it('las frases de orden se reconstruyen con sus fichas y sus otras formas son distintas', () => {
    for (const f of ELEMENTOS_ORDEN) {
      expect(normalizar(f.frase), f.id).toBe(normalizar(f.fichas.join(' ')));
      const normalizadas = f.validas.map(normalizar);
      expect(new Set(normalizadas).size, f.id).toBe(normalizadas.length);
      expect(f.fichas.length, f.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('el español de cada frase acaba en punto o interrogación', () => {
    for (const f of FRASES) expect(f.es, f.fichas).toMatch(/[.?]$/);
    for (const v of VERBOS) {
      if (v.perf) expect(v.perf[1], v.inf).toMatch(/[.?]$/);
      if (v.pasadoEj) expect(v.pasadoEj[1], v.inf).toMatch(/[.?]$/);
    }
  });

  it('cada frase en perfectum contiene su participio una vez y el auxiliar que le toca', () => {
    for (const v of VERBOS) {
      if (!v.perf || !v.participio) continue;
      expect(hueco(v.perf[0], v.participio), v.inf).not.toBeNull();
      const aux = auxiliarDe(v.perf[0]);
      expect(aux, v.inf).toBeDefined();
      expect((v.aux === 'zijn' ? AUX_ZIJN : AUX_HEBBEN).has(aux ?? ''), `${v.inf}: ${aux ?? ''}`).toBe(true);
    }
    for (const s of SEPARABLES) {
      expect(hueco(s.perf[0], s.participio), s.inf).not.toBeNull();
      const aux = auxiliarDe(s.perf[0]);
      expect((s.aux === 'zijn' ? AUX_ZIJN : AUX_HEBBEN).has(aux ?? ''), `${s.inf}: ${aux ?? ''}`).toBe(true);
    }
  });

  it('los participios regulares siguen la regla de ’t kofschip', () => {
    for (const v of VERBOS) {
      if (v.irregular || !v.participio || !v.raiz) continue;
      const esperado = participioSinGe(v.inf, v.raiz);
      if (v.participio === `ge${esperado}`) continue;
      // Sin ge- solo si el verbo empieza por un prefijo que no lo lleva (betalen, verhuizen).
      expect(SIN_GE.test(v.inf), v.inf).toBe(true);
      expect(v.participio, v.inf).toBe(esperado);
    }
  });

  it('cada frase en pasado contiene la forma del pasado una vez', () => {
    for (const v of VERBOS) {
      if (!v.pasado || !v.pasadoEj) continue;
      const formas = v.pasado.flatMap((f) => f.split('/'));
      const encontradas = v.pasadoEj[0].split(/\s+/).filter((p) => formas.includes(p));
      expect(encontradas.length, v.inf).toBe(1);
    }
  });

  it('los separables dejan la partícula al final y el verbo conjugado dentro', () => {
    for (const s of SEPARABLES) {
      const fichas = s.presente.split('|');
      const particula = fichas[fichas.length - 1] ?? '';
      expect(s.inf.startsWith(particula), s.inf).toBe(true);
      expect(s.participio.startsWith(particula), s.inf).toBe(true);
    }
  });

  it('el presente tiene seis formas y el plural es el infinitivo', () => {
    for (const v of VERBOS) {
      if (!v.comp) continue;
      const f = formasPresente(v);
      expect(f.length, v.inf).toBe(6);
      expect(primera(f[3]), v.inf).toBe(v.inf);
    }
  });

  it('en el vocabulario no se repite ni el neerlandés ni el significado', () => {
    const nl = ELEMENTOS_VOCABULARIO.map((p) => p.nl);
    const es = ELEMENTOS_VOCABULARIO.map((p) => p.es);
    expect(new Set(nl).size).toBe(nl.length);
    expect(new Set(es).size).toBe(es.length);
  });

  it('el significado no chiva la palabra', () => {
    for (const p of ELEMENTOS_VOCABULARIO) {
      const palabrasEs = new Set(normalizar(p.es).split(' '));
      const nucleo = p.nl.replace(/^(de|het) /, '');
      expect(palabrasEs.has(normalizar(nucleo)), `${p.nl}: ${p.es}`).toBe(false);
    }
  });

  it('los sustantivos llevan artículo', () => {
    for (const p of ELEMENTOS_VOCABULARIO) {
      if (p.nl.startsWith('de ') || p.nl.startsWith('het ')) continue;
      expect(p.articulo, p.nl).toBeNull();
    }
  });
});

function comprobarEjercicio(ej: Ejercicio, donde: string): void {
  expect(ej.instruccion, donde).not.toBe('');
  switch (ej.forma) {
    case 'opcion': {
      expect(ej.opciones, donde).toContain(ej.respuestaCorrecta);
      const n = ej.opciones.map(normalizar);
      expect(new Set(n).size, donde).toBe(n.length);
      expect(ej.opciones.length, donde).toBeGreaterThanOrEqual(2);
      break;
    }
    case 'ordenar': {
      const enOrden = [...ej.fichas].sort((a, b) => a.id - b.id).map((f) => f.texto);
      expect(corregir(enOrden.join(' '), ej.validas).veredicto, donde).toBe('exacta');
      break;
    }
    case 'traducir':
    case 'dictado':
      expect(ej.respuestas.length, donde).toBeGreaterThan(0);
      expect(corregir(ej.respuestas[0] ?? '', ej.respuestas).veredicto, donde).toBe('exacta');
      break;
    case 'completar': {
      expect(ej.respuestas.length, donde).toBeGreaterThan(0);
      const entera = `${ej.antes}${ej.respuestas[0] ?? ''}${ej.despues}`;
      if (ej.audio) expect(normalizar(entera), donde).toBe(normalizar(ej.audio));
      break;
    }
    case 'decir':
      expect(ej.texto, donde).not.toBe('');
      break;
  }
}

describe('qué se enseña antes de preguntarlo', () => {
  it('en el orden de la frase se presenta la regla una vez por grupo, con un ejemplo que no es la frase que se pregunta', () => {
    const presentadas = ELEMENTOS_ORDEN.filter((e) => orden.presentar?.(e));
    expect(presentadas.map((e) => e.grupo)).toEqual([...GRUPOS_ORDEN]);
    for (const e of presentadas) {
      expect(orden.presentar?.(e)?.principal, e.id).not.toBe(e.frase);
      expect(orden.presentar?.(e)?.etiqueta, e.id).toMatch(/^Regla nueva/);
    }
  });

  it('en los verbos se enseña lo que no se deduce y lo regular solo al abrir su grupo', () => {
    for (const e of ELEMENTOS_VERBOS) {
      const presentado = verbos.presentar?.(e) != null;
      const regular = (e.grupo === 'presente' && e.verbo?.presente === undefined) || e.grupo === 'perfectum';
      const abre = ELEMENTOS_VERBOS.find((x) => x.grupo === e.grupo) === e;
      expect(presentado, e.id).toBe(!regular || abre);
    }
  });

  it('la regla de lo regular se enseña con otro verbo del grupo: ni el que la abre ni los demás que salen de ella', () => {
    for (const grupo of ['presente', 'perfectum'] as const) {
      const abre = ELEMENTOS_VERBOS.find((e) => e.grupo === grupo);
      if (!abre?.verbo) throw new Error(grupo);
      const ejemplo = EJEMPLO_DE_REGLA[grupo];
      expect(ejemplo, grupo).not.toBe(abre.verbo.inf);
      expect(ELEMENTOS_VERBOS.some((e) => e.grupo === grupo && e.verbo?.inf === ejemplo), grupo).toBe(true);
      const p = verbos.presentar?.(abre);
      expect(p?.etiqueta, grupo).toMatch(/^Regla nueva/);
      const palabras = new Set(normalizar([p?.principal, p?.audio, p?.detalle, ...(p?.tabla ?? []).flat(), ...(p?.ejemplos ?? []).map((x) => x.texto)].join(' ')).split(' '));
      for (const e of ELEMENTOS_VERBOS.filter((x) => x.grupo === grupo && x.verbo?.inf !== ejemplo)) {
        const v = e.verbo;
        if (!v || (grupo === 'presente' && v.presente !== undefined)) continue;
        const formas = grupo === 'presente' ? formasPresente(v).flatMap(alternativas) : [v.participio ?? ''];
        for (const f of formas) expect(palabras.has(normalizar(f)), `${grupo}: ${v.inf} (${f})`).toBe(false);
      }
    }
  });
});

describe('todos los ejercicios tienen una respuesta buena alcanzable', () => {
  const conjuntos: readonly ReadonlySet<Ejercicio['forma']>[] = [TODAS_LAS_FORMAS, new Set(['ordenar']), new Set(['opcion', 'completar'])];

  for (const pista of PISTAS) {
    it(pista.id, () => {
      let n = 0;
      for (const elemento of pista.elementos) {
        for (let repeticiones = 0; repeticiones <= 4; repeticiones++) {
          for (const formas of conjuntos) {
            for (let semilla = 1; semilla <= 4; semilla++) {
              const contexto: ContextoEjercicio = { azar: crearAzar(semilla * 31 + repeticiones), vistos: new Set(), repeticiones, formas };
              comprobarEjercicio(pista.crearEjercicio(elemento, contexto), `${pista.id}/${elemento.id} r${repeticiones} s${semilla}`);
              n++;
            }
          }
        }
        const presentacion = pista.presentar?.(elemento);
        if (presentacion) expect(presentacion.principal, elemento.id).not.toBe('');
      }
      expect(n).toBeGreaterThan(0);
    });
  }
});

/**
 * Las respuestas buenas de cada ejercicio de traducir, con dónde sale. Con `conVocabulario`, también las
 * palabras, que traen expresiones fijas («dank je wel») donde je no cambia.
 */
function respuestasAlTraducir(conVocabulario: boolean): [string, readonly string[]][] {
  const soloTraducir = new Set<Ejercicio['forma']>(['traducir']);
  const salida: [string, readonly string[]][] = [];
  for (const pista of PISTAS) {
    if (pista.id === 'vocabulario' && !conVocabulario) continue;
    for (const e of pista.elementos) {
      const ej = pista.crearEjercicio(e, contextoDe(1, 3, soloTraducir));
      if (ej.forma === 'traducir') salida.push([`${pista.id}/${e.id}`, ej.respuestas]);
    }
  }
  return salida;
}

/** Un contexto de ejercicio con lo justo: semilla, repeticiones y formas activas. */
function contextoDe(semilla: number, repeticiones: number, formas: ReadonlySet<Ejercicio['forma']>, vistos: ReadonlySet<string> = new Set()): ContextoEjercicio {
  return { azar: crearAzar(semilla), vistos, repeticiones, formas };
}

describe('lo que se da por bueno al responder', () => {
  it('al traducir valen las formas tónicas de los pronombres sin apuntarlas, pero solo donde son seguras', () => {
    expect(conFormasTonicas(['We gaan morgen.'])).toEqual(['We gaan morgen.', 'Wij gaan morgen.']);
    expect(conFormasTonicas(['Als het regent, blijven we binnen.'])).toContain('Als het regent, blijven wij binnen.');
    expect(conFormasTonicas(['Ze legt het uit.'])).toContain('Zij legt het uit.');
    expect(conFormasTonicas(['Kun je me helpen?'])).toEqual(['Kun je me helpen?', 'Kun je mij helpen?']);
    expect(conFormasTonicas(['Ze zegt dat we komen.'])).toEqual(
      expect.arrayContaining(['Zij zegt dat we komen.', 'Ze zegt dat wij komen.', 'Zij zegt dat wij komen.']) as unknown,
    );
    // Detrás del verbo «ze» también es objeto, «je» es también objeto y posesivo, y dentro de otras palabras no se toca nada.
    expect(conFormasTonicas(['Ik zie ze morgen.'])).toEqual(['Ik zie ze morgen.']);
    expect(conFormasTonicas(['Waar woont je zus?'])).toEqual(['Waar woont je zus?']);
    expect(conFormasTonicas(['Zeker twee keer mee.'])).toEqual(['Zeker twee keer mee.']);
    // Sin repetir lo que ya está.
    expect(conFormasTonicas(['We komen.', 'Wij komen.'])).toEqual(['We komen.', 'Wij komen.']);
  });

  it('en el orden de la frase, al traducir valen todas las formas apuntadas, y al dictar solo la que suena', () => {
    for (const f of ELEMENTOS_ORDEN) {
      const traducir = ejercicioDeFrase(f, 'traducir', contextoDe(1, 3, TODAS_LAS_FORMAS));
      const dictado = ejercicioDeFrase(f, 'dictado', contextoDe(1, 3, TODAS_LAS_FORMAS));
      if (traducir.forma !== 'traducir' || dictado.forma !== 'dictado') throw new Error(f.id);
      for (const v of f.validas) expect(corregir(v, traducir.respuestas).veredicto, `${f.id}: ${v}`).toBe('exacta');
      expect(dictado.respuestas, f.id).toEqual([dictado.dictar]);
    }
  });

  it('en el vocabulario, al dictar solo vale la palabra que suena', () => {
    for (const p of ELEMENTOS_VOCABULARIO) {
      const ej = vocabulario.crearEjercicio(p, contextoDe(1, 3, new Set(['dictado'])));
      if (ej.forma !== 'dictado') throw new Error(p.id);
      expect(ej.respuestas, p.id).toEqual([p.nl]);
    }
  });

  it('al traducir, poner un pronombre en su forma tónica nunca sale como fallo de orden', () => {
    // Si sale «orden», hay otra forma buena con las mismas palabras: falta apuntar esta.
    const TONICAS: Readonly<Record<string, readonly string[]>> = { ze: ['zij'], je: ['jij', 'jou', 'jouw'], we: ['wij'], me: ['mij'] };
    for (const [donde, respuestas] of respuestasAlTraducir(true)) {
      for (const r of respuestas) {
        const palabras = r.split(' ');
        palabras.forEach((p, i) => {
          const [, base = '', resto = ''] = /^(\p{L}+)(.*)$/u.exec(p) ?? [];
          // Con el mismo pronombre dos veces («ze zegt dat ze…», «heb je je sleutels?»), «orden» puede ser
          // solo que la tónica va en el otro, que tiene otro papel: esas frases se miran a mano.
          if (palabras.filter((x) => /^\p{L}+/u.exec(x)?.[0]?.toLowerCase() === base.toLowerCase()).length > 1) return;
          for (const t of TONICAS[base.toLowerCase()] ?? []) {
            const tonica = base[0] === base[0]?.toUpperCase() ? `${t[0]?.toUpperCase() ?? ''}${t.slice(1)}` : t;
            const cambiada = palabras.map((x, j) => (j === i ? `${tonica}${resto}` : x)).join(' ');
            expect(corregir(cambiada, respuestas).veredicto, `${donde}: ${cambiada}`).not.toBe('orden');
          }
        });
      }
    }
  });

  it('al traducir una frase, cada je tiene apuntada su forma tónica: jij, jou o jouw', () => {
    for (const [donde, respuestas] of respuestasAlTraducir(false)) {
      for (const r of respuestas) {
        const palabras = r.split(' ');
        palabras.forEach((p, i) => {
          const [, base = '', resto = ''] = /^(\p{L}+)(.*)$/u.exec(p) ?? [];
          // Un je reflexivo («hoe voel je je?») no tiene forma tónica: si alguna frase lo trae, se salta aquí
          // diciendo por qué, en vez de apuntar una forma que no existe.
          if (base.toLowerCase() !== 'je') return;
          const valen = ['jij', 'jou', 'jouw'].some((t) => {
            const tonica = base === 'Je' ? `${t[0]?.toUpperCase() ?? ''}${t.slice(1)}` : t;
            return corregir(palabras.map((x, j) => (j === i ? `${tonica}${resto}` : x)).join(' '), respuestas).veredicto === 'exacta';
          });
          expect(valen, `${donde}: ${r} (palabra ${String(i + 1)})`).toBe(true);
        });
      }
    }
  });

  it('en los separables, un complemento con preposición delante de la partícula también vale detrás', () => {
    // «ik sta om zeven uur op» y «ik sta op om zeven uur»: si una forma buena lo trae delante, la otra también vale.
    const PREPOSICION = /^(om|na|voor|met|in|op|naar|bij|tot|tijdens|van|uit|aan|over|sinds|vanaf|zonder|door|onder|achter|naast|tegen|rond) /;
    const frases = [
      ...ELEMENTOS_ORDEN.filter((f) => f.grupo === 'separables').map((f) => ({ donde: f.id, fichas: f.fichas, validas: f.validas })),
      ...SEPARABLES.map((s) => ({ donde: s.inf, fichas: s.presente.split('|'), validas: [s.presente.replaceAll('|', ' '), ...(s.otras ?? [])] })),
    ];
    for (const { donde, fichas, validas } of frases) {
      const buenas = new Set(validas.map(normalizar));
      const particula = normalizar(fichas.at(-1) ?? '');
      for (const complemento of fichas.map(normalizar).filter((f) => PREPOSICION.test(f))) {
        for (const v of buenas) {
          if (!v.endsWith(` ${complemento} ${particula}`)) continue;
          const detras = `${v.slice(0, -(complemento.length + particula.length + 1))}${particula} ${complemento}`;
          expect(buenas.has(detras), `${donde}: ${detras}`).toBe(true);
        }
      }
    }
  });

  it('al traducir un verbo valen sus otras formas, y cada una lleva la forma que se practica', () => {
    for (const v of VERBOS) {
      for (const o of v.perfOtras ?? []) {
        expect(hueco(o, v.participio ?? ''), `${v.inf}: ${o}`).not.toBeNull();
        expect(normalizar(o), v.inf).not.toBe(normalizar(v.perf?.[0] ?? ''));
      }
      const pasado = [...alternativas(v.pasado?.[0] ?? ''), ...alternativas(v.pasado?.[1] ?? '')];
      for (const o of v.pasadoOtras ?? []) {
        expect(pasado.some((f) => hueco(o, f) !== null), `${v.inf}: ${o}`).toBe(true);
        expect(normalizar(o), v.inf).not.toBe(normalizar(v.pasadoEj?.[0] ?? ''));
      }
    }
    const soloTraducir = new Set<Ejercicio['forma']>(['traducir']);
    for (const e of ELEMENTOS_VERBOS) {
      const v = e.verbo;
      if (!v || e.separable) continue;
      const otras = e.grupo === 'pasado' ? v.pasadoOtras : e.grupo === 'presente' ? undefined : v.perfOtras;
      if (!otras) continue;
      const ej = verbos.crearEjercicio(e, contextoDe(1, 2, soloTraducir));
      if (ej.forma !== 'traducir') throw new Error(e.id);
      for (const o of otras) expect(corregir(o, ej.respuestas).veredicto, `${e.id}: ${o}`).toBe('exacta');
    }
  });
});

describe('decir la frase', () => {
  it('enseña con la frase todas las formas que valdrían al escribirla, y el nivel de su regla para la cuenta atrás', () => {
    const conDominio: ContextoEjercicio = { ...contextoDe(1, 3, new Set(['decir'])), dominio: () => 0.9 };
    for (const f of ELEMENTOS_ORDEN) {
      const e = ejercicioDeFrase(f, 'decir', conDominio);
      if (e.forma !== 'decir') throw new Error(f.codigo);
      expect([e.texto, ...(e.otras ?? [])], f.codigo).toEqual(f.validas);
      expect(e.dominio, f.codigo).toBe(0.9);
    }
    let dichas = 0;
    for (const e of ELEMENTOS_VERBOS.filter((x) => x.grupo === 'perfectum' || x.grupo === 'perfectum-irregular')) {
      for (let semilla = 1; semilla <= 40; semilla++) {
        const ej = verbos.crearEjercicio(e, { ...contextoDe(semilla, 3, new Set(['decir'])), dominio: () => 0.3 });
        if (ej.forma !== 'decir') continue;
        dichas++;
        const traducir = verbos.crearEjercicio(e, contextoDe(semilla, 3, new Set(['traducir'])));
        if (traducir.forma !== 'traducir') throw new Error(e.id);
        // Al traducir también valen las formas tónicas de los pronombres; al decir se enseñan las apuntadas.
        for (const forma of [ej.texto, ...(ej.otras ?? [])]) expect(traducir.respuestas, `${e.id}: ${forma}`).toContain(forma);
        expect(ej.dominio, e.id).toBe(0.3);
      }
    }
    expect(dichas).toBeGreaterThan(0);
  });
});

describe('lo que se ofrece como opción', () => {
  it('las opciones malas se toman en el orden en que llegan, sin repetir', () => {
    for (let semilla = 1; semilla <= 20; semilla++) {
      const opciones = opcionesCon('a', ['b', 'c', 'B', 'd', 'e', 'f'], crearAzar(semilla), 4);
      expect([...opciones].sort(), String(semilla)).toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('en el pasado, las opciones malas son formas del verbo y ninguna es también buena', () => {
    for (const e of ELEMENTOS_VERBOS.filter((x) => x.grupo === 'pasado')) {
      const v = e.verbo;
      if (!v?.pasado || !v.pasadoEj) throw new Error(e.id);
      const singular = alternativas(v.pasado[0]);
      const plural = alternativas(v.pasado[1]);
      const presente = v.presente !== undefined || v.raiz !== undefined ? formasPresente(v).flatMap(alternativas) : [];
      const conocidas = new Set([...singular, ...plural, v.participio ?? '', ...presente]);
      const palabras = v.pasadoEj[0].split(/\s+/);
      const buenas = singular.some((f) => palabras.includes(f)) ? singular : plural;
      for (let semilla = 1; semilla <= 8; semilla++) {
        const ej = verbos.crearEjercicio(e, contextoDe(semilla, 2, new Set(['opcion'])));
        if (ej.forma !== 'opcion') throw new Error(e.id);
        for (const o of ej.opciones) {
          expect(conocidas.has(o), `${e.id}: ${o}`).toBe(true);
          if (o !== ej.respuestaCorrecta) expect(buenas, `${e.id}: ${o}`).not.toContain(o);
        }
      }
    }
  });

  it('las palabras parecidas no salen como opción mala la una de la otra', () => {
    const todas = new Set(ELEMENTOS_VOCABULARIO.map((p) => p.id));
    for (const p of ELEMENTOS_VOCABULARIO) {
      for (const nl of p.parecidas) expect(ELEMENTOS_VOCABULARIO.some((q) => q.nl === nl), `${p.nl}: ${nl}`).toBe(true);
      const parecidas = ELEMENTOS_VOCABULARIO.filter((q) => p.parecidas.includes(q.nl) || q.parecidas.includes(p.nl));
      if (parecidas.length === 0) continue;
      for (let repeticiones = 0; repeticiones <= 1; repeticiones++) {
        for (let semilla = 1; semilla <= 30; semilla++) {
          const ej = vocabulario.crearEjercicio(p, contextoDe(semilla, repeticiones, TODAS_LAS_FORMAS, todas));
          if (ej.forma !== 'opcion') continue;
          for (const q of parecidas) {
            expect(ej.opciones, p.nl).not.toContain(q.es);
            expect(ej.opciones, p.nl).not.toContain(q.nl);
          }
        }
      }
    }
  });

  it('las expresiones que empiezan por het no se preguntan con de o het ni piden artículo', () => {
    for (const nl of ['het valt mee', 'het spijt me']) {
      const p = ELEMENTOS_VOCABULARIO.find((x) => x.nl === nl);
      expect(p?.articulo, nl).toBeNull();
      expect(p?.sustantivo, nl).toBe(false);
    }
    for (const p of ELEMENTOS_VOCABULARIO) {
      if (p.sustantivo) expect(p.nl, p.id).toMatch(/^(de|het) /);
    }
  });

  it('en los repasos, elegir solo sale si las opciones están activadas, y el presente se elige si completar no lo está', () => {
    const sinOpcion = new Set<Ejercicio['forma']>(['traducir', 'completar', 'ordenar', 'decir']);
    for (const p of ELEMENTOS_VOCABULARIO) {
      expect(vocabulario.crearEjercicio(p, contextoDe(1, 1, sinOpcion)).forma, p.id).not.toBe('opcion');
    }
    for (const e of ELEMENTOS_VERBOS.filter((x) => x.grupo === 'presente')) {
      for (let semilla = 1; semilla <= 6; semilla++) {
        expect(verbos.crearEjercicio(e, contextoDe(semilla, 2, sinOpcion)).forma, e.id).not.toBe('opcion');
        expect(verbos.crearEjercicio(e, contextoDe(semilla, 2, new Set(['opcion', 'traducir']))).forma, e.id).toBe('opcion');
      }
    }
  });
});

describe('las reglas', () => {
  it('los ejemplos de las reglas no son frases que la app pregunta', () => {
    const preguntadas = new Set(
      [
        ...ELEMENTOS_ORDEN.flatMap((f) => f.validas),
        ...SEPARABLES.flatMap((s) => [s.presente.replaceAll('|', ' '), ...(s.otras ?? []), s.perf[0]]),
        ...VERBOS.flatMap((v) => [...(v.perf ? [v.perf[0]] : []), ...(v.perfOtras ?? []), ...(v.pasadoEj ? [v.pasadoEj[0]] : []), ...(v.pasadoOtras ?? [])]),
      ].map(normalizar),
    );
    for (const [grupo, regla] of [...Object.entries(REGLAS_ORDEN), ...Object.entries(REGLAS_VERBOS)]) {
      for (const [, ejemplo = ''] of regla.matchAll(/«([^»]+)»/g)) {
        expect(preguntadas.has(normalizar(ejemplo)), `${grupo}: ${ejemplo}`).toBe(false);
      }
    }
  });
});

describe('nada en neerlandés se queda sin traducir', () => {
  it('cada verbo de presente trae su frase en español', () => {
    for (const v of VERBOS.filter((x) => x.comp !== undefined)) {
      expect(v.compEs, v.inf).toBeTruthy();
      expect(v.presenteEs?.filter((f) => f.trim() !== '').length, v.inf).toBe(6);
    }
    const werken = VERBOS.find((v) => v.inf === 'werken');
    const padres = SUJETOS.find((s) => s.nl === 'mijn ouders');
    if (!werken || !padres) throw new Error('faltan werken o mijn ouders');
    expect(frasePresenteEs(werken, padres)).toBe('Mis padres trabajan en casa.');
    expect(preguntaPresenteEs(werken)).toBe('¿Trabajas en casa?');
  });

  it('todo ejercicio con una frase en neerlandés dice qué significa', () => {
    const conjuntos: readonly ReadonlySet<Ejercicio['forma']>[] = [TODAS_LAS_FORMAS, ...[...TODAS_LAS_FORMAS].map((f) => new Set([f]))];
    for (const pista of PISTAS) {
      for (const elemento of pista.elementos) {
        for (const repeticiones of [0, 1, 2, 3, 5]) {
          for (const formas of conjuntos) {
            for (let semilla = 1; semilla <= 6; semilla++) {
              const ej = pista.crearEjercicio(elemento, contextoDe(semilla, repeticiones, formas));
              const donde = `${pista.id}/${elemento.id} ${ej.tipo}`;
              // Si las opciones están en español, la buena ya es la traducción.
              if (ej.forma === 'opcion' && ej.enunciadoEnIdioma && ej.opcionesEnIdioma) expect(ej.significado, donde).toBeTruthy();
              if (ej.forma === 'completar') expect(ej.significado, donde).toBeTruthy();
              if (ej.forma !== 'opcion') expect(ej.significado, donde).toBeTruthy();
            }
          }
        }
      }
    }
  });

  it('lo que suena al presentar algo se ve en pantalla con su traducción', () => {
    for (const pista of PISTAS) {
      for (const elemento of pista.elementos) {
        const p = pista.presentar?.(elemento);
        if (!p) continue;
        const donde = `${pista.id}/${elemento.id}`;
        for (const e of p.ejemplos ?? []) expect(e.significado.trim(), `${donde}: ${e.texto}`).not.toBe('');
        if (p.audio === undefined) continue;
        const visible = p.audio === p.principal ? p.significado : p.ejemplos?.find((e) => e.texto === p.audio)?.significado;
        expect(visible, donde).toBeTruthy();
      }
    }
  });
});
