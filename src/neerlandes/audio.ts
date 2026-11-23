// El audio grabado de lo que la app lee en voz alta. Se graba una vez en el
// ordenador con una voz neuronal de Azure (`npm run audio`) y va dentro de la
// app, en public/audio: la app no habla con ningún servidor. Cada archivo se
// llama por una huella del texto, así la grabación solo produce lo que falta
// y la app sabe si existe mirando el manifiesto, que escribe el script. Lo que
// no tenga audio grabado lo lee la voz del dispositivo.

import datos from './audio-manifiesto.json';
import { huella } from './comun';

export interface ManifiestoAudio {
  /** La voz de Azure, por ejemplo nl-NL-FennaNeural. Vacía si no hay nada grabado. */
  readonly voz: string;
  /** Su nombre para enseñarlo, por ejemplo Fenna. */
  readonly nombre: string;
  /** La velocidad con que se grabó, en SSML (-10%). */
  readonly velocidad: string;
  /** Las huellas de los textos grabados. */
  readonly archivos: readonly string[];
}

const MANIFIESTO: ManifiestoAudio = datos;

/** Lo que suena al tocar Probar en Ajustes. */
export const FRASE_DE_PRUEBA = 'Goedemorgen! Hoe gaat het met je?';

/** Huella FNV-1a de 32 bits del texto, en hexadecimal. La usa también el script que graba. */
export function huellaAudio(texto: string): string {
  return huella(texto);
}

/** Nombre de la voz grabada, o null si no hay audio grabado. */
export function vozGrabada(manifiesto: ManifiestoAudio = MANIFIESTO): string | null {
  return manifiesto.archivos.length > 0 && manifiesto.nombre !== '' ? manifiesto.nombre : null;
}

const GRABADOS: ReadonlySet<string> = new Set(MANIFIESTO.archivos);

/** Ruta del audio grabado de un texto (relativa, como el resto de la app), o null si no lo hay. */
export function audioDe(texto: string, grabados: ReadonlySet<string> = GRABADOS): string | null {
  const huella = huellaAudio(texto);
  return grabados.has(huella) ? `audio/${huella}.mp3` : null;
}
