// @vitest-environment jsdom
// Recorridos de verdad por la app en jsdom: una ronda entera de punta a punta
// pasando por todas las formas de ejercicio que salgan, la corrección de una
// frase escrita o de unas fichas con el orden del inglés, y lo que pasa con lo
// guardado: restaurar una copia, no poder abrirlo y volver a la app otro día.

import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NOMBRE_APP } from '../estado/app';
import {
  almacenEnMemoria,
  anotar,
  CLAVE_HISTORIAL,
  CLAVE_PROGRESO,
  guardarDatos,
  HISTORIAL_VACIO,
  PROGRESO_VACIO,
  registrarRespuesta,
  serializarCopia,
  type Almacen,
  type EjercicioOrdenar,
  type EjercicioTraducir,
} from '../motor';
import { boton, buscarBoton, enPantalla, escribirEn, esperar, limpiar, montar, prepararNavegador, pulsar } from '../pruebas/pantalla';
import type { Voz } from '../estado/voz';
import { App } from './App';
import { Escrito } from './ejercicios/Escrito';
import { Ordenar } from './ejercicios/Ordenar';

const SIN_VOZ: Voz = { disponible: false, nombre: null, decir: () => undefined };

afterEach(() => {
  limpiar();
});

/** Da un paso en la ronda, sea cual sea el ejercicio. Devuelve la forma que ha visto. */
async function darUnPaso(): Promise<string> {
  const entendido = buscarBoton('Entendido');
  if (entendido) {
    await pulsar(entendido);
    return 'presentacion';
  }
  const opciones = document.querySelectorAll<HTMLButtonElement>('[aria-label="Opciones"] button:not(:disabled)');
  const primera = opciones[0];
  if (primera) {
    await pulsar(primera);
    await pulsar(boton('Siguiente'));
    return 'opcion';
  }
  if (document.querySelector('[aria-label="Fichas sueltas"] button')) {
    for (let suelta = document.querySelector<HTMLButtonElement>('[aria-label="Fichas sueltas"] button'); suelta; suelta = document.querySelector<HTMLButtonElement>('[aria-label="Fichas sueltas"] button')) {
      await pulsar(suelta);
    }
    await pulsar(boton('Comprobar'));
    await pulsar(boton('Siguiente'));
    return 'ordenar';
  }
  const campo = document.querySelector<HTMLTextAreaElement | HTMLInputElement>('textarea.campo, input.campo');
  if (campo) {
    escribirEn(campo, 'ik weet het niet');
    await pulsar(boton('Comprobar'));
    await pulsar(boton('Siguiente'));
    return campo instanceof HTMLTextAreaElement ? 'escrito' : 'completar';
  }
  const dicha = buscarBoton('Ya la he dicho');
  if (dicha) {
    await pulsar(dicha);
    await pulsar(boton('Me ha salido'));
    return 'decir';
  }
  throw new Error(`No sé qué hacer en esta pantalla: ${enPantalla().slice(0, 200)}`);
}

describe('la app de punta a punta', () => {
  it('una ronda de hoy se termina, guarda las respuestas y vuelve a Hoy', async () => {
    prepararNavegador();
    const almacen = almacenEnMemoria();
    await montar(<App almacen={almacen} />);
    expect(enPantalla()).toContain('Ronda de hoy');
    expect(enPantalla()).toContain('Orden de la frase');

    await pulsar(boton('Empezar'));
    const vistas = new Set<string>();
    for (let i = 0; i < 80 && !enPantalla().includes('Ronda terminada'); i++) {
      vistas.add(await darUnPaso());
    }
    expect(enPantalla()).toContain('Ronda terminada');
    expect(vistas.has('presentacion')).toBe(true);
    expect(vistas.has('ordenar')).toBe(true);
    expect(vistas.has('opcion')).toBe(true);

    const historial = await almacen.leer(CLAVE_HISTORIAL);
    expect(historial).not.toBeNull();
    expect((JSON.parse(historial ?? '{}') as { respuestas: unknown[] }).respuestas.length).toBeGreaterThan(0);

    await pulsar(boton('Volver'));
    expect(enPantalla()).toContain('respuestas hoy');
  });

  it('Progreso y Ajustes se abren', async () => {
    prepararNavegador();
    await montar(<App almacen={almacenEnMemoria()} />);
    await pulsar(boton('Progreso'));
    expect(enPantalla()).toContain('Últimas dos semanas');
    await pulsar(boton('Ajustes'));
    expect(enPantalla()).toContain('Copia de seguridad');
    expect(enPantalla()).toContain('no tiene voz neerlandesa');
    expect(enPantalla()).toContain('Ejercicios en los repasos');
    expect(enPantalla()).toContain('Dictado (necesita la voz)');
  });
});

