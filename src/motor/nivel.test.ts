import { describe, expect, it } from 'vitest';
import { crearAzar } from './azar';
import type { Destreza, Ejercicio, Elemento, Pista } from './contratos';
import type { Historial, Respuesta } from './historial';
import { dominioDe, estimarNivel, nivelPorDestreza, UMBRAL_DOMINADA } from './nivel';
import { deserializarHistorial, serializarHistorial } from './persistencia';
import { PROGRESO_VACIO, registrarRespuesta } from './repaso';
import { construirRonda, practicarDestreza } from './ronda';

function respuestas(n: number, r: Omit<Respuesta, 't'>, desde = 0): Respuesta[] {
  return Array.from({ length: n }, (_, i) => ({ ...r, t: desde + i * 1000 }));
}

describe('nivel por destreza', () => {
  it('sin destrezas en el historial no hay nivel', () => {
    expect(nivelPorDestreza([{ t: 1, k: 'a/b', c: 'bien', f: 'traducir' }]).size).toBe(0);
  });

  it('dos aciertos no bastan para darla por dominada; muchos sí', () => {
    const pocos = nivelPorDestreza(respuestas(2, { k: 'orden/x', c: 'bien', f: 'traducir', d: ['inversion'] }));
    expect(dominioDe(pocos)('inversion')).toBeNull();
    const muchos = nivelPorDestreza(respuestas(12, { k: 'orden/x', c: 'bien', f: 'traducir', d: ['inversion'] }));
    expect(dominioDe(muchos)('inversion')).toBeGreaterThanOrEqual(UMBRAL_DOMINADA);
  });

  it('escribir la frase pesa más que ordenar fichas', () => {
    const ordenando = nivelPorDestreza(respuestas(6, { k: 'orden/x', c: 'bien', f: 'ordenar', d: ['modal'] }));
    const escribiendo = nivelPorDestreza(respuestas(6, { k: 'orden/x', c: 'bien', f: 'traducir', d: ['modal'] }));
    expect(escribiendo.get('modal')?.dominio ?? 0).toBeGreaterThan(ordenando.get('modal')?.dominio ?? 0);
  });

  it('lo reciente pesa más: fallar ahora baja más que haber fallado antes', () => {
    const bien = { k: 'orden/x', c: 'bien', f: 'traducir', d: ['niet'] } as const;
    const mal = { k: 'orden/x', c: 'otra_vez', f: 'traducir', d: ['niet'] } as const;
    const falloAntiguo: Historial = [...respuestas(4, mal), ...respuestas(8, bien, 10_000)];
    const falloReciente: Historial = [...respuestas(8, bien), ...respuestas(4, mal, 10_000)];
    expect(nivelPorDestreza(falloAntiguo).get('niet')?.dominio ?? 0).toBeGreaterThan(nivelPorDestreza(falloReciente).get('niet')?.dominio ?? 0);
  });

  it('un fallo con diagnóstico solo le cuenta a la destreza fallada', () => {
    const niveles = nivelPorDestreza([{ t: 1, k: 'orden/x', c: 'otra_vez', f: 'traducir', d: ['inversion'], x: ['presente'] }]);
    expect(niveles.has('inversion')).toBe(false);
    expect(niveles.get('presente')?.aciertos).toBe(0);
  });

  it('un fallo sin diagnóstico le cuenta a todas las del ejercicio', () => {
    const niveles = nivelPorDestreza([{ t: 1, k: 'verbos/x', c: 'otra_vez', f: 'traducir', d: ['participio', 'auxiliar'] }]);
    expect([...niveles.keys()].sort()).toEqual(['auxiliar', 'participio']);
  });

  it('el historial guarda y lee las destrezas', () => {
    const h: Historial = [{ t: 1, k: 'orden/x', c: 'otra_vez', f: 'traducir', d: ['inversion'], x: ['presente'] }, { t: 2, k: 'orden/y', c: 'bien', f: 'ordenar' }];
    expect(deserializarHistorial(serializarHistorial(h))).toEqual(h);
  });
});

describe('nivel estimado', () => {
  const destrezas: Destreza[] = [
    { id: 'a', nombre: 'A', nivel: 'A2', descripcion: '' },
    { id: 'b', nombre: 'B', nivel: 'A2', descripcion: '' },
    { id: 'c', nombre: 'C', nivel: 'B1', descripcion: '' },
  ];
  const dominada = (id: string): Respuesta[] => respuestas(12, { k: 'p/x', c: 'bien', f: 'traducir', d: [id] });

  it('un nivel se alcanza con todas sus destrezas dominadas', () => {
    expect(estimarNivel(destrezas, nivelPorDestreza(dominada('a')))).toEqual({ alcanzado: null, siguiente: 'A2', dominadasDelSiguiente: 1, totalDelSiguiente: 2 });
    expect(estimarNivel(destrezas, nivelPorDestreza([...dominada('a'), ...dominada('b')]))).toMatchObject({ alcanzado: 'A2', siguiente: 'B1' });
  });
});

interface Cosa extends Elemento {
  readonly destreza: string;
}

const pista: Pista<Cosa> = {
  id: 'cosas',
  nombre: 'Cosas',
  descripcion: '',
  grupos: ['g'],
  elementos: [
    { id: 'uno', grupo: 'g', destreza: 'x' },
    { id: 'dos', grupo: 'g', destreza: 'x' },
    { id: 'tres', grupo: 'g', destreza: 'y' },
  ],
  crearEjercicio: (e): Ejercicio => ({ forma: 'decir', tipo: 'cosas.decir', elementoId: e.id, instruccion: '', significado: '', texto: e.id }),
  destrezasDe: (e) => [e.destreza],
};

describe('practicar una destreza en caliente', () => {
  const ahora = new Date(2026, 10, 20, 10);
  let progreso = PROGRESO_VACIO;
  for (const e of pista.elementos) progreso = registrarRespuesta(progreso, pista.id, e.id, 'bien', ahora);

  it('elige otro elemento visto con la misma destreza', () => {
    const paso = practicarDestreza(pista, 'x', new Set(['uno']), progreso, crearAzar(1));
    expect(paso?.ejercicio.elementoId).toBe('dos');
    expect(paso?.practica).toBe('x');
    expect(paso?.ejercicio.destrezas).toEqual(['x']);
  });

  it('null si no queda ninguno', () => {
    expect(practicarDestreza(pista, 'y', new Set(['tres']), progreso, crearAzar(1))).toBeNull();
  });

  it('sin nada visto, vale algo nuevo de un grupo abierto que no necesite presentación', () => {
    expect(practicarDestreza(pista, 'x', new Set(['uno']), PROGRESO_VACIO, crearAzar(1))?.ejercicio.elementoId).toBe('dos');
    const conPresentacion: Pista<Cosa> = { ...pista, presentar: () => ({ principal: '', nota: null }) };
    expect(practicarDestreza(conPresentacion, 'x', new Set(['uno']), PROGRESO_VACIO, crearAzar(1))).toBeNull();
  });

  it('los ejercicios de la ronda traen las destrezas del elemento', () => {
    const pasos = construirRonda(pista, PROGRESO_VACIO, ahora, crearAzar(1));
    expect(pasos.map((p) => p.ejercicio.destrezas)).toEqual([['x'], ['x'], ['y']]);
  });
});
