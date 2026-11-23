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
  crearAzar,
  anotar,
  CLAVE_HISTORIAL,
  CLAVE_PROGRESO,
  guardarDatos,
  HISTORIAL_VACIO,
  PROGRESO_VACIO,
  registrarRespuesta,
  serializarCopia,
  type Almacen,
  type EjercicioDecir,
  type EjercicioOrdenar,
  type EjercicioTraducir,
} from '../motor';
import { vozGrabada } from '../neerlandes/audio';
import { boton, buscarBoton, enPantalla, escribirEn, esperar, limpiar, montar, prepararNavegador, pulsar } from '../pruebas/pantalla';
import type { TiempoDecir } from '../estado/ajustes';
import type { Voz } from '../estado/voz';
import { ELEMENTOS_ORDEN, ejercicioDeFrase, orden, type Frase } from '../neerlandes/orden/pista';
import { App } from './App';
import { Decir, PAUSA_ANTES_DE_SONAR, segundosParaDecir } from './ejercicios/Decir';
import { Escrito } from './ejercicios/Escrito';
import { Ordenar } from './ejercicios/Ordenar';

const SIN_VOZ: Voz = { disponible: false, nombre: null, decir: () => undefined };

afterEach(() => {
  limpiar();
});

/** Tras un primer fallo con pista, ver la solución en vez de intentarlo otra vez. */
async function rendirseSiHayPista(): Promise<void> {
  const ver = buscarBoton('Ver la solución');
  if (ver) await pulsar(ver);
}

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
    await rendirseSiHayPista();
    await pulsar(boton('Siguiente'));
    return 'ordenar';
  }
  const campo = document.querySelector<HTMLTextAreaElement | HTMLInputElement>('textarea.campo, input.campo');
  if (campo) {
    escribirEn(campo, 'ik weet het niet');
    await pulsar(boton('Comprobar'));
    await rendirseSiHayPista();
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
    expect(enPantalla()).toContain('Ejercicios en los repasos');
    // El navegador de las pruebas no tiene voz: si hay audio grabado, suena ese y hay dictado; si no, no hay voz.
    if (vozGrabada()) {
      expect(enPantalla()).toContain('grabada con Azure');
      expect(enPantalla()).not.toContain('Dictado (necesita la voz)');
    } else {
      expect(enPantalla()).toContain('no tiene voz neerlandesa');
      expect(enPantalla()).toContain('Dictado (necesita la voz)');
    }
  });

  it('abrir todos los grupos se guarda y Progreso lo dice', async () => {
    prepararNavegador();
    await montar(<App almacen={almacenEnMemoria()} />);
    await pulsar(boton('Ajustes'));
    const interruptor = document.querySelector<HTMLInputElement>('input[aria-describedby="explica-grupos"]');
    if (!interruptor) throw new Error('falta el interruptor');
    expect(interruptor.checked).toBe(false);
    await pulsar(interruptor);
    expect(interruptor.checked).toBe(true);
    expect(JSON.parse(localStorage.getItem('stap/ajustes') ?? '{}')).toMatchObject({ gruposAbiertos: true });
    await pulsar(boton('Progreso'));
    expect(enPantalla()).toContain('Todos los grupos están abiertos');
  });

  it('el tiempo para decir la frase se elige y se guarda; lo que no se entienda vuelve a normal', async () => {
    prepararNavegador();
    localStorage.setItem('stap/ajustes', JSON.stringify({ tiempoDecir: 'mucho' }));
    await montar(<App almacen={almacenEnMemoria()} />);
    await pulsar(boton('Ajustes'));
    const grupo = document.querySelector('[role="group"][aria-label="Tiempo para decir la frase"]');
    const pulsado = (): string | undefined => grupo?.querySelector('[aria-pressed="true"]')?.textContent ?? undefined;
    expect(pulsado()).toBe('Normal');
    const calma = [...(grupo?.querySelectorAll('button') ?? [])].find((b) => b.textContent === 'Con calma');
    if (!calma) throw new Error('falta Con calma');
    await pulsar(calma);
    expect(pulsado()).toBe('Con calma');
    expect(JSON.parse(localStorage.getItem('stap/ajustes') ?? '{}')).toMatchObject({ tiempoDecir: 'calma' });
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

describe('corregir pidiendo: una pista y otro intento tras el primer fallo', () => {
  type Terminado = [string, string[], boolean];

  async function montarEscrito(terminados: Terminado[]): Promise<HTMLTextAreaElement> {
    const ejercicio = ejercicioDeFrase(fraseDeMorgen(), 'traducir', { azar: crearAzar(1), vistos: new Set(), repeticiones: 1, formas: new Set(['traducir']) });
    await montar(
      <Escrito
        ejercicio={ejercicio as EjercicioTraducir}
        repeticion={false}
        voz={SIN_VOZ}
        diagnosticar={(r) => orden.diagnosticar?.(ejercicio, r) ?? []}
        pistasDeReintento={(ds, v) => orden.pistasDeReintento?.(ejercicio, ds, v) ?? []}
        onTerminar={(c, ds, segunda) => {
          terminados.push([c, (ds ?? []).map((d) => d.destreza), segunda ?? false]);
        }}
      />,
    );
    const campo = document.querySelector<HTMLTextAreaElement>('textarea');
    if (!campo) throw new Error('falta el campo');
    return campo;
  }

  it('el primer fallo da la pista sin la solución, y a la segunda se explica lo que falló y cuenta como fallo', async () => {
    prepararNavegador();
    const terminados: Terminado[] = [];
    const campo = await montarEscrito(terminados);
    escribirEn(campo, 'morgen ik ga naar mijn schoonouders');
    await pulsar(boton('Comprobar'));
    expect(enPantalla()).toContain('Inténtalo otra vez');
    expect(enPantalla()).toContain('Has empezado por «morgen»');
    // Ni la frase buena ni la explicación, y lo escrito sigue ahí para corregirlo.
    expect(enPantalla()).not.toContain('Morgen ga ik naar mijn schoonouders');
    expect(buscarBoton('Siguiente')).toBeNull();
    expect(campo.readOnly).toBe(false);
    expect(campo.value).toBe('morgen ik ga naar mijn schoonouders');
    // Sin cambiar nada no se gasta el segundo intento.
    expect(boton('Comprobar').disabled).toBe(true);
    escribirEn(campo, 'Morgen ga ik naar mijn schoonouders');
    await pulsar(boton('Comprobar'));
    expect(enPantalla()).toContain('Bien a la segunda');
    expect(enPantalla()).toContain('el verbo va antes que el sujeto');
    await pulsar(boton('Siguiente'));
    expect(terminados).toEqual([['otra_vez', ['inversion'], true]]);
  });

  it('en el móvil la pista se ve: va encima del campo, se desplaza hasta ella y no vuelve a abrir el teclado', async () => {
    prepararNavegador();
    const desplazados: Element[] = [];
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      value(this: Element) {
        desplazados.push(this);
      },
      configurable: true,
      writable: true,
    });
    const campo = await montarEscrito([]);
    escribirEn(campo, 'morgen ik ga naar mijn schoonouders');
    // Como al tocar Comprobar en el móvil: el teclado se cierra.
    campo.blur();
    await pulsar(boton('Comprobar'));
    const panel = document.querySelector('.reintento');
    if (!panel) throw new Error('falta la pista');
    expect(panel.compareDocumentPosition(campo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(desplazados).toEqual([panel]);
    expect(document.activeElement).not.toBe(campo);
    // Y queda dicho dónde se da por buena una respuesta que no está apuntada.
    expect(enPantalla()).toContain('Si crees que la tuya también vale, en la solución puedes darla por buena.');
  });

  it('se puede ver la solución sin intentarlo otra vez: es la corrección del primer intento', async () => {
    prepararNavegador();
    const terminados: Terminado[] = [];
    const campo = await montarEscrito(terminados);
    escribirEn(campo, 'morgen ik ga naar mijn schoonouders');
    await pulsar(boton('Comprobar'));
    escribirEn(campo, 'morgen ik');
    await pulsar(boton('Ver la solución'));
    expect(campo.value).toBe('morgen ik ga naar mijn schoonouders');
    expect(enPantalla()).toContain('el verbo va antes que el sujeto');
    expect(enPantalla()).toContain('Mi respuesta también vale');
    await pulsar(boton('Siguiente'));
    expect(terminados).toEqual([['otra_vez', ['inversion'], false]]);
  });

  it('si el segundo intento también falla, se corrige ese y cuenta todo lo fallado', async () => {
    prepararNavegador();
    const terminados: Terminado[] = [];
    const campo = await montarEscrito(terminados);
    escribirEn(campo, 'morgen ik ga naar mijn schoonouders');
    await pulsar(boton('Comprobar'));
    escribirEn(campo, 'morgen ga ik naar mijn ouders');
    await pulsar(boton('Comprobar'));
    expect(enPantalla()).not.toContain('Bien a la segunda');
    expect(enPantalla()).toContain('No es así');
    await pulsar(boton('Siguiente'));
    expect(terminados).toEqual([['otra_vez', ['inversion'], false]]);
  });

  it('al ordenar, las fichas se quedan donde estaban para moverlas', async () => {
    prepararNavegador();
    const terminados: Terminado[] = [];
    const f = fraseDeMorgen();
    const ejercicio = ejercicioDeFrase(f, 'ordenar', { azar: crearAzar(1), vistos: new Set(), repeticiones: 0, formas: new Set(['ordenar']) }) as EjercicioOrdenar;
    await montar(
      <Ordenar
        ejercicio={ejercicio}
        repeticion={false}
        voz={SIN_VOZ}
        diagnosticar={(r) => orden.diagnosticar?.(ejercicio, r) ?? []}
        pistasDeReintento={(ds, v) => orden.pistasDeReintento?.(ejercicio, ds, v) ?? []}
        onTerminar={(c, ds, segunda) => {
          terminados.push([c, (ds ?? []).map((d) => d.destreza), segunda ?? false]);
        }}
      />,
    );
    // El orden del inglés: morgen ik ga…
    const [morgen, ga, ik, ...resto] = f.fichas;
    for (const texto of [morgen, ik, ga, ...resto]) await pulsar(ficha(texto ?? ''));
    await pulsar(boton('Comprobar'));
    expect(enPantalla()).toContain('Inténtalo otra vez');
    const puestas = () => [...document.querySelectorAll<HTMLButtonElement>('[aria-label="Tu frase"] button')];
    expect(puestas().map((b) => b.textContent)).toEqual([morgen, ik, ga, ...resto]);
    // Se quitan desde ik y se vuelven a poner en su orden.
    for (const b of puestas().slice(1)) await pulsar(b);
    for (const texto of [ga, ik, ...resto]) await pulsar(ficha(texto ?? ''));
    await pulsar(boton('Comprobar'));
    expect(enPantalla()).toContain('Bien a la segunda');
    await pulsar(boton('Siguiente'));
    expect(terminados).toEqual([['otra_vez', ['inversion'], true]]);
  });
});

describe('decir la frase con cuenta atrás', () => {
  const ejercicio: EjercicioDecir = {
    forma: 'decir',
    tipo: 'prueba',
    elementoId: 'x',
    instruccion: 'Dila en voz alta antes de verla',
    significado: 'Hoy trabajo en casa.',
    texto: 'Vandaag werk ik thuis.',
    otras: ['Ik werk vandaag thuis.'],
  };
  const total = segundosParaDecir(ejercicio) ?? 0;

  async function montarDecir(dichas: string[], opciones: { tiempo?: TiempoDecir; calificaciones?: string[] } = {}): Promise<void> {
    // Solo el reloj de la cuenta es de mentira: montar y esperar usan setTimeout de verdad.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    prepararNavegador();
    const voz: Voz = {
      disponible: true,
      nombre: 'prueba',
      decir: (t) => {
        dichas.push(t);
      },
    };
    await montar(
      <Decir
        ejercicio={ejercicio}
        repeticion={false}
        voz={voz}
        {...(opciones.tiempo ? { tiempo: opciones.tiempo } : {})}
        onTerminar={(c) => {
          opciones.calificaciones?.push(c);
        }}
      />,
    );
  }

  function pasan(segundos: number): void {
    act(() => {
      vi.advanceTimersByTime(segundos * 1000);
    });
  }

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('da el tiempo de leer el español y decir la frase, entre 6 y 12 segundos', () => {
    expect(segundosParaDecir({ texto: 'Ja.', significado: 'Sí.' })).toBe(6);
    expect(segundosParaDecir({ texto: 'Vandaag werk ik thuis.', significado: 'Hoy trabajo en casa.' })).toBe(6);
    // 2 + 0,25 por 6 palabras leídas + 0,7 por 7 dichas: 8,4.
    expect(segundosParaDecir({ texto: 'Ik wil morgen een nieuwe fiets kopen.', significado: 'Mañana quiero comprar una bici nueva.' })).toBe(8);
    // La pista también se lee.
    expect(segundosParaDecir({ texto: 'Ik wil morgen een nieuwe fiets kopen.', significado: 'Mañana quiero comprar una bici nueva.', pista: 'Con el verbo willen, que es modal.' })).toBe(10);
    expect(segundosParaDecir({ texto: 'In het weekend fietsen we vaak met de kinderen naar het strand.', significado: 'Los fines de semana vamos a menudo en bici a la playa con los niños.' })).toBe(12);
  });

  it('aprieta más con la regla dominada y menos con la regla floja', () => {
    const frase = { texto: 'Ik wil morgen een nieuwe fiets kopen.', significado: 'Mañana quiero comprar una bici nueva.' };
    expect(segundosParaDecir({ ...frase, dominio: 0.6 })).toBe(8);
    expect(segundosParaDecir({ ...frase, dominio: 0.9 })).toBe(7);
    expect(segundosParaDecir({ ...frase, dominio: 0.2 })).toBe(11);
  });

  it('con calma da la mitad más, y sin cuenta atrás no hay tiempo que contar', () => {
    const frase = { texto: 'Ik wil morgen een nieuwe fiets kopen.', significado: 'Mañana quiero comprar una bici nueva.' };
    expect(segundosParaDecir(frase, 'calma')).toBe(13);
    expect(segundosParaDecir(frase, 'sin')).toBeNull();
  });

  it('al acabar la cuenta se ve la frase y, un momento después, suena una sola vez', async () => {
    const dichas: string[] = [];
    await montarDecir(dichas);
    expect(document.querySelector('[role="timer"]')?.getAttribute('aria-label')).toBe(`Quedan ${String(total)} segundos`);
    pasan(total - 1);
    expect(enPantalla()).not.toContain('Vandaag werk ik thuis.');
    expect(dichas).toEqual([]);
    pasan(1);
    expect(enPantalla()).toContain('Vandaag werk ik thuis.');
    // Aún no: si se está acabando de decir, la voz no lo pisa.
    expect(dichas).toEqual([]);
    pasan(PAUSA_ANTES_DE_SONAR / 1000);
    expect(dichas).toEqual(['Vandaag werk ik thuis.']);
    pasan(10);
    expect(dichas).toHaveLength(1);
  });

  it('se puede ver antes, y suena enseguida', async () => {
    const dichas: string[] = [];
    await montarDecir(dichas);
    pasan(2);
    await pulsar(boton('Ya la he dicho'));
    expect(enPantalla()).toContain('Vandaag werk ik thuis.');
    expect(document.querySelector('[role="timer"]')).toBeNull();
    expect(dichas).toEqual(['Vandaag werk ik thuis.']);
    pasan(10);
    expect(dichas).toEqual(['Vandaag werk ik thuis.']);
  });

  it('sin cuenta atrás, la frase sale solo cuando se pide', async () => {
    const dichas: string[] = [];
    await montarDecir(dichas, { tiempo: 'sin' });
    expect(document.querySelector('[role="timer"]')).toBeNull();
    pasan(60);
    expect(enPantalla()).not.toContain('Vandaag werk ik thuis.');
    await pulsar(boton('Ya la he dicho'));
    expect(dichas).toEqual(['Vandaag werk ik thuis.']);
  });

  it('con la app en segundo plano la cuenta no avanza', async () => {
    const dichas: string[] = [];
    await montarDecir(dichas);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    pasan(total + 5);
    expect(enPantalla()).not.toContain('Vandaag werk ik thuis.');
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    pasan(total + 1);
    expect(dichas).toEqual(['Vandaag werk ik thuis.']);
  });

  it('pregunta por el sitio y la forma del verbo, enseña las otras formas buenas y no da nada por bueno antes de tiempo', async () => {
    await montarDecir([]);
    await pulsar(boton('Ya la he dicho'));
    expect(enPantalla()).toContain('¿Has puesto el verbo en su sitio y bien conjugado?');
    expect(enPantalla()).toContain('También vale');
    const otra = [...document.querySelectorAll('.otras-formas li')];
    expect(otra.map((li) => [li.textContent, li.getAttribute('lang')])).toEqual([['Ik werk vandaag thuis.', 'nl']]);
    expect(document.querySelector('.resultado--bien')).toBeNull();
    expect(document.querySelector('.resultado--neutro')).not.toBeNull();
  });

  it('tras equivocarse se dice otra vez con la buena antes de seguir, y cuenta como fallo', async () => {
    const calificaciones: string[] = [];
    await montarDecir([], { calificaciones });
    await pulsar(boton('Ya la he dicho'));
    await pulsar(boton('Me he equivocado'));
    expect(calificaciones).toEqual([]);
    expect(enPantalla()).toContain('Dila otra vez en voz alta, ahora con la buena.');
    await pulsar(boton('Siguiente'));
    expect(calificaciones).toEqual(['otra_vez']);
  });
});

function fraseDeMorgen(): Frase {
  const f = ELEMENTOS_ORDEN.find((e) => e.frase.startsWith('Morgen ga ik'));
  if (!f) throw new Error('falta la frase');
  return f;
}

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

  it('si se falla una regla concreta, se explica y se pasa a la ronda', async () => {
    prepararNavegador();
    const terminados: [string, string[]][] = [];
    const ejercicioReal = ejercicioDeFrase(fraseDeMorgen(), 'traducir', { azar: crearAzar(1), vistos: new Set(), repeticiones: 1, formas: new Set(['traducir']) });
    await montar(
      <Escrito
        ejercicio={ejercicioReal as EjercicioTraducir}
        repeticion={false}
        voz={SIN_VOZ}
        diagnosticar={(r) => orden.diagnosticar?.(ejercicioReal, r) ?? []}
        onTerminar={(c, ds) => {
          terminados.push([c, (ds ?? []).map((d) => d.destreza)]);
        }}
      />,
    );
    const campo = document.querySelector<HTMLTextAreaElement>('textarea');
    if (!campo) throw new Error('falta el campo');
    escribirEn(campo, 'morgen ik ga naar mijn schoonouders');
    await pulsar(boton('Comprobar'));
    expect(enPantalla()).toContain('el verbo va antes que el sujeto');
    expect(enPantalla()).toContain('La regla completa');
    expect(document.querySelector('.diagnostico [lang="nl"]')).not.toBeNull();
    await pulsar(boton('Siguiente'));
    expect(terminados).toEqual([['otra_vez', ['inversion']]]);
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
