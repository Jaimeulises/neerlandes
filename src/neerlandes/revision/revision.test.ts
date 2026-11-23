import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DESTREZAS, FALTA_PARA_B2 } from '../destrezas';
import { EJEMPLOS_DE_ERROR } from '../diagnostico/ejemplos';
import { FRASES, REGLAS_ORDEN } from '../orden/datos';
import { ELEMENTOS_ORDEN } from '../orden/pista';
import { SEPARABLES, VERBOS } from '../verbos/datos';
import { REGLAS_VERBOS } from '../verbos/pista';
import { PALABRAS } from '../vocabulario/datos';
import { documentoDeRevision, repartirEnLotes, SEGUNDOS_POR_LOTE, segundosDe } from './documento';
import { elementosDeRevision, huellaDe, textoVisible, type ElementoRevision } from './elementos';
import { estaRevisado, leerCodigos, marcar, quitar, tramos, type Registro } from './estado';
import REVISADO from './revisado.json';

const ELEMENTOS = elementosDeRevision();
const CODIGOS = ELEMENTOS.map((e) => e.codigo);

function elemento(codigo: string): ElementoRevision {
  const e = ELEMENTOS.find((x) => x.codigo === codigo);
  if (!e) throw new Error(`Sin ${codigo}`);
  return e;
}

/** El mismo elemento con lo que se lee cambiado, como si se hubiera corregido. */
function corregido(e: ElementoRevision, de: string, a: string): ElementoRevision {
  return { ...e, lineas: e.lineas.map((l) => l.replace(de, a)) };
}

describe('el documento de revisión', () => {
  it('está al día con el contenido y lo revisado (si falla: npm run revision)', () => {
    const enDisco = readFileSync(new URL('../../../docs/revision.md', import.meta.url), 'utf8');
    expect(enDisco).toBe(documentoDeRevision());
  });

  it('sin nada revisado, trae todo el texto con neerlandés que enseña la app: las reglas y las pistas', () => {
    const documento = documentoDeRevision({});
    for (const regla of [...Object.values(REGLAS_ORDEN), ...Object.values(REGLAS_VERBOS)]) expect(documento).toContain(regla);
    for (const f of ELEMENTOS_ORDEN) if (f.pista) expect(documento, f.id).toContain(f.pista);
    for (const d of DESTREZAS) expect(documento, d.id).toContain(d.descripcion);
  });

  it('lo revisado ya no sale entero: solo su código, en Ya revisado', () => {
    const registro = marcar({}, ELEMENTOS, ['O1', 'O2', 'O3', 'V1'], '2026-11-23');
    const documento = documentoDeRevision(registro);
    expect(documento).not.toContain(elemento('O1').lineas[0]);
    expect(documento).not.toContain(elemento('V1').lineas[0]);
    expect(documento).toContain(elemento('O4').lineas[0]);
    expect(documento).toContain('- Orden de la frase: O1 a O3');
    expect(documento).toContain('- Verbos: V1');
  });

  it('no lleva rayas largas ni medias', () => {
    expect(documentoDeRevision({})).not.toMatch(/[–—]/);
  });
});

describe('lo que se revisa', () => {
  it('cada código sale una vez y con la forma de su tipo', () => {
    expect(new Set(CODIGOS).size).toBe(CODIGOS.length);
    for (const e of ELEMENTOS) expect(e.codigo, e.codigo).toMatch(new RegExp(`^${e.tipo}[1-9]\\d*$`));
  });

  it('están todas las frases, verbos, separables, palabras, reglas, explicaciones y textos', () => {
    const esperados = [
      ...FRASES.map((f) => f.codigo),
      ...VERBOS.map((v) => v.codigo),
      ...SEPARABLES.map((s) => s.codigo),
      ...PALABRAS.map((p) => p.codigo),
      ...EJEMPLOS_DE_ERROR.map((e) => e.codigo),
      ...FALTA_PARA_B2.map((f) => f.codigo),
    ];
    for (const c of esperados) expect(CODIGOS, c).toContain(c);
    const reglas = ELEMENTOS.filter((e) => e.tipo === 'R');
    expect(reglas).toHaveLength(Object.keys(REGLAS_ORDEN).length + Object.keys(REGLAS_VERBOS).length);
    for (const d of DESTREZAS) expect(ELEMENTOS.some((e) => e.tipo === 'T' && textoVisible(e).includes(d.descripcion)), d.id).toBe(true);
  });

  it('la huella sale de lo que se lee: no cambia con el formato, sí con el texto', () => {
    const o1 = elemento('O1');
    const conOtroFormato = { ...o1, lineas: o1.lineas.map((l) => l.replaceAll('*También:*', '**También:**').replaceAll(' | ', '|')) };
    expect(huellaDe(conOtroFormato)).toBe(huellaDe(o1));
    expect(huellaDe(corregido(o1, 'Morgen ga', 'Overmorgen ga'))).not.toBe(huellaDe(o1));
  });
});

