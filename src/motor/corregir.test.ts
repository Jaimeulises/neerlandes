import { describe, expect, it } from 'vitest';
import { calificacionDe, comoFrase, corregir, normalizar } from './corregir';

const VALIDAS = ['Morgen ga ik naar mijn schoonouders.', 'Ik ga morgen naar mijn schoonouders.'];

describe('corregir una respuesta escrita', () => {
  it('no cuentan mayúsculas, puntuación ni espacios de más', () => {
    expect(corregir('  morgen GA ik naar mijn schoonouders ', VALIDAS).veredicto).toBe('exacta');
    expect(corregir('Morgen, ga ik naar mijn schoonouders!', VALIDAS).veredicto).toBe('exacta');
  });

  it('vale cualquiera de las respuestas buenas y dice cuál', () => {
    const c = corregir('ik ga morgen naar mijn schoonouders', VALIDAS);
    expect(c.veredicto).toBe('exacta');
    expect(c.cercana).toBe(VALIDAS[1]);
  });

  it('el orden del inglés se reconoce como fallo de orden y marca lo que está fuera de sitio', () => {
    const c = corregir('Morgen ik ga naar mijn schoonouders', VALIDAS);
    expect(c.veredicto).toBe('orden');
    expect(calificacionDe(c.veredicto)).toBe('otra_vez');
    expect(c.dada.some((m) => m.estado === 'sobra')).toBe(true);
    expect(c.esperada.some((m) => m.estado === 'falta')).toBe(true);
  });

  it('una letra de menos en el verbo es un fallo, no una errata', () => {
    const c = corregir('Morgen gaat ik naar mijn schoonouders', VALIDAS);
    expect(c.veredicto).toBe('distinta');
    expect(c.dada.find((m) => m.estado === 'sobra')?.texto).toBe('gaat');
    expect(c.esperada.find((m) => m.estado === 'falta')?.texto).toBe('ga');
  });

  it('las tildes y diéresis que faltan se dan por buenas', () => {
    const c = corregir('een keer', ['één keer']);
    expect(c.veredicto).toBe('tildes');
    expect(calificacionDe(c.veredicto)).toBe('bien');
  });

  it('sin escribir nada no se da por buena', () => {
    expect(corregir('   ', VALIDAS).veredicto).toBe('vacia');
  });

  it('las marcas conservan las mayúsculas y la puntuación de cada frase', () => {
    const c = corregir('Morgen ik ga naar mijn schoonouders', VALIDAS);
    expect(c.esperada.map((m) => m.texto).join(' ')).toBe('Morgen ga ik naar mijn schoonouders.');
    expect(c.dada[0]?.texto).toBe('Morgen');
  });

  it('compara con la respuesta más parecida', () => {
    const c = corregir('ik ga morgen naar mijn ouders', VALIDAS);
    expect(c.veredicto).toBe('distinta');
    expect(c.cercana).toBe(VALIDAS[1]);
  });

  it('los apóstrofos curvos y rectos son lo mismo', () => {
    expect(normalizar('’s avonds')).toBe("'s avonds");
  });
});

describe('frases con mayúscula y punto', () => {
  it('pone mayúscula y punto', () => {
    expect(comoFrase('ik werk thuis')).toBe('Ik werk thuis.');
    expect(comoFrase('werk jij morgen', '?')).toBe('Werk jij morgen?');
    expect(comoFrase('Dat klopt.')).toBe('Dat klopt.');
  });

  it("con «'s avonds» la mayúscula va en la palabra siguiente", () => {
    expect(comoFrase("'s avonds kijken we samen een serie")).toBe("'s Avonds kijken we samen een serie.");
  });
});
