// @vitest-environment jsdom
// Recorridos de verdad por la app en jsdom: una ronda entera de punta a punta
// pasando por todas las formas de ejercicio que salgan, y la corrección de una
// frase escrita con el orden del inglés.

import { afterEach, describe, expect, it } from 'vitest';
import { almacenEnMemoria, CLAVE_HISTORIAL, type EjercicioTraducir } from '../motor';
import { boton, buscarBoton, enPantalla, escribirEn, limpiar, montar, prepararNavegador, pulsar } from '../pruebas/pantalla';
import type { Voz } from '../estado/voz';
import { App } from './App';
import { Escrito } from './ejercicios/Escrito';

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
