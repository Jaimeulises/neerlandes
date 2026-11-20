import { describe, expect, it } from 'vitest';
import { crearAzar, type Diagnostico, type Ejercicio } from '../../motor';
import { ELEMENTOS_ORDEN, ejercicioDeFrase, orden, type Frase } from '../orden/pista';
import { ELEMENTOS_VERBOS, verbos } from '../verbos/pista';
import { vocabulario, ELEMENTOS_VOCABULARIO } from '../vocabulario/pista';
import { DESTREZAS } from '../destrezas';
import { diagnosticarEjemplos } from './ejemplos';
import { papelesDe } from './papeles';
import { explicarConjugacion, explicarParticipio } from './verbo';

const contexto = { azar: crearAzar(1), vistos: new Set<string>(), repeticiones: 1, formas: new Set(['traducir'] as const) };

function frase(texto: string): Frase {
  const f = ELEMENTOS_ORDEN.find((e) => e.frase.toLowerCase().startsWith(texto.toLowerCase()));
  if (!f) throw new Error(`no está: ${texto}`);
  return f;
}

function traducir(f: Frase): Ejercicio {
  return ejercicioDeFrase(f, 'traducir', contexto);
}

function diagnostico(texto: string, respuesta: string): readonly Diagnostico[] {
  const f = frase(texto);
  return orden.diagnosticar?.(traducir(f), respuesta) ?? [];
}

const destrezas = (ds: readonly Diagnostico[]): string[] => ds.map((d) => d.destreza);
const IDS = new Set<string>(DESTREZAS.map((d) => d.id));

describe('papeles de las frases de orden', () => {
  it('todas tienen verbo y sujeto donde toca, y lo que va al final está en la frase', () => {
    for (const f of ELEMENTOS_ORDEN) {
      const p = papelesDe(f);
      const w = f.frase.toLowerCase();
      if (f.grupo !== 'subordinada') {
        expect(p.verbo, f.frase).not.toBe('');
        expect(p.sujeto.length, f.frase).toBeGreaterThan(0);
        expect(w, f.frase).toContain(p.verbo);
      }
      if (p.subordinada) {
        expect(p.subordinada.conjuncion, f.frase).not.toBe('');
        expect(w, f.frase).toContain(p.subordinada.verbo);
      }
      for (const fin of p.finales) expect(w, f.frase).toContain(fin);
    }
  });

  it('ninguna frase buena da un diagnóstico', () => {
    for (const f of ELEMENTOS_ORDEN) {
      for (const v of f.validas) expect(orden.diagnosticar?.(traducir(f), v), v).toEqual([]);
    }
  });
});

