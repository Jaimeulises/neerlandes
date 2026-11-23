import { State } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import { crearAzar } from './azar';
import type { ContextoEjercicio, Ejercicio, Elemento, Pista } from './contratos';
import { diaDe, diasEntre } from './dia';
import { anotar, HISTORIAL_VACIO, racha, respuestasHoy, ultimosDias, type Historial, type Respuesta } from './historial';
import {
  almacenEnMemoria,
  apartarDatos,
  cargarDatos,
  CLAVE_APARTADO,
  CLAVE_HISTORIAL,
  CLAVE_PROGRESO,
  CopiaIlegible,
  deserializarCopia,
  deserializarProgreso,
  guardarDatos,
  leerEnBruto,
  serializarCopia,
  serializarHistorial,
  serializarProgreso,
} from './persistencia';
import { asentada, clave, conDiasAcertados, DIAS_PARA_ASENTAR, PROGRESO_VACIO, registrarRespuesta, vencida, vistosDe, type Progreso, type Tarjeta } from './repaso';
import { construirRonda, gruposDesbloqueados, repetirTrasFallo, resumirPista, RONDA_POR_DEFECTO, TODAS_LAS_FORMAS, validarPista } from './ronda';

interface Letra extends Elemento {
  readonly letra: string;
}

function pistaDePrueba(letras: string, grupos: readonly string[], porGrupo: number): Pista<Letra> {
  const elementos: Letra[] = Array.from(letras).map((letra, i) => ({ id: letra, grupo: grupos[Math.floor(i / porGrupo)] ?? 'z', letra }));
  return {
    id: 'letras',
    nombre: 'Letras',
    descripcion: 'de prueba',
    grupos,
    elementos,
    crearEjercicio: (e, contexto: ContextoEjercicio): Ejercicio => ({
      forma: 'opcion',
      tipo: 'letras.leer',
      elementoId: e.id,
      instruccion: 'Elige',
      enunciado: e.letra,
      enunciadoEnIdioma: false,
      opciones: contexto.azar.barajar([e.letra, 'x', 'y', 'z']),
      opcionesEnIdioma: false,
      respuestaCorrecta: e.letra,
    }),
    presentar: (e) => ({ principal: e.letra, nota: null }),
  };
}

const AHORA = new Date('2026-11-12T10:00:00Z');

describe('azar con semilla', () => {
  it('da siempre lo mismo con la misma semilla', () => {
    const a = crearAzar(7);
    const b = crearAzar(7);
    expect([a.siguiente(), a.entero(10), a.barajar([1, 2, 3, 4])]).toEqual([b.siguiente(), b.entero(10), b.barajar([1, 2, 3, 4])]);
  });
  it('baraja sin perder ni repetir', () => {
    const lista = [1, 2, 3, 4, 5, 6];
    expect([...crearAzar(3).barajar(lista)].sort()).toEqual(lista);
  });
});

describe('repaso', () => {
  it('un elemento nuevo no tiene tarjeta y tras responder la tiene', () => {
    const p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'bien', AHORA);
    expect(p.has(clave('letras', 'a'))).toBe(true);
    expect(PROGRESO_VACIO.size).toBe(0);
    expect(vistosDe(p, 'letras')).toEqual(new Set(['a']));
  });
  it('fallar vence antes que acertar', () => {
    const bien = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'bien', AHORA).get('letras/a');
    const mal = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'otra_vez', AHORA).get('letras/a');
    expect(mal?.due.getTime()).toBeLessThan(bien?.due.getTime() ?? 0);
    expect(vencida(mal as never, new Date(AHORA.getTime() + 10 * 60_000))).toBe(true);
  });
  it('tras varios aciertos espaciados la tarjeta se asienta', () => {
    let p: Progreso = PROGRESO_VACIO;
    let t = AHORA;
    for (let i = 0; i < 4; i++) {
      p = registrarRespuesta(p, 'letras', 'a', 'bien', t);
      t = new Date((p.get('letras/a')?.due.getTime() ?? 0) + 60_000);
    }
    expect(asentada(p.get('letras/a') as never)).toBe(true);
  });
});

