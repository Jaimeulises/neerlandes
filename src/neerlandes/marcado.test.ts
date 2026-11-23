// Dos cosas sobre el neerlandés que sale en pantalla. Dentro de un texto en español va entre «», para que la
// pantalla lo marque con lang="nl" y se lea como neerlandés (src/ui/componentes/ConNeerlandes.tsx); lo citado en
// español o en inglés va entre “”. Y todo él está en docs/revision.md, para que lo revise una persona nativa: no
// se comprueban frases enteras (las plantillas combinan sujeto, forma y complemento, que se revisan por separado),
// pero ninguna palabra neerlandesa puede salir sin estar en la revisión.

import { describe, expect, it } from 'vitest';
import { crearAzar, normalizar, TODAS_LAS_FORMAS, type CeldaDeTabla, type Ejercicio, type Presentacion } from '../motor';
import { DESTREZAS, FALTA_PARA_B2 } from './destrezas';
import { diagnosticarEjemplos } from './diagnostico/ejemplos';
import { PISTAS_GENERALES } from './diagnostico/pistas';
import { PISTAS } from './paquete';
import { documentoDeRevision } from './revision/documento';

/** Los textos de la pantalla, cada uno con dónde sale. */
interface Textos {
  /** En español, con el neerlandés entre «». */
  readonly espanol: Map<string, string>;
  /** Enteramente en neerlandés: frases, formas, opciones, la tabla. */
  readonly neerlandes: Map<string, string>;
  /** Las traducciones de las frases y palabras: español sin nada más, para saber qué palabras son también españolas. */
  readonly traducciones: Set<string>;
}

function recorrer(): Textos {
  const espanol = new Map<string, string>();
  const neerlandes = new Map<string, string>();
  const traducciones = new Set<string>();
  const es = (donde: string, t: string | null | undefined): void => {
    if (t && !espanol.has(t)) espanol.set(t, donde);
  };
  const nl = (donde: string, t: string | null | undefined): void => {
    if (t && !neerlandes.has(t)) neerlandes.set(t, donde);
  };
  const traduccion = (donde: string, t: string): void => {
    es(donde, t);
    traducciones.add(t);
  };
  const celda = (donde: string, c: CeldaDeTabla): void => {
    if (typeof c === 'string') nl(donde, c);
    else es(donde, c.etiqueta);
  };
  const presentacion = (donde: string, p: Presentacion): void => {
    es(donde, p.etiqueta);
    if (p.significado) traduccion(donde, p.significado);
    es(donde, p.detalle);
    es(donde, p.nota);
    nl(donde, p.principal);
    nl(donde, p.audio);
    for (const [a, b] of p.tabla ?? []) {
      celda(donde, a);
      celda(donde, b);
    }
    for (const e of p.ejemplos ?? []) {
      nl(donde, e.texto);
      traduccion(donde, e.significado);
    }
  };
  const ejercicio = (e: Ejercicio): void => {
    const donde = `${e.tipo} (${e.elementoId})`;
    es(donde, e.instruccion);
    es(donde, e.aclaracion);
    nl(donde, e.audio);
    switch (e.forma) {
      case 'opcion':
        (e.enunciadoEnIdioma ? nl : es)(donde, e.enunciado);
        if (e.significado) traduccion(donde, e.significado);
        for (const o of e.opciones) (e.opcionesEnIdioma ? nl : traduccion)(donde, o);
        break;
      case 'completar':
        // La pista del hueco es la palabra que hay que poner en forma: neerlandés, dentro de la frase.
        nl(donde, e.antes);
        nl(donde, e.despues);
        nl(donde, e.pista);
        if (e.significado) traduccion(donde, e.significado);
        for (const r of e.respuestas) nl(donde, r);
        break;
      case 'traducir':
        traduccion(donde, e.significado);
        es(donde, e.pista);
        for (const r of e.respuestas) nl(donde, r);
        break;
      case 'ordenar':
        traduccion(donde, e.significado);
        nl(donde, e.frase);
        for (const f of e.fichas) nl(donde, f.texto);
        break;
      case 'dictado':
        traduccion(donde, e.significado);
        nl(donde, e.dictar);
        break;
      case 'decir':
        traduccion(donde, e.significado);
        es(donde, e.pista);
        nl(donde, e.texto);
        for (const o of e.otras ?? []) nl(donde, o);
        break;
    }
  };

  for (const d of DESTREZAS) {
    es(`la destreza ${d.id}`, d.nombre);
    es(`la destreza ${d.id}`, d.descripcion);
  }
  for (const f of FALTA_PARA_B2) es(f.codigo, f.texto);
  for (const p of Object.values(PISTAS_GENERALES)) es('una pista general', p);
  for (const e of diagnosticarEjemplos()) {
    for (const d of e.diagnosticos) {
      es(e.codigo, d.titulo);
      es(e.codigo, d.texto);
      es(e.codigo, d.pista);
    }
  }
  const conjuntos = [TODAS_LAS_FORMAS, ...[...TODAS_LAS_FORMAS].map((f) => new Set([f]))];
  for (const pista of PISTAS) {
    es(`la pista ${pista.id}`, pista.descripcion);
    for (const g of pista.grupos) es(`el grupo ${g}`, pista.nombresDeGrupo?.[g]);
    const vistos = new Set(pista.elementos.map((e) => e.id));
    for (const elemento of pista.elementos) {
      const p = pista.presentar?.(elemento);
      if (p) presentacion(`la presentación de ${elemento.id}`, p);
      for (const formas of conjuntos) {
        for (const repeticiones of [0, 1, 3]) {
          for (let semilla = 1; semilla <= 3; semilla++) ejercicio(pista.crearEjercicio(elemento, { azar: crearAzar(semilla), vistos, repeticiones, formas }));
        }
      }
    }
  }
  return { espanol, neerlandes, traducciones };
}

