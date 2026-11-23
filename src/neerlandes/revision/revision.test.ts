import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DESTREZAS, FALTA_PARA_B2 } from '../destrezas';
import { EJEMPLOS_DE_ERROR } from '../diagnostico/ejemplos';
import { FRASES, REGLAS_ORDEN } from '../orden/datos';
import { ELEMENTOS_ORDEN } from '../orden/pista';
import { SEPARABLES, VERBOS } from '../verbos/datos';
import { REGLAS_VERBOS } from '../verbos/pista';
import { PALABRAS } from '../vocabulario/datos';
import { documentoDeRevision, pintarElemento, repartirEnLotes, SEGUNDOS_POR_LOTE, segundosDe } from './documento';
import { elementosDeRevision, huellaDe, textosDe, type ElementoRevision } from './elementos';
import { cambiadosDesdeQueSeLeyo, estaRevisado, huellasDe, leerCodigos, leerLote, lineaDeLote, marcar, quitar, serializarRegistro, tramos, type Registro } from './estado';
import REVISADO from './revisado.json';

const ELEMENTOS = elementosDeRevision();
const CODIGOS = ELEMENTOS.map((e) => e.codigo);
/** Las huellas de ahora, como si se hubiera leído todo tal como está. */
const AHORA = huellasDe(ELEMENTOS);

function elemento(codigo: string): ElementoRevision {
  const e = ELEMENTOS.find((x) => x.codigo === codigo);
  if (!e) throw new Error(`Sin ${codigo}`);
  return e;
}

/** El mismo elemento con cada texto de su contenido pasado por `cambio`, como si se hubiera corregido. */
function conContenido(e: ElementoRevision, cambio: (texto: string) => string): ElementoRevision {
  const cambiar = (v: unknown): unknown =>
    typeof v === 'string' ? cambio(v) : Array.isArray(v) ? v.map(cambiar) : typeof v === 'object' && v !== null ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cambiar(x)])) : v;
  return { ...e, contenido: cambiar(e.contenido) } as ElementoRevision;
}

const corregido = (e: ElementoRevision, de: string, a: string): ElementoRevision => conContenido(e, (t) => t.replace(de, a));