// Progreso le dice al alumno que algo está asentado cuando lo ha acertado a la primera en al menos dos días
// distintos. El estado de FSRS solo no lo garantiza (auditoría del 13 de noviembre de 2026).
describe('asentado: aciertos en días distintos', () => {
  const tarjetaDe = (p: Progreso): Tarjeta => {
    const t = p.get('letras/a');
    if (!t) throw new Error('falta la tarjeta');
    return t;
  };
  // Horas locales: el día de estudio va de cuatro a cuatro en la hora del alumno.
  const TARDE = new Date(2026, 10, 12, 18, 0);
  const AL_DIA_SIGUIENTE = new Date(2026, 10, 13, 18, 0);

  it('el texto de Progreso dice «dos días»: es lo que exige el motor', () => {
    expect(DIAS_PARA_ASENTAR).toBe(2);
  });

  it('dos aciertos con diez segundos de diferencia no asientan, aunque FSRS ya la tenga en repaso', () => {
    let p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'bien', TARDE);
    p = registrarRespuesta(p, 'letras', 'a', 'bien', new Date(TARDE.getTime() + 10_000));
    expect(tarjetaDe(p).state).toBe(State.Review);
    expect(tarjetaDe(p).dias).toBe(1);
    expect(asentada(tarjetaDe(p))).toBe(false);
  });

  it('un «fácil» a la primera tampoco: FSRS la pasa a repaso, pero solo se ha acertado un día', () => {
    const p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'facil', TARDE);
    expect(tarjetaDe(p).state).toBe(State.Review);
    expect(asentada(tarjetaDe(p))).toBe(false);
  });

  it('se asienta al acertarla a la primera otro día', () => {
    let p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'bien', TARDE);
    p = registrarRespuesta(p, 'letras', 'a', 'bien', new Date(TARDE.getTime() + 10_000));
    p = registrarRespuesta(p, 'letras', 'a', 'bien', AL_DIA_SIGUIENTE);
    expect(tarjetaDe(p).dias).toBe(2);
    expect(asentada(tarjetaDe(p))).toBe(true);
  });

  it('pasada la medianoche sigue siendo el mismo día de estudio; a partir de las cuatro, otro', () => {
    let p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'facil', new Date(2026, 10, 12, 23, 50));
    p = registrarRespuesta(p, 'letras', 'a', 'bien', new Date(2026, 10, 13, 0, 10));
    expect(tarjetaDe(p).dias).toBe(1);
    p = registrarRespuesta(p, 'letras', 'a', 'bien', new Date(2026, 10, 13, 4, 5));
    expect(tarjetaDe(p).dias).toBe(2);
  });

  it('fallar el primer intento del día y acertar después no cuenta ese día', () => {
    let p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'facil', TARDE);
    p = registrarRespuesta(p, 'letras', 'a', 'otra_vez', AL_DIA_SIGUIENTE);
    p = registrarRespuesta(p, 'letras', 'a', 'bien', new Date(AL_DIA_SIGUIENTE.getTime() + 60_000));
    p = registrarRespuesta(p, 'letras', 'a', 'bien', new Date(AL_DIA_SIGUIENTE.getTime() + 20 * 60_000));
    // Y como el «fácil» ya la había pasado a repaso, el fallo es un olvido: tampoco cuenta el día de antes.
    expect(tarjetaDe(p).dias).toBe(0);
    expect(asentada(tarjetaDe(p))).toBe(false);
  });

  it('fallar algo asentado es olvidarlo: acertarlo en la vuelta de la ronda no lo asienta, hacen falta otros dos días', () => {
    let p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'facil', TARDE);
    p = registrarRespuesta(p, 'letras', 'a', 'bien', AL_DIA_SIGUIENTE);
    expect(asentada(tarjetaDe(p))).toBe(true);
    const tercerDia = new Date(2026, 10, 20, 18, 0);
    p = registrarRespuesta(p, 'letras', 'a', 'otra_vez', tercerDia);
    expect(asentada(tarjetaDe(p))).toBe(false);
    expect(tarjetaDe(p).dias).toBe(0);
    // La vuelta al final de la ronda, unos minutos después.
    p = registrarRespuesta(p, 'letras', 'a', 'bien', new Date(tercerDia.getTime() + 15 * 60_000));
    expect(asentada(tarjetaDe(p))).toBe(false);
    p = registrarRespuesta(p, 'letras', 'a', 'bien', new Date(2026, 10, 21, 18, 0));
    expect(asentada(tarjetaDe(p))).toBe(false);
    p = registrarRespuesta(p, 'letras', 'a', 'bien', new Date(2026, 10, 23, 18, 0));
    expect(tarjetaDe(p).dias).toBe(2);
    expect(asentada(tarjetaDe(p))).toBe(true);
  });

  it('un fallo mientras aún se aprende no borra los días ganados', () => {
    let p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'bien', TARDE);
    expect(tarjetaDe(p).state).not.toBe(State.Review);
    p = registrarRespuesta(p, 'letras', 'a', 'otra_vez', AL_DIA_SIGUIENTE);
    expect(tarjetaDe(p).dias).toBe(1);
  });

  it('con el reloj atrasado no se gana un día', () => {
    let p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'facil', AL_DIA_SIGUIENTE);
    p = registrarRespuesta(p, 'letras', 'a', 'bien', TARDE);
    expect(tarjetaDe(p).dias).toBe(1);
  });

  it('los días acertados se guardan y vuelven', () => {
    let p = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'facil', TARDE);
    p = registrarRespuesta(p, 'letras', 'a', 'bien', AL_DIA_SIGUIENTE);
    const vuelta = deserializarProgreso(serializarProgreso(p));
    expect(vuelta.get('letras/a')?.dias).toBe(2);
    expect(asentada(vuelta.get('letras/a') as never)).toBe(true);
    expect(() => deserializarProgreso(serializarProgreso(p).replace('"dias":2', '"dias":"dos"'))).toThrow(/dias/);
  });
});

