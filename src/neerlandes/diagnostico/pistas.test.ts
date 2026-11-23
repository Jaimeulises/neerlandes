import { describe, expect, it } from 'vitest';
import { crearAzar, normalizar, type Diagnostico, type Ejercicio } from '../../motor';
import { alternativas } from '../comun';
import { ELEMENTOS_ORDEN, ejercicioDeFrase, orden } from '../orden/pista';
import { VERBOS } from '../verbos/datos';
import { formasPresente, SUJETOS, verbos } from '../verbos/pista';
import { vocabulario } from '../vocabulario/pista';
import { diagnosticarEjemplos } from './ejemplos';
import { PISTAS_GENERALES, pistasDeReintento } from './pistas';
import { explicarConjugacion, explicarParticipio } from './verbo';

const contexto = { azar: crearAzar(1), vistos: new Set<string>(), repeticiones: 1, formas: new Set(['traducir'] as const) };

/** Si la palabra sale entera en el texto (no como trozo de otra). */
function contienePalabra(texto: string, palabra: string): boolean {
  return normalizar(texto).split(' ').includes(normalizar(palabra));
}

function comprobarPista(d: Diagnostico, prohibidas: readonly string[], donde: string): void {
  expect(d.pista, `${donde}: ${d.titulo}`).toBeTruthy();
  const pista = d.pista ?? '';
  // Una pregunta al final: la pista pide que se intente, no lo explica todo.
  expect(pista.trim().endsWith('?') || pista.includes('¿'), `${donde}: ${pista}`).toBe(true);
  for (const p of prohibidas) expect(contienePalabra(pista, p), `${donde}: «${p}» en «${pista}»`).toBe(false);
}

describe('las pistas del segundo intento', () => {
  it('cada fallo de orden trae su pista, y ninguna dice la frase buena', () => {
    const azar = crearAzar(5);
    for (const f of ELEMENTOS_ORDEN) {
      const ejercicio = ejercicioDeFrase(f, 'ordenar', contexto);
      for (let i = 0; i < 12; i++) {
        const respuesta = azar.barajar(f.fichas).join(' ');
        for (const d of orden.diagnosticar?.(ejercicio, respuesta) ?? []) {
          expect(d.pista, `${f.codigo} ${respuesta}: ${d.titulo}`).toBeTruthy();
          for (const v of f.validas) expect(normalizar(d.pista ?? ''), `${f.codigo}: ${d.pista ?? ''}`).not.toContain(normalizar(v));
        }
      }
    }
  });

  it('las pistas del presente no dan la forma buena', () => {
    for (const v of VERBOS.filter((x) => x.comp !== undefined)) {
      const formas = formasPresente(v).map((f) => alternativas(f)[0] ?? f);
      for (const s of SUJETOS) {
        const esperada = formas[s.i] ?? '';
        // Las formas de las otras personas y el infinitivo: lo que se pone por error.
        for (const dada of new Set([...formas, v.inf, `${formas[0] ?? ''}t`])) {
          if (dada === esperada) continue;
          const d = explicarConjugacion(esperada, dada, s.nl.split(' '), false);
          if (d) comprobarPista(d, [esperada], `${v.inf} ${s.nl} ${dada}`);
        }
      }
    }
  });

  it('las pistas del pasado no dan la forma buena', () => {
    for (const v of VERBOS.filter((x) => x.pasado !== undefined)) {
      const [singular = '', plural = ''] = (v.pasado ?? []).map((f) => alternativas(f)[0] ?? f);
      const presente = formasPresente(v);
      for (const [esperada, sujeto] of [
        [singular, ['ik']],
        [plural, ['we']],
      ] as const) {
        for (const dada of new Set([singular, plural, presente[0], v.inf, esperada.replace(/te(n?)$/, 'de$1'), esperada.replace(/de(n?)$/, 'te$1')])) {
          if (dada === esperada) continue;
          const d = explicarConjugacion(esperada, dada, sujeto, false);
          if (d) comprobarPista(d, [esperada], `${v.inf} ${sujeto.join(' ')} ${dada}`);
        }
      }
    }
  });

  it('las pistas del participio no dan el participio', () => {
    for (const v of VERBOS.filter((x) => x.participio !== undefined)) {
      const esperado = v.participio ?? '';
      const raiz = v.raiz ?? v.inf.replace(/en$/, '');
      const intentos = [`ge${raiz}t`, `ge${raiz}d`, esperado.replace(/^ge/, ''), `ge${esperado}`, `${esperado}t`, `${esperado}d`, `ge${v.inf}`];
      for (const dado of new Set(intentos)) {
        if (dado === esperado) continue;
        const d = explicarParticipio(esperado, dado);
        if (d) comprobarPista(d, [esperado], `${v.inf} ${dado}`);
      }
    }
  });

  it('los ejemplos de revision.md traen su pista, salvo los del vocabulario, que no se reintenta', () => {
    for (const e of diagnosticarEjemplos()) for (const d of e.diagnosticos) if (d.destreza !== 'articulo') comprobarPista(d, [], `${e.codigo} ${e.respuesta}`);
  });
});

