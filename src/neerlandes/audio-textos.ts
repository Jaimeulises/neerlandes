// Todo lo que la app puede leer en voz alta, para grabarlo antes
// (`npm run audio`). Los ejercicios eligen al azar el sujeto o la forma que
// preguntan, así que se crean muchas veces con semillas fijas, con cada forma
// de ejercicio, hasta ver todas las variantes. Una prueba comprueba con otras
// semillas que no se escapa ninguna.

import { crearAzar, TODAS_LAS_FORMAS, type Ejercicio } from '../motor';
import { FRASE_DE_PRUEBA } from './audio';
import { PISTAS } from './paquete';

const REPETICIONES = [0, 1, 2, 3, 5, 8] as const;

/** Lo que suena de un ejercicio, con las mismas reglas que sus pantallas (src/ui/ejercicios). */
export function textosDeEjercicio(e: Ejercicio): string[] {
  const textos: (string | undefined)[] = [e.audio];
  if (e.forma === 'opcion' && e.enunciadoEnIdioma && !e.enunciado.includes('___')) textos.push(e.enunciado);
  if (e.forma === 'ordenar') textos.push(e.frase);
  if (e.forma === 'dictado') textos.push(e.dictar);
  if (e.forma === 'decir') textos.push(e.texto);
  return textos.filter((t): t is string => t !== undefined && t.trim() !== '');
}

/** Los textos en neerlandés que pueden sonar, sin repetir y ordenados. */
export function textosEnVozAlta(semillas = 20, primeraSemilla = 1): string[] {
  const textos = new Set<string>([FRASE_DE_PRUEBA]);
  const conjuntos: ReadonlySet<Ejercicio['forma']>[] = [TODAS_LAS_FORMAS, ...[...TODAS_LAS_FORMAS].map((f) => new Set([f]))];
  for (const pista of PISTAS) {
    const vistos = new Set(pista.elementos.map((e) => e.id));
    for (const elemento of pista.elementos) {
      const audio = pista.presentar?.(elemento)?.audio;
      if (audio !== undefined && audio.trim() !== '') textos.add(audio);
      for (const formas of conjuntos) {
        for (const repeticiones of REPETICIONES) {
          for (let semilla = primeraSemilla; semilla < primeraSemilla + semillas; semilla++) {
            const ejercicio = pista.crearEjercicio(elemento, { azar: crearAzar(semilla), vistos, repeticiones, formas });
            for (const t of textosDeEjercicio(ejercicio)) textos.add(t);
          }
        }
      }
    }
  }
  return [...textos].sort();
}
