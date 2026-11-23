// Los códigos permanentes y los ids fijos: que corregir el texto de algo no le
// cambie el id (y con él, el historial), y que ningún código se repita ni se
// reutilice.

import { describe, expect, it } from 'vitest';
import { IDS_FIJOS, RETIRADOS } from './ids-fijos';
import { FRASES } from './orden/datos';
import { crearFrase, ELEMENTOS_ORDEN } from './orden/pista';
import { SEPARABLES, VERBOS } from './verbos/datos';
import { ELEMENTOS_VERBOS, fraseDeSeparable } from './verbos/pista';
import { PALABRAS } from './vocabulario/datos';
import { crearPalabra, ELEMENTOS_VOCABULARIO } from './vocabulario/pista';

const CODIGOS: Readonly<Record<string, readonly string[]>> = {
  O: FRASES.map((f) => f.codigo),
  V: VERBOS.map((v) => v.codigo),
  S: SEPARABLES.map((s) => s.codigo),
  P: PALABRAS.map((p) => p.codigo),
};

const numero = (codigo: string): number => Number(codigo.slice(1));

describe('los códigos permanentes', () => {
  it('tienen la forma de su tipo y no se repiten', () => {
    for (const [tipo, codigos] of Object.entries(CODIGOS)) {
      for (const c of codigos) expect(c, c).toMatch(new RegExp(`^${tipo}[1-9]\\d*$`));
      expect(new Set(codigos).size, tipo).toBe(codigos.length);
    }
  });

  it('cada código fijo sigue en los datos o está retirado, nunca las dos cosas', () => {
    const enDatos = new Set(Object.values(CODIGOS).flat());
    for (const c of Object.keys(IDS_FIJOS)) expect(enDatos.has(c) || RETIRADOS.includes(c), c).toBe(true);
    for (const c of RETIRADOS) expect(enDatos.has(c), c).toBe(false);
  });

  it('lo nuevo usa un número mayor que todos los fijos de su tipo, para no heredar un historial ajeno', () => {
    for (const [tipo, codigos] of Object.entries(CODIGOS)) {
      const fijos = [...Object.keys(IDS_FIJOS), ...RETIRADOS].filter((c) => c.startsWith(tipo)).map(numero);
      const mayorFijo = Math.max(0, ...fijos);
      for (const c of codigos.filter((x) => IDS_FIJOS[x] === undefined)) expect(numero(c), c).toBeGreaterThan(mayorFijo);
    }
  });
});

describe('los ids fijos', () => {
  it('son los de antes de la fase 1: el progreso guardado sigue valiendo', () => {
    for (const f of ELEMENTOS_ORDEN) if (IDS_FIJOS[f.codigo]) expect(f.id, f.codigo).toBe(IDS_FIJOS[f.codigo]);
    for (const p of ELEMENTOS_VOCABULARIO) if (IDS_FIJOS[p.codigo]) expect(p.id, p.codigo).toBe(IDS_FIJOS[p.codigo]);
    for (const e of ELEMENTOS_VERBOS) {
      const codigo = e.verbo?.codigo ?? e.separable?.codigo ?? '';
      const fijo = IDS_FIJOS[codigo];
      if (fijo) expect(e.id, codigo).toBe(`${e.grupo}:${fijo}`);
    }
    for (const s of SEPARABLES) if (IDS_FIJOS[s.codigo]) expect(fraseDeSeparable(s).id, s.codigo).toBe(`separables:${IDS_FIJOS[s.codigo]}`);
    // Unos pocos a mano, por si se regenerara la tabla con otra regla.
    expect(ELEMENTOS_ORDEN[0]?.id).toBe('inversion:morgen-ga-ik-naar-mijn-schoonouders');
    expect(ELEMENTOS_VOCABULARIO[0]?.id).toBe('gente:de-vriendin');
    expect(ELEMENTOS_VERBOS.some((e) => e.id === 'presente:werken')).toBe(true);
  });

  it('no cambian al corregir el texto ni al mover algo de grupo', () => {
    const frase = FRASES[0];
    const palabra = PALABRAS[0];
    if (!frase || !palabra) throw new Error('sin datos');
    const corregida = crearFrase({ ...frase, fichas: 'morgen|ga|ik|naar mijn ouders', grupo: 'modal' });
    expect(corregida.id).toBe(crearFrase(frase).id);
    expect(crearPalabra({ ...palabra, nl: 'de partner', grupo: 'casa' }).id).toBe(crearPalabra(palabra).id);
  });

  it('lo nuevo usa su código como id', () => {
    const frase = FRASES[0];
    if (!frase) throw new Error('sin datos');
    expect(crearFrase({ ...frase, codigo: 'O999' }).id).toBe('O999');
  });
});