describe('asentado: lo guardado antes de apuntar los días', () => {
  const TARDE = new Date(2026, 10, 10, 18, 0);
  const OTRO_DIA = new Date(2026, 10, 12, 18, 0);

  /** Un progreso como los de antes: las mismas tarjetas, sin el campo de los días. */
  function sinDias(progreso: Progreso): string {
    const texto = serializarProgreso(progreso).replace(/,"dias":\d+/g, '');
    expect(texto).not.toContain('dias');
    return texto;
  }

  function estudiar(respuestas: readonly [string, 'bien' | 'otra_vez' | 'facil', Date][]): { progreso: Progreso; historial: Historial } {
    let progreso: Progreso = PROGRESO_VACIO;
    let historial: Historial = HISTORIAL_VACIO;
    for (const [id, c, cuando] of respuestas) {
      progreso = registrarRespuesta(progreso, 'letras', id, c, cuando);
      historial = anotar(historial, { t: cuando.getTime(), k: `letras/${id}`, c, f: 'opcion' });
    }
    return { progreso, historial };
  }

  const estudiado = estudiar([
    ['a', 'facil', TARDE],
    ['b', 'facil', TARDE],
    ['c', 'otra_vez', TARDE],
    ['c', 'bien', new Date(TARDE.getTime() + 60_000)],
    ['a', 'bien', OTRO_DIA],
    ['c', 'bien', OTRO_DIA],
  ]);

  it('al cargar se cuentan en el historial, con la misma regla que al responder', async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar(CLAVE_PROGRESO, sinDias(estudiado.progreso));
    await almacen.guardar(CLAVE_HISTORIAL, serializarHistorial(estudiado.historial));
    const { progreso } = await cargarDatos(almacen);
    for (const id of ['a', 'b', 'c']) expect(progreso.get(`letras/${id}`)?.dias, id).toBe(estudiado.progreso.get(`letras/${id}`)?.dias);
    expect(progreso.get('letras/a')?.dias).toBe(2);
    expect(progreso.get('letras/b')?.dias).toBe(1);
    expect(progreso.get('letras/c')?.dias).toBe(1);
    expect(asentada(progreso.get('letras/a') as never)).toBe(true);
    expect(asentada(progreso.get('letras/b') as never)).toBe(false);
  });

  it('una copia antigua se restaura con sus días contados', () => {
    const copia = JSON.parse(serializarCopia(estudiado, 'stap', OTRO_DIA)) as { progreso: unknown };
    copia.progreso = JSON.parse(sinDias(estudiado.progreso));
    const { progreso } = deserializarCopia(JSON.stringify(copia), 'stap');
    expect(progreso.get('letras/a')?.dias).toBe(2);
    expect(progreso.get('letras/b')?.dias).toBe(1);
  });

  it('si de una tarjeta ya no queda historial, se le reconoce un día y el siguiente acierto, otro día, la asienta', () => {
    const antiguas = deserializarProgreso(sinDias(estudiado.progreso));
    const completas = conDiasAcertados(antiguas, HISTORIAL_VACIO);
    expect(completas.get('letras/a')?.dias).toBe(1);
    expect(completas.get('letras/b')?.dias).toBe(1);
    expect(asentada(completas.get('letras/a') as never)).toBe(false);
    const despues = registrarRespuesta(completas, 'letras', 'a', 'bien', new Date(2026, 10, 20, 18, 0));
    expect(asentada(despues.get('letras/a') as never)).toBe(true);
  });

  it('lo que ya trae sus días no se toca', () => {
    expect(conDiasAcertados(estudiado.progreso, HISTORIAL_VACIO)).toBe(estudiado.progreso);
  });
});

