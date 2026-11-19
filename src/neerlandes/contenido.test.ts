// Comprueba el contenido: que cada frase de ejemplo contenga la forma que se
// pregunta, que los participios regulares sigan la regla, que no haya
// significados repetidos y que cada ejercicio que se puede crear tenga una
// respuesta buena alcanzable. Si una corrección de una persona nativa rompe
// algo, salta aquí.

import { describe, expect, it } from 'vitest';
import { corregir, crearAzar, normalizar, TODAS_LAS_FORMAS, validarPista, type ContextoEjercicio, type Ejercicio } from '../motor';
import { hueco, primera } from './comun';
import { FRASES, GRUPOS_ORDEN } from './orden/datos';
import { ELEMENTOS_ORDEN, orden } from './orden/pista';
import { PISTAS } from './paquete';
import { SEPARABLES, VERBOS } from './verbos/datos';
import { ELEMENTOS_VERBOS, formasPresente, verbos } from './verbos/pista';
import { ELEMENTOS_VOCABULARIO } from './vocabulario/pista';

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
    ...VERBOS.flatMap((v) => [v.inf, v.es, ...(v.perf ?? []), ...(v.pasadoEj ?? []), v.nota ?? '', v.comp ?? '']),
    ...SEPARABLES.flatMap((s) => [s.inf, s.es, s.presente, s.presenteEs, ...s.perf]),
    ...ELEMENTOS_VOCABULARIO.flatMap((p) => [p.nl, p.es, p.nota ?? '']),
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
