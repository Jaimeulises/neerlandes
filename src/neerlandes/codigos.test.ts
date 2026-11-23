// Los códigos permanentes y los ids fijos: que corregir el texto de algo no le
// cambie el id (y con él, el historial), que ningún código se repita ni se
// reutilice, y que ningún código pase en silencio a otra cosa.

import { describe, expect, it } from 'vitest';
import { normalizar } from '../motor';
import { DESTREZAS } from './destrezas';
import { IDS_FIJOS, RETIRADOS, ULTIMO_CODIGO } from './ids-fijos';
import { FRASES, GRUPOS_ORDEN } from './orden/datos';
import { crearFrase, ELEMENTOS_ORDEN } from './orden/pista';
import { elementosDeRevision } from './revision/elementos';
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

/** Todos los códigos en uso, también los que solo se revisan (R, E, T). */
const EN_USO: readonly string[] = elementosDeRevision().map((e) => e.codigo);

const numero = (codigo: string): number => Number(codigo.slice(1));

/** Cómo salía el id antes de la fase 1, del texto. Solo sirve aquí, de testigo: los ids de verdad salen de IDS_FIJOS. */
function idDeAntes(texto: string): string {
  return normalizar(texto)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter((p) => p !== '')
    .slice(0, 6)
    .join('-');
}

/**
 * Los códigos congelados cuyo texto o grupo ha cambiado a propósito desde la fase 1, con el motivo. Se apuntan en el
 * mismo commit que el cambio. Si la prueba de abajo señala un código que no debería estar aquí, el error está en los
 * datos (un código que ha pasado a otra frase, o uno reutilizado), nunca en IDS_FIJOS.
 */
const CAMBIADOS: Readonly<Record<string, string>> = {};

/** Los ids de destreza que ya están guardados en el historial: el nivel de cada regla sale de ellos. Solo se añade. */
const DESTREZAS_GUARDADAS = [
  'presente',
  'inversion',
  'modal',
  'perfectum-orden',
  'participio',
  'auxiliar',
  'niet',
  'preguntas',
  'vocabulario',
  'articulo',
  'participio-irregular',
  'separables',
  'subordinada',
  'subordinada-delante',
  'pasado',
];

describe('los códigos permanentes', () => {
  it('tienen la forma de su tipo y no se repiten', () => {
    for (const [tipo, codigos] of Object.entries(CODIGOS)) {
      for (const c of codigos) expect(c, c).toMatch(new RegExp(`^${tipo}[1-9]\\d*$`));
      expect(new Set(codigos).size, tipo).toBe(codigos.length);
    }
    expect(new Set(EN_USO).size).toBe(EN_USO.length);
  });

  it('cada código fijo sigue en los datos o está retirado, nunca las dos cosas', () => {
    const enDatos = new Set(Object.values(CODIGOS).flat());
    for (const c of Object.keys(IDS_FIJOS)) expect(enDatos.has(c) || RETIRADOS.includes(c), c).toBe(true);
    for (const c of RETIRADOS) expect(EN_USO.includes(c), c).toBe(false);
  });

  it('cada número hasta el último dado está en uso o retirado: lo borrado no se reutiliza y lo nuevo lleva el siguiente', () => {
    for (const c of EN_USO) expect(numero(c), `${c}: sube ULTIMO_CODIGO.${c[0] ?? ''}`).toBeLessThanOrEqual(ULTIMO_CODIGO[c[0] as keyof typeof ULTIMO_CODIGO]);
    for (const [tipo, ultimo] of Object.entries(ULTIMO_CODIGO)) {
      for (let n = 1; n <= ultimo; n++) {
        const c = `${tipo}${String(n)}`;
        expect(EN_USO.includes(c) || RETIRADOS.includes(c), `${c}: si se ha borrado, va a RETIRADOS`).toBe(true);
      }
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

  it('cada código fijo sigue apuntando a lo mismo que cuando se congeló, salvo los cambios apuntados en CAMBIADOS', () => {
    // El testigo: el id que saldría del texto y el grupo de hoy con la regla de antes de la fase 1.
    const deAntes = new Map<string, string>([
      ...FRASES.map((f): [string, string] => [f.codigo, `${f.grupo}:${idDeAntes(f.fichas.split('|').map((x) => x.trim()).join(' '))}`]),
      ...PALABRAS.map((p): [string, string] => [p.codigo, `${p.grupo}:${idDeAntes(p.nl)}`]),
      ...VERBOS.map((v): [string, string] => [v.codigo, v.inf]),
      ...SEPARABLES.map((s): [string, string] => [s.codigo, s.inf]),
    ]);
    for (const [codigo, fijo] of Object.entries(IDS_FIJOS)) {
      if (CAMBIADOS[codigo] !== undefined || RETIRADOS.includes(codigo)) continue;
      expect(deAntes.get(codigo), `${codigo}: si se ha corregido a propósito, apúntalo en CAMBIADOS`).toBe(fijo);
    }
    // Lo apuntado como cambiado tiene que haberlo hecho de verdad: si no, sobra.
    for (const codigo of Object.keys(CAMBIADOS)) expect(deAntes.get(codigo), codigo).not.toBe(IDS_FIJOS[codigo]);
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

  it('la primera frase de cada grupo es nueva o ya era de ese grupo: si no, quien ya la vio nunca vería la regla del grupo', () => {
    for (const grupo of GRUPOS_ORDEN) {
      const primera = ELEMENTOS_ORDEN.find((e) => e.grupo === grupo);
      if (!primera) throw new Error(grupo);
      expect(primera.id === primera.codigo || primera.id.startsWith(`${grupo}:`), `${grupo}: ${primera.codigo}`).toBe(true);
    }
  });

  it('los ids de destreza no cambian: el nivel de cada regla sale del historial guardado con ellos', () => {
    const ids = DESTREZAS.map((d) => d.id);
    for (const id of DESTREZAS_GUARDADAS) expect(ids, id).toContain(id);
  });
});