const TEXTOS = recorrer();

/** Las palabras de un texto: sin puntuación ni formato, sin terminaciones sueltas (-t, ge-) ni letras sueltas. */
function palabrasDe(texto: string): string[] {
  return normalizar(texto)
    .replace(/[^\p{L}\p{N}' -]/gu, ' ')
    .split(' ')
    .filter((p) => /\p{L}.*\p{L}/u.test(p) && !p.startsWith('-') && !p.endsWith('-'));
}

/** Lo que va entre «» en un texto en español. */
function citado(texto: string): string[] {
  return [...texto.matchAll(/«([^»]*)»/g)].map((m) => m[1] ?? '');
}

/** Lo que queda fuera de «» y de “”: el español. */
function fueraDeCitas(texto: string): string {
  return texto.replace(/«[^»]*»/g, ' ').replace(/“[^”]*”/g, ' ');
}

/** Las palabras de los textos enteramente neerlandeses de la pantalla. */
const NEERLANDESAS = new Set([...TEXTOS.neerlandes.keys()].flatMap(palabrasDe));
/** Las palabras de las traducciones: si también son neerlandesas (de, al, leer...), son de los dos idiomas. */
const ESPANOLAS = new Set([...TEXTOS.traducciones].flatMap((t) => palabrasDe(fueraDeCitas(t))));
/** Se escriben igual en los dos idiomas, aunque las frases de la app no las traigan en los dos: «en» (y) y van (de ir). */
const DE_LOS_DOS = new Set(['en', 'van']);

describe('el neerlandés de la pantalla', () => {
  it('dentro de un texto en español va entre «»', () => {
    const sueltas = [...TEXTOS.espanol].flatMap(([texto, donde]) =>
      palabrasDe(fueraDeCitas(texto))
        .filter((p) => NEERLANDESAS.has(p) && !ESPANOLAS.has(p) && !DE_LOS_DOS.has(p))
        .map((p) => `${donde}: «${p}» en ${texto}`),
    );
    expect(sueltas).toEqual([]);
  });

  it('lo citado en español va entre “”, no entre «»: lo que va entre «» se lee en neerlandés', () => {
    const espanol = [...TEXTOS.espanol].flatMap(([texto, donde]) =>
      citado(texto)
        .flatMap(palabrasDe)
        .filter((p) => ESPANOLAS.has(p) && !NEERLANDESAS.has(p) && !DE_LOS_DOS.has(p))
        .map((p) => `${donde}: «${p}» en ${texto}`),
    );
    expect(espanol).toEqual([]);
  });

  it('todo está en docs/revision.md, también lo que va entre «» en los textos en español', () => {
    // Las reglas, las explicaciones y los demás textos fijos ya están enteros en la revisión (R, E y T); esto pilla
    // sobre todo lo que sale de plantillas: las frases de presente con cada sujeto, las aclaraciones, las consignas.
    const revision = new Set(palabrasDe(documentoDeRevision({})));
    const fuera = [
      ...[...TEXTOS.neerlandes].flatMap(([texto, donde]) => palabrasDe(texto).map((p) => [p, `${donde}: ${texto}`] as const)),
      ...[...TEXTOS.espanol].flatMap(([texto, donde]) => citado(texto).flatMap((c) => palabrasDe(c).map((p) => [p, `${donde}: ${texto}`] as const))),
    ]
      .filter(([p]) => !revision.has(p))
      .map(([p, donde]) => `«${p}» (${donde})`);
    expect([...new Set(fuera)]).toEqual([]);
  });
});
