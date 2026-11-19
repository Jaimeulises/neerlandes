// Azar con semilla (mulberry32). La app usa una semilla distinta en cada ronda
// y las pruebas una fija, para que den siempre el mismo resultado.
// Viene de Michi, la app de japonés del mismo autor.

export interface Azar {
  /** Número en [0, 1). */
  siguiente(): number;
  /** Entero en [0, maximo). */
  entero(maximo: number): number;
  /** Copia barajada; no cambia la lista original. */
  barajar<T>(lista: readonly T[]): T[];
  /** Un elemento al azar, o undefined si la lista está vacía. */
  elegir<T>(lista: readonly T[]): T | undefined;
}

/** Una semilla distinta cada vez, para las rondas de verdad. */
export function semillaNueva(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

export function crearAzar(semilla: number): Azar {
  let estado = semilla >>> 0;

  const siguiente = (): number => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const entero = (maximo: number): number => Math.floor(siguiente() * maximo);

  const barajar = <T>(lista: readonly T[]): T[] => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = entero(i + 1);
      [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
    }
    return copia;
  };

  const elegir = <T>(lista: readonly T[]): T | undefined => lista[entero(lista.length)];

  return { siguiente, entero, barajar, elegir };
}