describe('cuándo se pide otro intento', () => {
  const frase = ELEMENTOS_ORDEN[0];
  if (!frase) throw new Error('sin frases');
  const traducir = ejercicioDeFrase(frase, 'traducir', contexto);
  const ordenar = ejercicioDeFrase(frase, 'ordenar', contexto);
  const dictado = ejercicioDeFrase(frase, 'dictado', contexto);
  const decir = ejercicioDeFrase(frase, 'decir', contexto);
  const completar: Ejercicio = { forma: 'completar', tipo: 'prueba', elementoId: 'x', instruccion: '', antes: 'Hij ', despues: ' thuis.', pista: 'werken', respuestas: ['werkt'] };
  const conPista: Diagnostico = { destreza: 'inversion', titulo: 't', texto: 'x', pista: 'Una pista. ¿Dónde va?' };

  it('con un diagnóstico, su pista; sin él, una general según el ejercicio y el fallo', () => {
    expect(pistasDeReintento(traducir, [conPista], 'orden')).toEqual(['Una pista. ¿Dónde va?']);
    expect(pistasDeReintento(ordenar, [], 'orden')).toEqual([PISTAS_GENERALES.ordenar]);
    expect(pistasDeReintento(traducir, [], 'orden')).toEqual([PISTAS_GENERALES.traducirOrden]);
    expect(pistasDeReintento(traducir, [], 'distinta')).toEqual([PISTAS_GENERALES.traducir]);
    expect(pistasDeReintento(completar, [], 'distinta')).toEqual([PISTAS_GENERALES.completar]);
  });

  it('como mucho dos pistas, sin repetir', () => {
    const otras = [conPista, conPista, { ...conPista, destreza: 'presente', pista: 'Otra. ¿Cuál?' }, { ...conPista, destreza: 'niet', pista: 'Y otra. ¿Dónde?' }];
    expect(pistasDeReintento(traducir, otras, 'distinta')).toEqual(['Una pista. ¿Dónde va?', 'Otra. ¿Cuál?']);
  });

  it('no se reintenta lo que está bien, el dictado, decir ni las opciones', () => {
    expect(pistasDeReintento(traducir, [], 'exacta')).toEqual([]);
    expect(pistasDeReintento(traducir, [], 'tildes')).toEqual([]);
    expect(pistasDeReintento(dictado, [], 'distinta')).toEqual([]);
    expect(pistasDeReintento(decir, [], 'distinta')).toEqual([]);
    const opcion: Ejercicio = { forma: 'opcion', tipo: 'prueba', elementoId: 'x', instruccion: '', enunciado: 'x', enunciadoEnIdioma: true, opciones: ['a', 'b'], opcionesEnIdioma: true, respuestaCorrecta: 'a' };
    expect(pistasDeReintento(opcion, [], 'distinta')).toEqual([]);
  });

  it('el orden y los verbos piden otro intento; el vocabulario no, que la pista daría la palabra', () => {
    expect('pistasDeReintento' in orden).toBe(true);
    expect('pistasDeReintento' in verbos).toBe(true);
    expect('pistasDeReintento' in vocabulario).toBe(false);
  });
});