describe('rondas y desbloqueos', () => {
  const pista = pistaDePrueba('abcdefghij', ['uno', 'dos'], 5);

  it('valida una pista bien formada', () => {
    expect(validarPista(pista)).toEqual([]);
    expect(validarPista({ ...pista, grupos: ['uno', 'uno', 'dos'] })).toContain('hay grupos repetidos');
  });

  it('solo abre el primer grupo hasta verlo entero', () => {
    expect(gruposDesbloqueados(pista, PROGRESO_VACIO)).toEqual(['uno']);
    let p: Progreso = PROGRESO_VACIO;
    for (const l of 'abcde') p = registrarRespuesta(p, 'letras', l, 'bien', AHORA);
    expect(gruposDesbloqueados(pista, p)).toEqual(['uno', 'dos']);
  });

  it('con los grupos abiertos, cada ronda abre como mucho un grupo y lo demás sigue en rueda por los empezados', () => {
    const pista = pistaDePrueba('abcdefghi', ['uno', 'dos', 'tres'], 3);
    expect(gruposDesbloqueados(pista, PROGRESO_VACIO, new Map(), true)).toEqual(['uno', 'dos', 'tres']);
    const rondas = (gruposAbiertos: boolean): string[][] => {
      const resultado: string[][] = [];
      let p: Progreso = PROGRESO_VACIO;
      for (let i = 0; i < 5; i++) {
        const ids = construirRonda(pista, p, AHORA, crearAzar(1), { ...RONDA_POR_DEFECTO, nuevosMaximo: 2, gruposAbiertos }).map((x) => x.ejercicio.elementoId);
        resultado.push(ids);
        for (const id of ids) p = registrarRespuesta(p, 'letras', id, 'bien', AHORA);
      }
      return resultado;
    };
    // Abre uno por ronda (a, d y g presentan su regla), y luego reparte por el grupo que menos lleva visto.
    expect(rondas(true)).toEqual([['a', 'b'], ['d', 'e'], ['g', 'h'], ['c', 'f'], ['i']]);
    // Con los grupos en orden, lo de siempre: un grupo detrás de otro.
    expect(rondas(false)).toEqual([['a', 'b'], ['c'], ['d', 'e'], ['f'], ['g', 'h']]);
  });

  it('con los grupos abiertos, lo disponible es lo de los grupos empezados más el siguiente por empezar', () => {
    const pista = pistaDePrueba('abcdefghi', ['uno', 'dos', 'tres'], 3);
    expect(resumirPista(pista, PROGRESO_VACIO, AHORA, new Map(), true).nuevosDisponibles).toBe(3);
    let p: Progreso = PROGRESO_VACIO;
    for (const id of 'ab') p = registrarRespuesta(p, 'letras', id, 'bien', AHORA);
    expect(resumirPista(pista, p, AHORA, new Map(), true).nuevosDisponibles).toBe(4);
    expect(resumirPista(pista, p, AHORA).nuevosDisponibles).toBe(1);
  });

  it('una pista con requisito espera a otra pista', () => {
    const conRequisito: Pista<Letra> = { ...pista, grupoListo: (g, vistos) => g !== 'uno' || (vistos.get('otra')?.has('k') ?? false) };
    expect(gruposDesbloqueados(conRequisito, PROGRESO_VACIO)).toEqual([]);
    expect(gruposDesbloqueados(conRequisito, PROGRESO_VACIO, new Map([['otra', new Set(['k'])]]))).toEqual(['uno']);
  });

  it('la primera ronda trae nuevos con presentación y respeta el máximo', () => {
    const ronda = construirRonda(pista, PROGRESO_VACIO, AHORA, crearAzar(1));
    expect(ronda).toHaveLength(RONDA_POR_DEFECTO.nuevosMaximo);
    expect(ronda.every((p) => p.presentacion !== null)).toBe(true);
    expect(ronda.map((p) => p.ejercicio.elementoId)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('los vencidos van antes que los nuevos y el más atrasado primero', () => {
    let p: Progreso = PROGRESO_VACIO;
    p = registrarRespuesta(p, 'letras', 'a', 'otra_vez', AHORA);
    p = registrarRespuesta(p, 'letras', 'b', 'otra_vez', new Date(AHORA.getTime() + 1000));
    const despues = new Date(AHORA.getTime() + 60 * 60_000);
    const ronda = construirRonda(pista, p, despues, crearAzar(1));
    const ids = ronda.map((x) => x.ejercicio.elementoId);
    expect(ids.slice(0, 2).sort()).toEqual(['a', 'b']);
    expect(ronda[0]?.presentacion).toBeNull();
    expect(ronda[2]?.presentacion).not.toBeNull();
  });

  it('puede reforzar solo unos elementos aunque no hayan vencido', () => {
    let p: Progreso = PROGRESO_VACIO;
    for (const l of 'abc') p = registrarRespuesta(p, 'letras', l, 'facil', AHORA);
    const sinOpciones = construirRonda(pista, p, new Date(AHORA.getTime() + 1000), crearAzar(1));
    expect(sinOpciones.map((x) => x.ejercicio.elementoId)).toEqual(['d', 'e']);
    const refuerzo = construirRonda(pista, p, new Date(AHORA.getTime() + 1000), crearAzar(1), {
      ...RONDA_POR_DEFECTO,
      soloElementos: new Set(['a', 'c']),
      incluirNoVencidos: true,
      nuevosMaximo: 0,
    });
    expect(refuerzo.map((x) => x.ejercicio.elementoId).sort()).toEqual(['a', 'c']);
  });

  it('un fallo vuelve una vez y no más', () => {
    const e = pista.elementos[0] as Letra;
    const azar = crearAzar(2);
    expect(repetirTrasFallo(pista, e, PROGRESO_VACIO, azar, 0)?.repeticion).toBe(true);
    expect(repetirTrasFallo(pista, e, PROGRESO_VACIO, azar, 1)).toBeNull();
  });

  it('resume la pista', () => {
    let p: Progreso = PROGRESO_VACIO;
    p = registrarRespuesta(p, 'letras', 'a', 'otra_vez', AHORA);
    p = registrarRespuesta(p, 'letras', 'b', 'bien', AHORA);
    // A los cinco minutos solo ha vencido el fallo (otra vez: un minuto; bien: diez).
    const r = resumirPista(pista, p, new Date(AHORA.getTime() + 5 * 60_000));
    expect(r).toEqual({ total: 10, vistos: 2, paraRepasar: 1, nuevosDisponibles: 3 });
  });

  it('las formas por defecto incluyen todas', () => {
    expect([...TODAS_LAS_FORMAS].sort()).toEqual(['completar', 'decir', 'dictado', 'opcion', 'ordenar', 'traducir']);
  });
});

describe('día de estudio e historial', () => {
  it('el día cambia a las cuatro de la mañana', () => {
    const tresYMedia = new Date(2026, 10, 13, 3, 30);
    const cuatroYMedia = new Date(2026, 10, 13, 4, 30);
    expect(diaDe(tresYMedia)).toBe('2026-11-12');
    expect(diaDe(cuatroYMedia)).toBe('2026-11-13');
    expect(diasEntre('2026-11-10', '2026-11-13')).toBe(3);
  });

  it('cuenta la racha contando hoy o desde ayer', () => {
    const hoy = new Date(2026, 10, 12, 12, 0);
    const dia = 86_400_000;
    const h: Historial = [
      { t: hoy.getTime() - 2 * dia, k: 'a/b', c: 'bien', f: 'opcion' },
      { t: hoy.getTime() - dia, k: 'a/b', c: 'bien', f: 'opcion' },
    ];
    expect(racha(h, hoy)).toBe(2);
    expect(racha(anotar(h, { t: hoy.getTime(), k: 'a/b', c: 'otra_vez', f: 'opcion' }), hoy)).toBe(3);
    expect(racha(h, new Date(hoy.getTime() + dia))).toBe(0);
    expect(racha(HISTORIAL_VACIO, hoy)).toBe(0);
  });

  it('cuenta lo de hoy y los últimos días', () => {
    const hoy = new Date(2026, 10, 12, 12, 0);
    let h: Historial = HISTORIAL_VACIO;
    h = anotar(h, { t: hoy.getTime() - 86_400_000, k: 'a/b', c: 'bien', f: 'opcion' });
    h = anotar(h, { t: hoy.getTime() - 1000, k: 'a/b', c: 'bien', f: 'opcion' });
    h = anotar(h, { t: hoy.getTime(), k: 'a/c', c: 'otra_vez', f: 'traducir' });
    expect(respuestasHoy(h, hoy)).toBe(2);
    const dias = ultimosDias(h, hoy, 3);
    expect(dias.map((d) => d.respuestas)).toEqual([0, 1, 2]);
    expect(dias[2]?.aciertos).toBe(1);
  });
});

describe('persistencia', () => {
  it('guarda y carga progreso e historial', async () => {
    const almacen = almacenEnMemoria();
    const progreso = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'bien', AHORA);
    const historial = anotar(HISTORIAL_VACIO, { t: AHORA.getTime(), k: 'letras/a', c: 'bien', f: 'opcion' });
    await guardarDatos(almacen, { progreso, historial });
    const cargados = await cargarDatos(almacen);
    expect(cargados.progreso.get('letras/a')?.due.getTime()).toBe(progreso.get('letras/a')?.due.getTime());
    expect(cargados.historial).toEqual(historial);
  });

  it('sin nada guardado devuelve lo vacío', async () => {
    const d = await cargarDatos(almacenEnMemoria());
    expect(d.progreso.size).toBe(0);
    expect(d.historial).toHaveLength(0);
  });

  it('rechaza lo que no es una copia de esta app sin tocar nada', () => {
    expect(() => deserializarProgreso('esto no es json')).toThrow(CopiaIlegible);
    expect(() => deserializarProgreso('{"version":99}')).toThrow(CopiaIlegible);
    expect(() => deserializarProgreso(JSON.stringify({ version: 1, tarjetas: { 'a/b': { stability: 'x' } } }))).toThrow(CopiaIlegible);
    const copia = serializarCopia({ progreso: PROGRESO_VACIO, historial: HISTORIAL_VACIO }, 'stap', AHORA);
    expect(() => deserializarCopia(copia, 'otra')).toThrow(/otra app/);
    expect(deserializarCopia(copia, 'stap').progreso.size).toBe(0);
  });

  it('el progreso viaja ida y vuelta', () => {
    const progreso = registrarRespuesta(PROGRESO_VACIO, 'letras', 'a', 'dificil', AHORA);
    const vuelta = deserializarProgreso(serializarProgreso(progreso));
    expect(vuelta.get('letras/a')?.stability).toBeCloseTo(progreso.get('letras/a')?.stability ?? -1);
  });

  it('aparta tal cual lo que no se puede leer, sin tocarlo y sin pisar lo apartado antes', async () => {
    const almacen = almacenEnMemoria();
    expect(await apartarDatos(almacen, AHORA)).toBe(false);
    expect(await almacen.leer(CLAVE_APARTADO)).toBeNull();

    await almacen.guardar(CLAVE_PROGRESO, '{"esto está roto');
    await almacen.guardar(CLAVE_HISTORIAL, 'y esto');
    expect(await leerEnBruto(almacen)).toEqual({ progreso: '{"esto está roto', historial: 'y esto' });
    expect(await apartarDatos(almacen, AHORA)).toBe(true);
    expect(await almacen.leer(CLAVE_PROGRESO)).toBe('{"esto está roto');

    await almacen.guardar(CLAVE_PROGRESO, 'roto otra vez');
    expect(await apartarDatos(almacen, new Date(AHORA.getTime() + 60_000))).toBe(true);
    const apartado = JSON.parse((await almacen.leer(CLAVE_APARTADO)) ?? '[]') as { apartadoEl: string; progreso: string | null; historial: string | null }[];
    expect(apartado.map((a) => a.progreso)).toEqual(['{"esto está roto', 'roto otra vez']);
    expect(apartado[0]?.historial).toBe('y esto');
    expect(apartado[0]?.apartadoEl).toBe(AHORA.toISOString());
  });

  it('si lo apartado antes tampoco se entiende, lo conserva como texto', async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar(CLAVE_APARTADO, 'ni esto es json');
    await almacen.guardar(CLAVE_PROGRESO, 'roto');
    await apartarDatos(almacen, AHORA);
    const apartado = JSON.parse((await almacen.leer(CLAVE_APARTADO)) ?? '[]') as unknown[];
    expect(apartado[0]).toBe('ni esto es json');
    expect(apartado).toHaveLength(2);
  });
});

describe('racha con días libres', () => {
  const r = (dia: string): Respuesta => ({ t: new Date(`${dia}T12:00:00`).getTime(), k: 'hiragana/あ', c: 'bien', f: 'opcion' });
  const ahora = new Date('2026-11-13T12:00:00');

  it('un día de descanso o de pausa sin estudiar no rompe la racha, y tampoco suma', () => {
    const historial = [r('2026-11-10'), r('2026-11-12'), r('2026-11-13')];
    expect(racha(historial, ahora)).toBe(2);
    expect(racha(historial, ahora, new Set(['2026-11-11']))).toBe(3);
  });

  it('un día sin estudiar que no es libre sí la rompe', () => {
    const historial = [r('2026-11-09'), r('2026-11-12')];
    expect(racha(historial, ahora, new Set(['2026-11-11']))).toBe(1);
    expect(racha([r('2026-11-10')], ahora, new Set(['2026-11-11', '2026-11-12']))).toBe(1);
    expect(racha([r('2026-11-10')], ahora)).toBe(0);
  });
});

describe('reloj hacia atrás', () => {
  it('responder con el reloj atrasado no falla: cuenta como hecho en el momento del último repaso', () => {
    const hoy = new Date('2026-11-13T12:00:00Z');
    const antes = new Date('2026-11-08T12:00:00Z');
    let p = registrarRespuesta(PROGRESO_VACIO, 'hiragana', 'あ', 'bien', hoy);
    expect(() => {
      p = registrarRespuesta(p, 'hiragana', 'あ', 'bien', antes);
    }).not.toThrow();
    expect(p.get(clave('hiragana', 'あ'))?.reps).toBe(2);
  });
});

// Regla de cobro 2 (docs/decisiones/0017): nunca se corta a mitad de una ronda. El motor solo mira si un
// grupo está abierto al preparar la ronda; lo que ya ha empezado se termina aunque el acceso cambie.
describe('una ronda empezada se termina', () => {
  it('si el grupo se cierra con la ronda a medias, sus ejercicios siguen ahí y lo fallado vuelve a salir; el muro aparece en la ronda siguiente', () => {
    let abierto = true;
    const pista: Pista<Letra> = { ...pistaDePrueba('abcdef', ['uno', 'dos'], 3), grupoListo: () => abierto };
    const azar = crearAzar(5);
    const ronda = construirRonda(pista, PROGRESO_VACIO, AHORA, azar, RONDA_POR_DEFECTO);
    expect(ronda.length).toBeGreaterThan(0);
    const antes = ronda.map((p) => p.ejercicio.elementoId);

    abierto = false;
    // Nada de lo ya preparado depende de volver a preguntar.
    expect(ronda.map((p) => p.ejercicio.elementoId)).toEqual(antes);
    const primero = pista.elementos.find((e) => e.id === antes[0]);
    if (!primero) throw new Error('falta el primer elemento');
    expect(repetirTrasFallo(pista, primero, PROGRESO_VACIO, azar, 0)).not.toBeNull();

    // Entre rondas sí: con el grupo cerrado, la siguiente no trae nada nuevo de él.
    expect(construirRonda(pista, PROGRESO_VACIO, AHORA, crearAzar(6), RONDA_POR_DEFECTO)).toHaveLength(0);
  });
});