describe('lo revisado', () => {
  it('cada código de revisado.json existe (si no: npm run revisado -- --quitar <código>)', () => {
    const registro: Registro = REVISADO;
    for (const [codigo, r] of Object.entries(registro)) {
      expect(CODIGOS, codigo).toContain(codigo);
      expect(r.huella, codigo).toMatch(/^[0-9a-f]{8}$/);
      expect(r.el, codigo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('vuelve a pendiente si cambia lo que se lee', () => {
    const registro = marcar({}, ELEMENTOS, ['O1'], '2026-11-23');
    expect(estaRevisado(elemento('O1'), registro)).toBe(true);
    expect(estaRevisado(elemento('O2'), registro)).toBe(false);
    expect(estaRevisado(corregido(elemento('O1'), 'Morgen ga', 'Overmorgen ga'), registro)).toBe(false);
  });

  it('se marca y se desmarca por códigos sueltos y rangos de un mismo tipo', () => {
    expect(leerCodigos(['O1-O3', 'v2', 'R1,T25'], CODIGOS)).toEqual(['O1', 'O2', 'O3', 'R1', 'V2', 'T25']);
    expect(() => leerCodigos(['O999'], CODIGOS)).toThrow('No existe');
    expect(() => leerCodigos(['O1-V3'], CODIGOS)).toThrow('mismo tipo');
    expect(() => leerCodigos(['O5-O1'], CODIGOS)).toThrow('al revés');
    const registro = marcar({}, ELEMENTOS, ['O2', 'O1'], '2026-11-23');
    expect(Object.keys(registro)).toEqual(['O1', 'O2']);
    expect(registro.O1).toEqual({ huella: huellaDe(elemento('O1')), el: '2026-11-23' });
    expect(Object.keys(quitar(registro, ['O1']))).toEqual(['O2']);
  });

  it('junta los códigos seguidos en tramos, para leer y para la orden', () => {
    expect(tramos(['O3', 'O1', 'O2', 'O5', 'V1'])).toBe('O1 a O3, O5, V1');
    expect(tramos(['O3', 'O1', 'O2', 'O5', 'R2'], '-', ' ')).toBe('O1-O3 O5 R2');
  });
});

describe('los lotes', () => {
  const lotes = repartirEnLotes(ELEMENTOS);
  const segundos = (lote: readonly ElementoRevision[]) => lote.reduce((suma, e) => suma + segundosDe(e), 0);

  it('reparten todo lo pendiente, en orden y sin partir nada', () => {
    expect(lotes.flat()).toEqual(ELEMENTOS);
  });

  it('no pasan de 15 minutos', () => {
    for (const lote of lotes) expect(segundos(lote), lote[0]?.codigo).toBeLessThanOrEqual(SEGUNDOS_POR_LOTE);
  });

  it('una regla no cierra un lote: va con las frases que la siguen', () => {
    for (const lote of lotes.slice(0, -1)) expect(lote.at(-1)?.tipo, lote.at(-1)?.codigo).not.toBe('R');
  });

  it('un elemento más largo que el límite va solo en su lote', () => {
    const [o1, o2] = [elemento('O1'), elemento('O2')];
    expect(repartirEnLotes([o1, o2], 1)).toEqual([[o1], [o2]]);
  });
});