/** Elige un archivo en el campo de la copia, como si el alumno lo hubiera escogido en el móvil. */
async function elegirArchivo(contenido: string, nombre: string): Promise<void> {
  const entrada = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!entrada) throw new Error('falta el campo de archivo');
  Object.defineProperty(entrada, 'files', { value: [new File([contenido], nombre, { type: 'application/json' })], configurable: true });
  act(() => {
    entrada.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await esperar();
  await esperar();
}

describe('lo guardado', () => {
  it('restaurar una copia pide confirmación y dice de cuándo es y qué trae', async () => {
    prepararNavegador();
    const almacen = almacenEnMemoria();
    await montar(<App almacen={almacen} />);
    await pulsar(boton('Ajustes'));
    const progreso = registrarRespuesta(PROGRESO_VACIO, 'vocabulario', 'gente:de-moeder', 'bien', new Date(2026, 10, 2, 10));
    const copia = serializarCopia({ progreso, historial: HISTORIAL_VACIO }, NOMBRE_APP, new Date(2026, 10, 2, 10));

    await elegirArchivo(copia, 'stap-copia-2026-11-02.json');
    expect(enPantalla()).toContain('Copia del 2 de noviembre de 2026: 1 cosa vista y 0 respuestas');
    expect(enPantalla()).toContain('Ahora en este dispositivo: 0 cosas vistas y 0 respuestas');
    expect(await almacen.leer(CLAVE_PROGRESO)).toBeNull();
    await pulsar(boton('Cancelar'));
    expect(enPantalla()).not.toContain('Copia del');
    expect(await almacen.leer(CLAVE_PROGRESO)).toBeNull();

    // Si con una confirmación abierta se elige otro archivo y ese no vale, la confirmación de antes se va.
    await elegirArchivo(copia, 'stap-copia-2026-11-02.json');
    await elegirArchivo('no soy una copia', 'otra.json');
    expect(enPantalla()).toContain('Esa copia no vale');
    expect(enPantalla()).not.toContain('Copia del');
    expect(buscarBoton(/^\s*Restaurar$/)).toBeNull();

    await elegirArchivo(copia, 'stap-copia-2026-11-02.json');
    expect(enPantalla()).not.toContain('Esa copia no vale');
    await pulsar(boton(/^\s*Restaurar$/));
    expect(enPantalla()).toContain('Copia restaurada.');
    expect(await almacen.leer(CLAVE_PROGRESO)).not.toBeNull();
  });

  it('si no se puede abrir lo guardado, se puede seguir sin guardar, y se avisa también durante la ronda', async () => {
    prepararNavegador();
    let escrituras = 0;
    const cerrado: Almacen = {
      leer: () => Promise.reject(new DOMException('sin acceso', 'UnknownError')),
      guardar: () => {
        escrituras++;
        return Promise.resolve();
      },
      borrar: () => Promise.resolve(),
    };
    await montar(<App almacen={cerrado} />);
    expect(enPantalla()).toContain('No se puede leer tu progreso');
    await pulsar(boton('Seguir sin guardar'));
    expect(enPantalla()).toContain('Esta sesión no se guarda');
    await pulsar(boton('Empezar'));
    expect(enPantalla()).toContain('Esta sesión no se guarda');
    await darUnPaso();
    await darUnPaso();
    expect(escrituras).toBe(0);
  });

  it('Hoy se pone al día al volver a la app otro día, sin recargarla', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date(2026, 10, 19, 12));
      prepararNavegador();
      const almacen = almacenEnMemoria();
      await guardarDatos(almacen, { progreso: PROGRESO_VACIO, historial: anotar(HISTORIAL_VACIO, { t: Date.now(), k: 'orden/x', c: 'bien', f: 'ordenar' }) });
      await montar(<App almacen={almacen} />);
      expect(enPantalla()).toContain('Hoy, 19/11/2026');
      vi.setSystemTime(new Date(2026, 10, 22, 12));
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await esperar();
      expect(enPantalla()).toContain('Hoy, 22/11/2026');
    } finally {
      vi.useRealTimers();
    }
  });
});

