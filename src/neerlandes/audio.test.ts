// El audio grabado: huellas estables, rutas solo de lo grabado y una lista de
// textos que no deja ninguno fuera.

import { describe, expect, it } from 'vitest';
import { audioDe, FRASE_DE_PRUEBA, huellaAudio, vozGrabada } from './audio';
import { textosEnVozAlta } from './audio-textos';

describe('audio grabado', () => {
  it('la huella es FNV-1a de 32 bits sobre UTF-8', () => {
    expect(huellaAudio('a')).toBe('e40c292c');
    expect(huellaAudio('')).toBe('811c9dc5');
    expect(huellaAudio('één')).toMatch(/^[0-9a-f]{8}$/);
    expect(huellaAudio('één')).not.toBe(huellaAudio('een'));
  });

  it('solo da ruta a lo que está grabado', () => {
    const grabados = new Set([huellaAudio('Ik ben moe.')]);
    expect(audioDe('Ik ben moe.', grabados)).toBe(`audio/${huellaAudio('Ik ben moe.')}.mp3`);
    expect(audioDe('Ik ben niet moe.', grabados)).toBeNull();
  });

  it('sin nada grabado no hay voz grabada', () => {
    expect(vozGrabada({ voz: '', nombre: '', velocidad: '', archivos: [] })).toBeNull();
    expect(vozGrabada({ voz: 'nl-NL-FennaNeural', nombre: 'Fenna', velocidad: '-10%', archivos: ['e40c292c'] })).toBe('Fenna');
  });

  it('la lista de textos no deja fuera nada que salga con otras semillas', () => {
    const lista = new Set(textosEnVozAlta());
    expect(lista.has(FRASE_DE_PRUEBA)).toBe(true);
    const otras = textosEnVozAlta(10, 5000).filter((t) => !lista.has(t));
    expect(otras).toEqual([]);
  });
});
