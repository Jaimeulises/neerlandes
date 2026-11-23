import { describe, expect, it } from 'vitest';
import { crearAzar, type Diagnostico, type Ejercicio } from '../../motor';
import { ELEMENTOS_ORDEN, ejercicioDeFrase, orden, type Frase } from '../orden/pista';
import { ELEMENTOS_VERBOS, verbos } from '../verbos/pista';
import { vocabulario, ELEMENTOS_VOCABULARIO } from '../vocabulario/pista';
import { DESTREZAS } from '../destrezas';
import { CASOS } from './casos';
import { diagnosticarEjemplos } from './ejemplos';
import { formasDe, mismoVerbo } from './formas';
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
const CASOS_VALIDOS = new Set<string>(CASOS);
/** El caso de cada diagnóstico (todos los de neerlandés lo llevan). */
const casos = (ds: readonly Diagnostico[]): string[] => ds.map((d) => ('caso' in d && typeof d.caso === 'string' ? d.caso : 'sin caso'));

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
    expect(destrezas(diagnostico('Ik nodig mijn vrienden', 'Ik nodig mijn vrienden voor zaterdag'))).toEqual(['separables']);
  });

  it('separables: sin la partícula no falta nada si también vale sin ella (bellen)', () => {
    expect(diagnostico('Ik bel je morgen', 'Ik bel je morgen')).toEqual([]);
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

describe('lo que el inventario de la fase 1 encontró mal explicado', () => {
  it('pregunta con je delante: no se queda sin explicar', () => {
    const d = diagnostico('Wat ga je', 'Wat je gaat dit weekend doen?');
    expect(casos(d)).toEqual(['pregunta-interrogativa']);
    expect(d[0]?.texto).toContain('«ga je»');
  });

  it('pregunta con jij delante: la -t estaba bien para ese orden y no se da por mal conjugada', () => {
    for (const [f, r] of [
      ['Werk jij morgen', 'Jij werkt morgen?'],
      ['Kom jij ook', 'Jij komt ook naar het feest?'],
      ['Kun je het zout', 'Je kunt het zout even aangeven?'],
    ] as const) {
      const d = diagnostico(f, r);
      expect(casos(d), r).toEqual(['pregunta-si-no']);
      expect(d[0]?.texto, r).toContain('pierde la -t');
    }
  });

  it('con jij detrás, la -t de un irregular como gaan también se cae', () => {
    expect(casos(diagnostico('Wat ga je', 'Wat gaat je dit weekend doen?'))).toEqual(['presente-jij-detras']);
    expect(casos(diagnostico('Hoe laat sta je', 'Hoe laat staat je op?'))).toEqual(['presente-jij-detras']);
  });

  it('la frase que se enseña empieza como la respuesta y no contradice la explicación', () => {
    const d = diagnostico('Meestal eten we', 'Om zes uur we eten meestal');
    expect(casos(d)).toEqual(['inversion-otro-delante']);
    expect(d[0]?.texto).toContain('«Om zes uur eten we meestal»');
    expect(d[0]?.texto).toContain('O empieza por el sujeto: «We eten meestal om zes uur»');
    const segunda = diagnostico('Meestal eten we', 'We meestal eten om zes uur');
    expect(segunda[0]?.texto).toContain('«We eten meestal om zes uur»');
  });

  it('en la subordinada también se mira la conjugación', () => {
    expect(casos(diagnostico('Ik blijf thuis omdat', 'Ik blijf thuis omdat ik niet lekker is'))).toEqual(['presente-otra']);
  });

  it('el participio sin ge- en la frase de un verbo', () => {
    const e = ELEMENTOS_VERBOS.find((x) => x.grupo === 'perfectum' && x.verbo?.inf === 'spelen');
    if (!e) throw new Error('falta spelen');
    const ejercicio = verbos.crearEjercicio(e, { ...contexto, formas: new Set(['traducir'] as const) });
    expect(casos(verbos.diagnosticar?.(ejercicio, 'De kinderen hebben de hele middag buiten speeld') ?? [])).toEqual(['participio-sin-ge']);
  });

  it('el inglés de cada subordinada es el suyo', () => {
    const d = diagnostico('Als ik tijd heb', 'Als ik heb tijd, kom ik langs');
    expect(d[0]?.texto).toContain('“if I have time”');
    expect(d[0]?.texto).not.toContain('because');
  });

  it('los participios que no están en los verbos: irregular y separable', () => {
    expect(casos(diagnostico('Mijn schoonmoeder', 'Mijn schoonmoeder heeft een taart gebakt'))).toEqual(['participio-irregular']);
    expect(casos(diagnostico('Hij is om tien uur', 'Hij is om tien uur gethuiskomen'))).toEqual(['participio-separable']);
  });

  it('niet entre el sujeto y el verbo: el contraste es con el español', () => {
    const d = diagnostico('Dat is niet waar', 'Dat niet is waar');
    expect(casos(d)).toEqual(['inversion-niet']);
    expect(d[0]?.texto).toContain('En español');
  });

  it('el pasado donde va el presente', () => {
    expect(casos(diagnostico('Vandaag werk ik', 'Vandaag werkte ik thuis'))).toEqual(['presente-con-pasado']);
  });

  it('je de «je zus» no es el sujeto: la -t no se cae', () => {
    const d = diagnostico('Waar woont je zus', 'Waar woon je zus?');
    expect(casos(d)).toEqual(['presente-je-posesivo']);
    expect(d[0]?.texto).toContain('«tu»');
  });

  it('un irregular hecho con la regla se reconoce como el mismo verbo', () => {
    for (const [buena, inventada] of [
      ['kwam', 'komde'],
      ['sliep', 'slaapte'],
      ['woonden', 'woonten'],
      ['werkte', 'werkde'],
      ['gingen', 'gaanden'],
      ['gespeeld', 'speeld'],
    ] as const) {
      expect(mismoVerbo(buena, inventada), `${buena} y ${inventada}`).toBe(true);
    }
    expect(mismoVerbo('werk', 'woon')).toBe(false);
    expect(explicarConjugacion('kwam', 'komde', ['hij'], false)?.caso).toBe('pasado-irregular');
    expect(explicarConjugacion('woonden', 'woonten', ['we'], false)?.caso).toBe('pasado-te-de');
  });

  it('con ik o hij, la forma de otra persona de un irregular no se explica con la -t', () => {
    expect(explicarConjugacion('ben', 'bent', ['ik'], false)?.caso).toBe('presente-otra');
    expect(explicarConjugacion('ga', 'gaat', ['ik'], false)?.caso).toBe('presente-ik-con-t');
    expect(explicarConjugacion('gaat', 'ga', ['hij'], false)?.caso).toBe('presente-falta-t');
  });
});

describe('cobertura de los datos del diagnóstico', () => {
  it('cada participio de las frases de orden se sabe de qué verbo es', () => {
    for (const f of ELEMENTOS_ORDEN) {
      const p = papelesDe(f);
      if (p.tipoFinal !== 'participio') continue;
      const participio = p.finales.at(-1) ?? '';
      expect(
        formasDe(participio).some((x) => x.tipo === 'participio'),
        `${f.codigo}: «${participio}» no está en verbos/datos.ts ni en diagnostico/datos.ts`,
      ).toBe(true);
    }
  });

  it('cualquier orden de las fichas da diagnósticos con un caso que existe', () => {
    const azar = crearAzar(11);
    for (const f of ELEMENTOS_ORDEN) {
      const ejercicio = ejercicioDeFrase(f, 'ordenar', contexto);
      for (let i = 0; i < 10; i++) {
        for (const c of casos(orden.diagnosticar?.(ejercicio, azar.barajar(f.fichas).join(' ')) ?? [])) expect(CASOS_VALIDOS.has(c), c).toBe(true);
      }
    }
  });
});
