// Lo mínimo para probar pantallas de verdad en jsdom sin añadir dependencias: montar un componente,
// buscar un botón por lo que dice, pulsarlo y esperar a que React y las promesas terminen. También pone
// lo que jsdom no trae (el audio, el desplazamiento de la página, el lienzo). Solo lo usan las pruebas.

import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Las rutas que han sonado, en orden, desde la última limpieza. */
export const sonadas: string[] = [];

/** Un Audio de mentira que apunta lo que suena. */
class AudioDePrueba extends EventTarget {
  src = '';
  currentTime = 0;
  playbackRate = 1;
  preservesPitch = true;

  pause(): void {
    this.dispatchEvent(new Event('pause'));
  }

  play(): Promise<void> {
    sonadas.push(this.src);
    this.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  }
}

const montados: { raiz: Root; contenedor: HTMLElement }[] = [];

/** Deja el navegador de mentira listo y vacío: sin nada montado, sin nada guardado y sin sonidos apuntados. */
export function prepararNavegador(): void {
  limpiar();
  Object.defineProperty(globalThis, 'Audio', { value: AudioDePrueba, configurable: true, writable: true });
  Object.defineProperty(window, 'scrollTo', { value: () => undefined, configurable: true, writable: true });
  Object.defineProperty(Element.prototype, 'scrollIntoView', { value: () => undefined, configurable: true, writable: true });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => null, configurable: true, writable: true });
  localStorage.clear();
  sonadas.length = 0;
}

/** Desmonta todo lo montado y vacía la página. */
export function limpiar(): void {
  for (const { raiz, contenedor } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    contenedor.remove();
  }
  document.body.replaceChildren();
}

/** Deja que terminen las promesas pendientes (leer el almacén, guardar) y lo que React tenga a medias. */
export async function esperar(): Promise<void> {
  await act(async () => {
    await new Promise((listo) => setTimeout(listo, 0));
  });
}

/** Monta un componente en la página y espera a que cargue. */
export async function montar(elemento: ReactElement): Promise<HTMLElement> {
  const contenedor = document.createElement('div');
  document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  montados.push({ raiz, contenedor });
  act(() => {
    raiz.render(elemento);
  });
  await esperar();
  return contenedor;
}

/** Todo el texto que hay en pantalla. */
export function enPantalla(): string {
  return document.body.textContent;
}

function dice(el: Element, texto: string | RegExp): boolean {
  const contenido = `${el.getAttribute('aria-label') ?? ''} ${el.textContent}`;
  return typeof texto === 'string' ? contenido.includes(texto) : texto.test(contenido);
}

/** El botón que dice eso (en su texto o en su etiqueta), o null. */
export function buscarBoton(texto: string | RegExp): HTMLButtonElement | null {
  return [...document.querySelectorAll('button')].find((b) => dice(b, texto)) ?? null;
}

/** El botón que dice eso. Si no está, falla diciendo qué botones hay. */
export function boton(texto: string | RegExp): HTMLButtonElement {
  const encontrado = buscarBoton(texto);
  if (!encontrado) {
    const hay = [...document.querySelectorAll('button')].map((b) => `«${(b.getAttribute('aria-label') ?? b.textContent).trim().slice(0, 40)}»`).join(', ');
    throw new Error(`No hay ningún botón que diga ${String(texto)}. Hay: ${hay}`);
  }
  return encontrado;
}

/** Pulsa y espera a que la pantalla se asiente. */
export async function pulsar(el: HTMLElement): Promise<void> {
  act(() => {
    el.click();
  });
  await esperar();
}

/** Pulsa una tecla sobre lo que tiene el foco (o sobre la página). Devuelve false si alguien la canceló. */
export function teclear(tecla: string, opciones: KeyboardEventInit = {}): boolean {
  const destino = document.activeElement ?? document.body;
  let seguida = true;
  act(() => {
    seguida = destino.dispatchEvent(new KeyboardEvent('keydown', { key: tecla, bubbles: true, cancelable: true, ...opciones }));
  });
  return seguida;
}

/** Escribe en un campo de texto como lo haría el alumno (pegando o tecleando). */
export function escribirEn(campo: HTMLTextAreaElement | HTMLInputElement, valor: string): void {
  // React vigila el valor del campo: hay que ponerlo con el «setter» del navegador para que note el cambio.
  const prototipo = campo instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Reflect.set(prototipo, 'value', valor, campo);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