/** La ficha suelta que dice exactamente eso. */
function ficha(texto: string): HTMLButtonElement {
  const encontrada = [...document.querySelectorAll<HTMLButtonElement>('[aria-label="Fichas sueltas"] button')].find((b) => b.textContent === texto);
  if (!encontrada) throw new Error(`falta la ficha ${texto}`);
  return encontrada;
}

describe('ordenar las fichas en pantalla', () => {
  it('un orden bueno que no está en la lista se puede dar por bueno', async () => {
    prepararNavegador();
    const calificaciones: string[] = [];
    const ejercicio: EjercicioOrdenar = {
      forma: 'ordenar',
      tipo: 'prueba',
      elementoId: 'x',
      instruccion: 'Ordena la frase',
      significado: 'Después de comer tomamos café.',
      fichas: [
        { id: 0, texto: 'na het eten' },
        { id: 1, texto: 'drinken' },
        { id: 2, texto: 'we' },
        { id: 3, texto: 'koffie' },
      ],
      validas: ['Na het eten drinken we koffie.'],
      frase: 'Na het eten drinken we koffie.',
    };
    await montar(
      <Ordenar
        ejercicio={ejercicio}
        repeticion={false}
        voz={SIN_VOZ}
        onTerminar={(c) => {
          calificaciones.push(c);
        }}
      />,
    );
    for (const texto of ['we', 'drinken', 'koffie', 'na het eten']) await pulsar(ficha(texto));
    await pulsar(boton('Comprobar'));
    expect(enPantalla()).toContain('No va en ese orden');
    await pulsar(boton('Mi respuesta también vale'));
    expect(calificaciones).toEqual(['bien']);
  });
});

describe('corregir una frase escrita en pantalla', () => {
  const ejercicio: EjercicioTraducir = {
    forma: 'traducir',
    tipo: 'prueba',
    elementoId: 'x',
    instruccion: 'Escríbela en neerlandés',
    significado: 'Mañana voy a casa.',
    respuestas: ['Morgen ga ik naar huis.', 'Ik ga morgen naar huis.'],
    aclaracion: 'El verbo va en segunda posición.',
  };

  it('el orden del inglés se señala como fallo de orden, y se puede dar por buena', async () => {
    prepararNavegador();
    const calificaciones: string[] = [];
    await montar(
      <Escrito
        ejercicio={ejercicio}
        repeticion={false}
        voz={SIN_VOZ}
        onTerminar={(c) => {
          calificaciones.push(c);
        }}
      />,
    );
    const campo = document.querySelector<HTMLTextAreaElement>('textarea');
    if (!campo) throw new Error('falta el campo');
    escribirEn(campo, 'morgen ik ga naar huis');
    await pulsar(boton('Comprobar'));
    expect(enPantalla()).toContain('falla el orden');
    expect(enPantalla()).toContain('El verbo va en segunda posición.');
    await pulsar(boton('Mi respuesta también vale'));
    expect(calificaciones).toEqual(['bien']);
  });

  it('la frase buena se da por buena', async () => {
    prepararNavegador();
    const calificaciones: string[] = [];
    await montar(
      <Escrito
        ejercicio={ejercicio}
        repeticion={false}
        voz={SIN_VOZ}
        onTerminar={(c) => {
          calificaciones.push(c);
        }}
      />,
    );
    const campo = document.querySelector<HTMLTextAreaElement>('textarea');
    if (!campo) throw new Error('falta el campo');
    escribirEn(campo, 'ik ga morgen naar huis');
    await pulsar(boton('Comprobar'));
    expect(enPantalla()).toContain('Bien');
    await pulsar(boton('Siguiente'));
    expect(calificaciones).toEqual(['bien']);
  });
});
