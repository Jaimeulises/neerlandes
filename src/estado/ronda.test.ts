// Cómo se arma la ronda de hoy: lo nuevo se reparte entre las pistas que tienen algo que dar y va
// detrás de los repasos, con lo que abre cada grupo (la regla) antes que lo que sale de ella.

import { describe, expect, it } from 'vitest';
import { clave, crearAzar, PROGRESO_VACIO, registrarRespuesta, RONDA_POR_DEFECTO, TODAS_LAS_FORMAS, type OpcionesRonda, type Pista, type Progreso } from '../motor';
import { PISTAS } from '../neerlandes/paquete';
import { verbos } from '../neerlandes/verbos/pista';
import { vocabulario } from '../neerlandes/vocabulario/pista';
import { AJUSTES_POR_DEFECTO, NUEVOS_POR_RONDA } from './ajustes';
import { construirRondaDe, opcionesDeRonda, preverRonda, repartir, type PasoMixto } from './ronda';

const AHORA = new Date(2026, 10, 19, 12);
const OPCIONES: OpcionesRonda = { ...RONDA_POR_DEFECTO, tamano: 12, nuevosMaximo: 4 };

function esNuevoEn(progreso: Progreso): (p: PasoMixto) => boolean {
  return (p) => !progreso.has(clave(p.pistaId, p.paso.ejercicio.elementoId));
}

describe('repartir lo nuevo', () => {
  it('reparte en rueda, empezando donde toca, y lo que una parte no puede usar pasa a las demás', () => {
    expect(repartir(4, [9, 9, 9])).toEqual([2, 1, 1]);
    expect(repartir(4, [9, 9, 9], 1)).toEqual([1, 2, 1]);
    expect(repartir(4, [0, 9, 9])).toEqual([0, 2, 2]);
    expect(repartir(4, [1, 0, 9])).toEqual([1, 0, 3]);
    expect(repartir(6, [1, 1, 1])).toEqual([1, 1, 1]);
    expect(repartir(0, [9, 9])).toEqual([0, 0]);
    expect(repartir(3, [])).toEqual([]);
  });
});