describe('diagnóstico del orden', () => {
  it('inversión: el sujeto antes del verbo tras morgen', () => {
    const d = diagnostico('Morgen ga ik', 'Morgen ik ga naar mijn schoonouders');
    expect(destrezas(d)).toEqual(['inversion']);
    expect(d[0]?.texto).toContain('«ga»');
    expect(d[0]?.texto).toContain('«ik»');
  });

  it('inversión: el verbo en tercera posición empezando por el sujeto', () => {
    expect(destrezas(diagnostico('Ik wil morgen', 'Ik morgen wil een nieuwe fiets kopen'))).toContain('inversion');
  });

  it('modal: el infinitivo pegado al modal', () => {
    expect(destrezas(diagnostico('Ik wil morgen', 'Ik wil kopen morgen een nieuwe fiets'))).toEqual(['modal']);
  });

  it('perfectum: el participio pegado al auxiliar', () => {
    const d = diagnostico('Ik heb gisteren', 'Ik heb gewerkt gisteren de hele dag');
    expect(destrezas(d)).toEqual(['perfectum-orden']);
  });

  it('perfectum: hebben por zijn', () => {
    const d = diagnostico('We zijn in het weekend', 'We hebben in het weekend naar Utrecht gegaan');
    expect(destrezas(d)).toEqual(['auxiliar']);
    expect(d[0]?.texto).toContain('zijn');
  });

  it('perfectum: participio regular inventado', () => {
    const d = diagnostico('Ik heb gisteren', 'Ik heb gisteren de hele dag gewerkd');
    expect(destrezas(d)).toEqual(['participio']);
    expect(d[0]?.texto).toContain('kofschip');
  });

  it('perfectum: participio irregular hecho regular', () => {
    expect(destrezas(diagnostico('Heb je goed', 'Heb je goed geslaapt?'))).toEqual(['participio-irregular']);
  });

  it('separables: la partícula pegada al verbo', () => {
    const d = diagnostico('Ik bel je morgen', 'Ik opbel je morgen');
    expect(destrezas(d)).toEqual(['separables']);
  });

  it('separables: falta la partícula', () => {
    expect(destrezas(diagnostico('Ik bel je morgen', 'Ik bel je morgen'))).toEqual(['separables']);
  });

  it('niet en el sitio del inglés', () => {
    const d = diagnostico('Ik heb het niet', 'Ik heb niet het gezien');
    expect(destrezas(d)).toEqual(['niet']);
    expect(d[0]?.titulo).toContain('«het»');
    expect(d[0]?.titulo).toContain('«gezien»');
  });

  it('niet en vez de geen', () => {
    expect(destrezas(diagnostico('Ik heb vandaag geen', 'Ik heb vandaag niet tijd'))).toEqual(['niet']);
  });

  it('pregunta con el orden de una afirmación', () => {
    expect(destrezas(diagnostico('Waar woont je zus', 'Waar je zus woont?'))).toEqual(['preguntas']);
  });

  it('pregunta con jij: la -t que sobra', () => {
    const d = diagnostico('Werk jij morgen', 'Werkt jij morgen?');
    expect(destrezas(d)).toEqual(['presente']);
    expect(d[0]?.texto).toContain('se cae');
  });

  it('subordinada: el verbo detrás del sujeto, como en inglés', () => {
    const d = diagnostico('Ik blijf thuis omdat', 'Ik blijf thuis omdat ik ben niet lekker');
    expect(destrezas(d)).toEqual(['subordinada']);
    expect(d[0]?.texto).toContain('«ben»');
  });

  it('subordinada con dos verbos', () => {
    expect(destrezas(diagnostico('Ik denk dat het', 'Ik denk dat het gaat regenen morgen'))).toEqual(['subordinada']);
  });

  it('subordinada delante: la principal con el sujeto primero', () => {
    const d = diagnostico('Als ik tijd heb', 'Als ik tijd heb, ik kom langs');
    expect(destrezas(d)).toEqual(['subordinada-delante']);
  });

  it('subordinada delante: el verbo de la subordinada en medio', () => {
    expect(destrezas(diagnostico('Als ik tijd heb', 'Als ik heb tijd, kom ik langs'))).toEqual(['subordinada']);
  });

  it('conjugación: la -t con ik', () => {
    const d = diagnostico('Vandaag werk ik', 'Vandaag werkt ik thuis');
    expect(destrezas(d)).toEqual(['presente']);
  });

  it('una palabra que no se sabe no da diagnóstico', () => {
    expect(diagnostico('Vandaag werk ik', 'Vandaag werk ik in huis')).toEqual([]);
  });

  it('todas las destrezas de los diagnósticos existen', () => {
    const casos: [string, string][] = [
      ['Morgen ga ik', 'Morgen ik ga naar mijn schoonouders'],
      ['Ik heb gisteren', 'Ik heb gewerkt gisteren de hele dag'],
      ['Als ik tijd heb', 'Als ik tijd heb, ik kom langs'],
    ];
    for (const [f, r] of casos) for (const d of diagnostico(f, r)) expect(IDS.has(d.destreza)).toBe(true);
  });
});