describe('el documento de revisión', () => {
  const documento = documentoDeRevision({});

  it('está al día con el contenido y lo revisado (si falla: npm run revision)', () => {
    const enDisco = readFileSync(new URL('../../../docs/revision.md', import.meta.url), 'utf8');
    expect(enDisco).toBe(documentoDeRevision());
  });

  it('sin nada revisado, trae todo el texto con neerlandés que enseña la app: las reglas y las pistas', () => {
    for (const regla of [...Object.values(REGLAS_ORDEN), ...Object.values(REGLAS_VERBOS)]) expect(documento).toContain(regla);
    for (const f of ELEMENTOS_ORDEN) if (f.pista) expect(documento, f.id).toContain(f.pista);
    for (const d of DESTREZAS) expect(documento, d.id).toContain(d.descripcion);
  });

  it('lo revisado ya no sale entero: solo su código, en Ya revisado', () => {
    const registro = marcar({}, AHORA, ['O1', 'O2', 'O3', 'V1'], '2026-11-23');
    const conRevisados = documentoDeRevision(registro);
    expect(conRevisados).not.toContain('**O1.**');
    expect(conRevisados).not.toContain('**V1. ');
    expect(conRevisados).toContain('**O4.**');
    expect(conRevisados).toContain('- Orden de la frase: O1 a O3');
    expect(conRevisados).toContain('- Verbos: V1');
  });

  it('los lotes se llaman por sus códigos: su número cambiaría al marcar o corregir otros', () => {
    expect(documento).toMatch(/^## Lote O1 a O\d+/m);
    expect(documento).not.toMatch(/^## Lote \d/m);
    expect(documento).toMatch(/^Se marca con: `npm run revisado -- O1-O\d+ [^`]* --lote [0-9a-f]{8}`$/m);
    // Y en singular cuando es uno.
    expect(documento).not.toContain('unos 1 minutos');
  });

  it('se lee bien en el móvil y en papel: sin tablas en los lotes y cada forma en su línea', () => {
    expect(documento).not.toMatch(/^\| [ORVSPET]\d/m);
    expect(documento).not.toContain('<br>');
    const o10 = pintarElemento(elemento('O10'));
    if (elemento('O10').tipo !== 'O') throw new Error('O10');
    for (const linea of o10) expect(linea.length, linea).toBeLessThan(200);
  });

  it('las instrucciones en neerlandés van arriba, y las de quien aplica las correcciones, al final', () => {
    const neerlandes = documento.indexOf('**Voor wie dit nakijkt.**');
    expect(neerlandes).toBeGreaterThan(0);
    expect(neerlandes).toBeLessThan(documento.indexOf('## Resumen'));
    expect(documento.indexOf('## Para quien aplica las correcciones')).toBeGreaterThan(documento.indexOf('## Ya revisado'));
    // Pide lo caro (las formas que faltan), cronometrar el primer bloque y apuntar códigos.
    expect(documento).toContain('staan alle natuurlijke manieren om het te zeggen erbij?');
    expect(documento).toContain('schrijf op hoeveel minuten het eerste blok je kost');
  });

  it('no lleva rayas largas ni medias', () => {
    expect(documento).not.toMatch(/[\u2013\u2014]/);
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
    for (const d of DESTREZAS) expect(ELEMENTOS.some((e) => e.tipo === 'T' && e.contenido.texto.includes(d.descripcion)), d.id).toBe(true);
  });

  it('va por fases: primero el orden, los verbos y las pistas, cada explicación detrás de lo suyo; al final palabras y textos', () => {
    const pos = (codigo: string): number => CODIGOS.indexOf(codigo);
    const ultimaDeFase1 = ELEMENTOS.map((e) => e.fase).lastIndexOf(1);
    expect(ELEMENTOS.findIndex((e) => e.fase === 2)).toBeGreaterThan(ultimaDeFase1);
    // E1 va sobre O1 (inversión): detrás de las frases de su grupo y antes de la regla del siguiente.
    expect(pos('E1')).toBeGreaterThan(pos('O8'));
    expect(pos('E1')).toBeLessThan(pos('R2'));
    // Las de los verbos, detrás de los verbos; las del artículo, con las palabras.
    expect(pos('E24')).toBeGreaterThan(pos(VERBOS.at(-1)?.codigo ?? ''));
    expect(pos('E24')).toBeLessThan(pos('R13'));
    expect(pos('E41')).toBeGreaterThan(pos('P1'));
    expect(pos('T26')).toBeLessThan(pos('P1'));
    expect(pos('T1')).toBeGreaterThan(pos(PALABRAS.at(-1)?.codigo ?? ''));
    expect(elemento('E41').fase).toBe(2);
  });

  it('lo que se pinta es todo el contenido: nada de lo revisado queda sin enseñar', () => {
    for (const e of ELEMENTOS) {
      const pintado = pintarElemento(e).join('\n');
      for (const t of textosDe(e)) expect(pintado, `${e.codigo}: ${t}`).toContain(t);
    }
  });
});

describe('la huella', () => {
  const o1 = elemento('O1');

  it('sale del contenido: no cambia con el apartado, el contexto ni cómo se pinta; sí con el texto', () => {
    expect(huellaDe({ ...o1, apartado: 'Otro apartado', contexto: 'Otro sitio' })).toBe(huellaDe(o1));
    expect(huellaDe(corregido(o1, 'Morgen ga', 'Overmorgen ga'))).not.toBe(huellaDe(o1));
    // Un cambio en una sola de las otras formas también cuenta.
    expect(huellaDe(corregido(o1, 'Ik ga morgen', 'Ik ga morgenochtend'))).not.toBe(huellaDe(o1));
  });

  it('no cambia si el mismo texto llega con otra normalización (NFD)', () => {
    const v = ELEMENTOS.find((e) => textosDe(e).some((t) => t !== t.normalize('NFD')));
    if (!v) throw new Error('ningún texto con tildes');
    expect(huellaDe(conContenido(v, (t) => t.normalize('NFD')))).toBe(huellaDe(v));
  });

  it('tiene un valor fijo: si cambia, todo lo revisado vuelve a pendiente, y eso tiene que ser a propósito', () => {
    expect(huellaDe(o1)).toBe('7ccad166');
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
    const registro = marcar({}, AHORA, ['O1'], '2026-11-23');
    expect(estaRevisado(elemento('O1'), registro)).toBe(true);
    expect(estaRevisado(elemento('O2'), registro)).toBe(false);
    expect(estaRevisado(corregido(elemento('O1'), 'Morgen ga', 'Overmorgen ga'), registro)).toBe(false);
  });

  it('cada lote lleva, en una línea oculta, la huella de cada elemento tal como sale en esa copia', () => {
    const documento = documentoDeRevision({});
    const [primero] = repartirEnLotes(ELEMENTOS);
    if (!primero) throw new Error('sin lotes');
    const { id, linea } = lineaDeLote(primero);
    expect(documento).toContain(`--lote ${id}\`\n${linea}\n`);
    expect(linea).toMatch(/^<!-- lote [0-9a-f]{8}: .* -->$/);
    expect(leerLote(documento, id)).toEqual(new Map(primero.map((e) => [e.codigo, huellaDe(e)])));
    expect(leerLote(documento, id.toUpperCase())).not.toBeNull();
    expect(leerLote(documento, '00000000')).toBeNull();
  });

  it('se apunta lo que decía la copia que se leyó: lo corregido después sigue pendiente, aunque se marque con ella', () => {
    // E2 cita O9 y va en un lote posterior. Se corrige O9 (y con ella E2) después de imprimir la copia y antes de
    // marcar el lote de E2: la persona nativa leyó la E2 de antes, y eso es lo que se apunta.
    const copia = documentoDeRevision({});
    const lote = repartirEnLotes(ELEMENTOS).find((l) => l.some((e) => e.codigo === 'E2'));
    if (!lote) throw new Error('sin el lote de E2');
    const leidas = leerLote(copia, lineaDeLote(lote).id);
    if (!leidas) throw new Error('la copia no trae su lote');
    const e2Corregida = conContenido(elemento('E2'), (t) => `${t} (corregido)`);
    expect(huellaDe(e2Corregida)).not.toBe(huellaDe(elemento('E2')));
    const despues = ELEMENTOS.map((e) => (e.codigo === 'E2' ? e2Corregida : e));
    const codigos = lote.map((e) => e.codigo);
    const registro = marcar({}, leidas, codigos, '2026-11-23');
    expect(estaRevisado(e2Corregida, registro)).toBe(false);
    for (const e of lote) if (e.codigo !== 'E2') expect(estaRevisado(e, registro), e.codigo).toBe(true);
    expect(cambiadosDesdeQueSeLeyo(leidas, despues, codigos)).toEqual(['E2']);
    expect(documentoDeRevision(registro, despues)).toContain('**E2.**');
  });

  it('solo se marca lo del lote que se leyó: un rango mal escrito no se sale de él', () => {
    const [primero] = repartirEnLotes(ELEMENTOS);
    if (!primero) throw new Error('sin lotes');
    const leidas = leerLote(documentoDeRevision({}), lineaDeLote(primero).id);
    if (!leidas) throw new Error('la copia no trae su lote');
    const deOrden = primero.filter((e) => e.tipo === 'O').map((e) => e.codigo);
    expect(leerCodigos(['O1-O90'], leidas.keys(), 'el lote')).toEqual(deOrden);
    expect(() => leerCodigos(['P1'], leidas.keys(), 'el lote')).toThrow('P1 no está en el lote');
    expect(() => leerCodigos(['P1-P9'], leidas.keys(), 'el lote')).toThrow('Ningún código de P1-P9 está en el lote');
    expect(() => marcar({}, leidas, ['P1'], '2026-11-23')).toThrow('P1 no está en lo que se leyó');
  });

  it('una copia retocada a mano no vale para marcar', () => {
    const [primero] = repartirEnLotes(ELEMENTOS);
    if (!primero) throw new Error('sin lotes');
    const { id, linea } = lineaDeLote(primero);
    const huella = huellaDe(primero[0] ?? elemento('O1'));
    const retocada = documentoDeRevision({}).replace(linea, linea.replace(huella, huella === '00000000' ? '11111111' : '00000000'));
    expect(leerLote(retocada, id)).toBeNull();
  });

  it('se marca y se desmarca por códigos sueltos y rangos de un mismo tipo', () => {
    expect(leerCodigos(['O1-O3', 'v2', 'R1,T25'], CODIGOS)).toEqual(['O1', 'O2', 'O3', 'R1', 'V2', 'T25']);
    expect(() => leerCodigos(['O999'], CODIGOS)).toThrow('No existe');
    expect(() => leerCodigos(['O1-V3'], CODIGOS)).toThrow('mismo tipo');
    expect(() => leerCodigos(['O5-O1'], CODIGOS)).toThrow('al revés');
    const registro = marcar({}, AHORA, ['O2', 'O1'], '2026-11-23');
    expect(Object.keys(registro)).toEqual(['O1', 'O2']);
    expect(registro.O1).toEqual({ huella: huellaDe(elemento('O1')), el: '2026-11-23' });
    expect(Object.keys(quitar(registro, ['O1']))).toEqual(['O2']);
  });

  it('revisado.json lleva un código por línea, para que dos lotes casi nunca choquen', () => {
    expect(serializarRegistro({})).toBe('{}\n');
    const registro = marcar({}, AHORA, ['V1', 'O2', 'O1'], '2026-11-23');
    const texto = serializarRegistro(registro);
    expect(texto.split('\n')).toEqual(['{', `  "O1": {"huella":"${huellaDe(elemento('O1'))}","el":"2026-11-23"},`, expect.stringMatching(/^ {2}"O2": /), expect.stringMatching(/^ {2}"V1": /), '}', '']);
    expect(JSON.parse(texto)).toEqual(registro);
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

  it('en las frases, lo que cuesta es pensar las formas que faltan: más fijo y algo por forma, no por palabra', () => {
    const sinOtras = ELEMENTOS.find((e) => e.tipo === 'O' && e.contenido.otras.length === 0);
    const conMuchas = ELEMENTOS.find((e) => e.tipo === 'O' && e.contenido.otras.length > 10);
    if (!sinOtras || !conMuchas) throw new Error('faltan frases para comparar');
    expect(segundosDe(sinOtras)).toBeGreaterThanOrEqual(45);
    expect(segundosDe(conMuchas)).toBeLessThan(150);
  });
});