describe('la ronda de hoy', () => {
  it('sin progreso, lo primero de cada pista es lo que abre su grupo, con su presentación', () => {
    const pasos = construirRondaDe(PISTAS, PROGRESO_VACIO, AHORA, crearAzar(7), { ...OPCIONES, nuevosMaximo: 6 });
    for (const pista of PISTAS) {
      const suyos = pasos.filter((p) => p.pistaId === pista.id);
      expect(suyos.length, pista.id).toBeGreaterThan(0);
      expect(suyos[0]?.paso.presentacion, pista.id).not.toBeNull();
    }
  });

  it('con repasos pendientes, lo nuevo va detrás y la frase que abre el grupo antes que las que salen de su regla', () => {
    let progreso: Progreso = PROGRESO_VACIO;
    const haceDias = new Date(2026, 10, 10, 12);
    for (const p of vocabulario.elementos.slice(0, 3)) progreso = registrarRespuesta(progreso, 'vocabulario', p.id, 'bien', haceDias);
    const esNuevo = esNuevoEn(progreso);
    for (let semilla = 1; semilla <= 5; semilla++) {
      const pasos = construirRondaDe(PISTAS, progreso, AHORA, crearAzar(semilla), { ...OPCIONES, nuevosMaximo: 6 });
      const primerNuevo = pasos.findIndex(esNuevo);
      expect(primerNuevo, String(semilla)).toBeGreaterThan(0);
      expect(pasos.slice(primerNuevo).every(esNuevo), String(semilla)).toBe(true);
      const deOrden = pasos.filter((p) => p.pistaId === 'orden');
      expect(deOrden.length, String(semilla)).toBeGreaterThan(1);
      expect(deOrden[0]?.paso.presentacion, String(semilla)).not.toBeNull();
    }
  });

  it('si una pista no tiene nada nuevo que dar, su parte de lo nuevo pasa a las demás', () => {
    let progreso: Progreso = PROGRESO_VACIO;
    for (const p of vocabulario.elementos) progreso = registrarRespuesta(progreso, 'vocabulario', p.id, 'bien', AHORA);
    const nuevos = construirRondaDe(PISTAS, progreso, AHORA, crearAzar(5), OPCIONES).filter(esNuevoEn(progreso));
    expect(nuevos.length).toBe(4);
    expect(nuevos.some((p) => p.pistaId === 'vocabulario')).toBe(false);
    expect(preverRonda(PISTAS, progreso, AHORA, OPCIONES)).toEqual({ repasos: 0, nuevos: 4 });
  });

  it('si los repasos dejan poco sitio, lo nuevo que cabe no es siempre de las mismas pistas', () => {
    let progreso: Progreso = PROGRESO_VACIO;
    const haceDias = new Date(2026, 10, 10, 12);
    for (const p of vocabulario.elementos.slice(0, 10)) progreso = registrarRespuesta(progreso, 'vocabulario', p.id, 'bien', haceDias);
    const primeros = [0, 1, 2].map((dia) => {
      const ahora = new Date(2026, 10, 19 + dia, 12);
      const nuevos = construirRondaDe(PISTAS, progreso, ahora, crearAzar(3), OPCIONES).filter(esNuevoEn(progreso));
      // 10 repasos en una ronda de 12: solo caben 2 cosas nuevas.
      expect(nuevos.length, String(dia)).toBe(2);
      return nuevos[0]?.pistaId;
    });
    expect(new Set(primeros).size).toBe(3);
  });

  it('con todos los grupos abiertos, cada ronda abre como mucho un grupo nuevo de cada parte y en pocas rondas han empezado todos', () => {
    const empezados = (pista: Pista, progreso: Progreso): Set<string> =>
      new Set(pista.elementos.filter((e) => progreso.has(clave(pista.id, e.id))).map((e) => e.grupo));
    /** Rondas de hoy acertándolo todo, con los ajustes de la app; de cada ronda, cuántos grupos ha empezado cada parte. */
    const jugar = (gruposAbiertos: boolean, nuevosPorRonda: number, rondas: number): { progreso: Progreso; abiertos: Record<string, number>[] } => {
      let progreso: Progreso = PROGRESO_VACIO;
      const abiertos: Record<string, number>[] = [];
      for (let i = 0; i < rondas; i++) {
        const opciones = opcionesDeRonda({ ...AJUSTES_POR_DEFECTO, gruposAbiertos, nuevosPorRonda }, TODAS_LAS_FORMAS);
        const nuevos = construirRondaDe(PISTAS, progreso, AHORA, crearAzar(i + 1), opciones).filter(esNuevoEn(progreso));
        const porParte = PISTAS.map((pista) => {
          const antes = empezados(pista, progreso);
          const suyos = new Set(nuevos.filter((p) => p.pistaId === pista.id).map((p) => pista.elementos.find((e) => e.id === p.paso.ejercicio.elementoId)?.grupo));
          return [pista.id, [...suyos].filter((g) => g !== undefined && !antes.has(g)).length] as const;
        });
        abiertos.push(Object.fromEntries(porParte));
        for (const p of nuevos) progreso = registrarRespuesta(progreso, p.pistaId, p.paso.ejercicio.elementoId, 'bien', AHORA);
      }
      return { progreso, abiertos };
    };
    for (const nuevosPorRonda of NUEVOS_POR_RONDA) {
      for (const [i, ronda] of jugar(true, nuevosPorRonda, 10).abiertos.entries()) {
        for (const pista of PISTAS) expect(ronda[pista.id], `${pista.id}, ronda ${String(i + 1)} con ${String(nuevosPorRonda)} nuevos`).toBeLessThanOrEqual(1);
      }
    }
    // El límite es de cada parte, no de la ronda: con el interruptor o sin él, la primera ronda ya empieza un grupo de cada una.
    const unoDeCada = Object.fromEntries(PISTAS.map((p) => [p.id, 1]));
    expect(jugar(true, 4, 1).abiertos).toEqual([unoDeCada]);
    expect(jugar(false, 4, 1).abiertos).toEqual([unoDeCada]);
    // En pocas rondas han empezado todos los grupos de todas las partes; en orden, solo los primeros.
    const conInterruptor = jugar(true, 4, 8).progreso;
    for (const pista of PISTAS) expect(empezados(pista, conInterruptor).size, pista.id).toBe(pista.grupos.length);
    const sinInterruptor = jugar(false, 4, 8).progreso;
    for (const pista of PISTAS) expect(empezados(pista, sinInterruptor).size, pista.id).toBeLessThan(pista.grupos.length);
  });

  it('quien pide menos ayuda empieza lo nuevo de orden escribiendo, no con fichas', () => {
    const orden = PISTAS.find((p) => p.id === 'orden');
    if (!orden) throw new Error('falta la pista de orden');
    const formas = (sinAndamiaje: boolean): string[] =>
      construirRondaDe([orden], PROGRESO_VACIO, AHORA, crearAzar(3), { ...OPCIONES, nuevosMaximo: 4, gruposAbiertos: true, sinAndamiaje }).map((p) => p.paso.ejercicio.forma);
    expect(new Set(formas(true))).toEqual(new Set(['traducir']));
    expect(new Set(formas(false))).toEqual(new Set(['ordenar']));
    // Si la regla está floja, vuelven las fichas.
    const floja = construirRondaDe([orden], PROGRESO_VACIO, AHORA, crearAzar(3), { ...OPCIONES, nuevosMaximo: 2, gruposAbiertos: true, sinAndamiaje: true, dominio: () => 0.2 });
    expect(new Set(floja.map((p) => p.paso.ejercicio.forma))).toEqual(new Set(['ordenar']));
  });

  it('quien pide menos ayuda empieza los verbos nuevos completando la forma, no eligiéndola, salvo que el presente esté flojo', () => {
    /** Los tipos de ejercicio de 30 rondas de verbos sin progreso: con todos los grupos abiertos, todo es del presente. */
    const tipos = (opciones: OpcionesRonda): string[] =>
      Array.from({ length: 30 }, (_, i) => construirRondaDe([verbos], PROGRESO_VACIO, AHORA, crearAzar(i + 1), opciones)).flatMap((pasos) =>
        pasos.map((p) => p.paso.ejercicio.tipo),
      );
    const conInterruptor = opcionesDeRonda({ ...AJUSTES_POR_DEFECTO, gruposAbiertos: true, nuevosPorRonda: 6 }, TODAS_LAS_FORMAS);
    const nuevos = tipos(conInterruptor);
    expect(nuevos).toHaveLength(180);
    expect(new Set(nuevos)).toEqual(new Set(['verbos.presente.completar', 'verbos.presente.pregunta']));
    // Se elige sin el interruptor, con el presente flojo y si completar no sale, aunque elegir tampoco: es el andamiaje de siempre.
    expect(new Set(tipos({ ...conInterruptor, sinAndamiaje: false }))).toEqual(new Set(['verbos.presente.elegir']));
    expect(new Set(tipos({ ...conInterruptor, dominio: () => 0.2 }))).toEqual(new Set(['verbos.presente.elegir']));
    expect(new Set(tipos({ ...conInterruptor, formas: new Set(['opcion', 'traducir']) }))).toEqual(new Set(['verbos.presente.elegir']));
    expect(new Set(tipos({ ...conInterruptor, formas: new Set(['traducir']) }))).toEqual(new Set(['verbos.presente.elegir']));
    // En los repasos, elegir sigue saliendo de vez en cuando.
    const azar = crearAzar(7);
    const presente = verbos.elementos.filter((e) => e.grupo === 'presente');
    const repasos = presente.flatMap((e) =>
      [1, 2, 3, 4, 5].map(() => verbos.crearEjercicio(e, { azar, vistos: new Set(), repeticiones: 2, formas: TODAS_LAS_FORMAS, sinAndamiaje: true }).tipo),
    );
    expect(repasos).toContain('verbos.presente.elegir');
    expect(repasos).toContain('verbos.presente.completar');
  });

  it('quien pide menos ayuda sigue empezando las palabras por “¿Qué significa?”: hay que reconocerlas antes de escribirlas', () => {
    const opciones = opcionesDeRonda({ ...AJUSTES_POR_DEFECTO, gruposAbiertos: true, nuevosPorRonda: 6 }, TODAS_LAS_FORMAS);
    for (let semilla = 1; semilla <= 5; semilla++) {
      const pasos = construirRondaDe([vocabulario], PROGRESO_VACIO, AHORA, crearAzar(semilla), opciones);
      expect(pasos.length, String(semilla)).toBe(6);
      expect(new Set(pasos.map((p) => p.paso.ejercicio.tipo)), String(semilla)).toEqual(new Set(['vocabulario.significado']));
    }
  });

  it('la previsión cuenta lo que trae la ronda', () => {
    expect(preverRonda(PISTAS, PROGRESO_VACIO, AHORA, OPCIONES)).toEqual({ repasos: 0, nuevos: 4 });
    expect(preverRonda(PISTAS, PROGRESO_VACIO, AHORA, { ...OPCIONES, nuevosMaximo: 0 })).toEqual({ repasos: 0, nuevos: 0 });
  });
});
