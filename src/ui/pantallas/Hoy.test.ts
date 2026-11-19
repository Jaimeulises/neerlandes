// Lo que Hoy dice de la ronda, con el singular y el plural bien puestos.

import { describe, expect, it } from 'vitest';
import { textoDeRonda } from './Hoy';

describe('el texto de la ronda de hoy', () => {
  it('cuenta repasos y cosas nuevas, y lo que queda para otra ronda', () => {
    expect(textoDeRonda(0, 0, 0)).toBe('Nada pendiente por hoy.');
    expect(textoDeRonda(0, 4, 0)).toBe('4 cosas nuevas.');
    expect(textoDeRonda(1, 1, 1)).toBe('1 repaso y 1 cosa nueva.');
    expect(textoDeRonda(8, 0, 9)).toBe('8 repasos. Queda 1 por repasar para otra ronda.');
    expect(textoDeRonda(12, 0, 15)).toBe('12 repasos. Quedan 3 por repasar para otra ronda.');
  });
});
