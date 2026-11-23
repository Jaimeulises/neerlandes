// Cómo se arma la ronda de hoy: lo nuevo se reparte entre las pistas que tienen algo que dar y va
// detrás de los repasos, con lo que abre cada grupo (la regla) antes que lo que sale de ella.

import { describe, expect, it } from 'vitest';
import { clave, crearAzar, PROGRESO_VACIO, registrarRespuesta, RONDA_POR_DEFECTO, type OpcionesRonda, type Progreso } from '../motor';
import { PISTAS } from '../neerlandes/paquete';
import { vocabulario } from '../neerlandes/vocabulario/pista';
import { construirRondaDe, preverRonda, repartir, type PasoMixto } from './ronda';

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

  it('la previsión cuenta lo que trae la ronda', () => {
    expect(preverRonda(PISTAS, PROGRESO_VACIO, AHORA, OPCIONES)).toEqual({ repasos: 0, nuevos: 4 });
    expect(preverRonda(PISTAS, PROGRESO_VACIO, AHORA, { ...OPCIONES, nuevosMaximo: 0 })).toEqual({ repasos: 0, nuevos: 0 });
  });
});