describe('diagnóstico de las formas verbales', () => {
  it('conjugación: falta la -t con hij', () => {
    expect(explicarConjugacion('werkt', 'werk', ['hij'], false)?.destreza).toBe('presente');
  });

  it('conjugación: infinitivo sin conjugar', () => {
    expect(explicarConjugacion('ga', 'gaan', ['ik'], false)?.texto).toContain('sin conjugar');
  });

  it('pasado: falta la -n del plural', () => {
    expect(explicarConjugacion('woonden', 'woonde', ['we'], false)?.texto).toContain('-n');
  });

  it('pasado: presente en vez de pasado', () => {
    expect(explicarConjugacion('ging', 'ga', ['ik'], false)?.texto).toContain('pasado');
  });

  it('palabras de verbos distintos no son un fallo de conjugación', () => {
    expect(explicarConjugacion('werk', 'woon', ['ik'], false)).toBeNull();
  });

  it('participio: sin ge- con ver-', () => {
    expect(explicarParticipio('verhuisd', 'geverhuisd')?.texto).toContain('ge-');
  });

  it('participio de un separable', () => {
    expect(explicarParticipio('opgebeld', 'geopbeld')?.destreza).toBe('separables');
  });

  it('el hueco del presente se diagnostica con su sujeto', () => {
    const e = ELEMENTOS_VERBOS.find((x) => x.id === 'presente:werken');
    if (!e) throw new Error('falta werken');
    const ejercicio: Ejercicio = {
      forma: 'completar',
      tipo: 'verbos.presente.completar',
      elementoId: e.id,
      instruccion: '',
      antes: 'Hij ',
      despues: ' thuis.',
      pista: 'werken',
      respuestas: ['werkt'],
    };
    expect(destrezas(verbos.diagnosticar?.(ejercicio, 'werk') ?? [])).toEqual(['presente']);
  });

  it('de o het al escribir una palabra', () => {
    const e = ELEMENTOS_VOCABULARIO.find((x) => x.articulo === 'het');
    if (!e) throw new Error('no hay palabras con het');
    const ejercicio = vocabulario.crearEjercicio(e, { ...contexto, repeticiones: 3 });
    const mal = e.nl.replace(/^het /, 'de ');
    const d = ejercicio.forma === 'traducir' ? (vocabulario.diagnosticar?.(ejercicio, mal) ?? []) : [];
    if (ejercicio.forma === 'traducir') expect(destrezas(d)).toEqual(['articulo']);
  });
});

describe('robustez', () => {
  it('las frases buenas de los verbos tampoco dan diagnóstico', () => {
    const azar = crearAzar(7);
    for (const e of ELEMENTOS_VERBOS) {
      for (let i = 0; i < 6; i++) {
        const ejercicio = verbos.crearEjercicio(e, { azar, vistos: new Set(), repeticiones: 3, formas: new Set(['traducir', 'ordenar'] as const) });
        const buenas = ejercicio.forma === 'traducir' ? ejercicio.respuestas : ejercicio.forma === 'ordenar' ? ejercicio.validas : [];
        for (const b of buenas) expect(verbos.diagnosticar?.(ejercicio, b), `${e.id}: ${b}`).toEqual([]);
      }
    }
  });

  it('cualquier orden de las fichas da diagnósticos de destrezas que existen, sin romperse', () => {
    const azar = crearAzar(3);
    for (const f of ELEMENTOS_ORDEN) {
      const ejercicio = ejercicioDeFrase(f, 'ordenar', contexto);
      for (let i = 0; i < 10; i++) {
        const respuesta = azar.barajar(f.fichas).join(' ');
        for (const d of orden.diagnosticar?.(ejercicio, respuesta) ?? []) {
          expect(IDS.has(d.destreza), d.destreza).toBe(true);
          expect(d.texto.length).toBeGreaterThan(20);
        }
      }
    }
  });
});

describe('ejemplos de error de docs/revision.md', () => {
  it('cada uno tiene al menos un diagnóstico', () => {
    for (const e of diagnosticarEjemplos()) expect(e.diagnosticos.length, e.respuesta).toBeGreaterThan(0);
  });
});
