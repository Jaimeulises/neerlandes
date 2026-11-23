import { describe, expect, it } from 'vitest';
import { crearAzar, type Diagnostico, type Ejercicio } from '../../motor';
import { alternativas } from '../comun';
import { ELEMENTOS_ORDEN, ejercicioDeFrase, orden, type Frase } from '../orden/pista';
import { VERBOS } from '../verbos/datos';
import { ELEMENTOS_VERBOS, verbos } from '../verbos/pista';
import { vocabulario, ELEMENTOS_VOCABULARIO } from '../vocabulario/pista';
import { DESTREZAS } from '../destrezas';
import { CASOS, CASOS_SIN_EJEMPLO } from './casos';
import { diagnosticarEjemplos, EJEMPLOS_DE_ERROR } from './ejemplos';
import { formasDe, mismoVerbo } from './formas';
import { sujetoDeHueco } from './index';
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

/**
 * Si unos códigos E son únicos y van en orden. Puede haber huecos: el código de un ejemplo borrado va a RETIRADOS
 * (codigos.test.ts comprueba que cada hueco está allí), porque renumerar los de detrás reutilizaría códigos.
 */
function codigosEnOrden(codigos: readonly string[]): boolean {
  return codigos.every((c, i) => /^E[1-9]\d*$/.test(c) && (i === 0 || Number(c.slice(1)) > Number((codigos[i - 1] ?? '').slice(1))));
}

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
  it('cada uno da justo el caso que dice', () => {
    for (const e of diagnosticarEjemplos()) expect(casos(e.diagnosticos), `${e.codigo}: ${e.respuesta}`).toEqual([e.caso]);
  });

  it('cada caso tiene su ejemplo, salvo los que ningún contenido puede provocar', () => {
    const conEjemplo = new Set(EJEMPLOS_DE_ERROR.map((e) => e.caso));
    for (const c of CASOS) expect(conEjemplo.has(c) || c in CASOS_SIN_EJEMPLO, `${c} no tiene ejemplo en ejemplos.ts`).toBe(true);
    for (const c of Object.keys(CASOS_SIN_EJEMPLO)) expect(conEjemplo.has(c as (typeof CASOS)[number]), `${c} tiene ejemplo: quítalo de CASOS_SIN_EJEMPLO`).toBe(false);
  });

  it('los códigos son únicos y van en orden, y retirar uno deja su hueco sin renumerar los demás', () => {
    const codigos = EJEMPLOS_DE_ERROR.map((e) => e.codigo);
    expect(codigosEnOrden(codigos)).toBe(true);
    // Lo que pide CLAUDE.md al borrar un ejemplo: su código va a RETIRADOS y los de detrás no cambian.
    expect(codigosEnOrden(codigos.filter((c) => c !== 'E16'))).toBe(true);
    expect(codigosEnOrden(['E1', 'E3', 'E2'])).toBe(false);
    expect(codigosEnOrden(['E1', 'E2', 'E2'])).toBe(false);
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
    expect(d[0]?.texto).toContain('“tu”');
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

// Una pista que señala otro sitio es peor que la general, y el diagnóstico falso cuenta además como regla
// fallada: baja su nivel y la ronda la practica. Si no se puede asegurar qué falla, no se diagnostica nada.
describe('lo que la revisión de las pistas encontró mal diagnosticado', () => {
  it('niet entre el sujeto y el verbo: la regla es la de la frase principal, que en la subordinada sí va ahí', () => {
    const d = diagnostico('Dat is niet waar', 'Dat niet is waar');
    expect(casos(d)).toEqual(['inversion-niet']);
    // «omdat ik niet lekker ben» (O49): en la subordinada, «niet» va entre el sujeto y el verbo conjugado.
    expect(d[0]?.texto).toContain('en la frase principal, «niet» nunca va entre el sujeto y el verbo conjugado');
  });

  it('’t kofschip solo cuando la respuesta es el participio con la otra de t o d al final', () => {
    expect(explicarParticipio('gewerkt', 'gewerkd')?.caso).toBe('participio-kofschip');
    expect(explicarParticipio('gereisd', 'gereist')?.caso).toBe('participio-kofschip');
    // La raíz mal escrita, otro verbo u otro participio: la terminación ya estaba bien, o no es eso lo que falla.
    for (const [esperado, dado] of [
      ['gespeeld', 'gespeld'],
      ['gewoond', 'gewond'],
      ['gekookt', 'gekokt'],
      ['gewerkt', 'gemaakt'],
      ['gefietst', 'gelopen'],
    ] as const) {
      expect(explicarParticipio(esperado, dado), `${esperado}: ${dado}`).toBeNull();
    }
    // En su primer ejercicio, el hueco del participio, y en la frase entera.
    const spelen = ELEMENTOS_VERBOS.find((x) => x.grupo === 'perfectum' && x.verbo?.inf === 'spelen');
    const fietsen = ELEMENTOS_VERBOS.find((x) => x.grupo === 'perfectum' && x.verbo?.inf === 'fietsen');
    if (!spelen || !fietsen) throw new Error('faltan spelen o fietsen');
    const hueco = verbos.crearEjercicio(spelen, { ...contexto, repeticiones: 0 });
    expect(hueco.forma).toBe('completar');
    expect(verbos.diagnosticar?.(hueco, 'gespeld')).toEqual([]);
    const frase = verbos.crearEjercicio(fietsen, contexto);
    expect(frase.forma).toBe('traducir');
    expect(verbos.diagnosticar?.(frase, 'Ik ben naar mijn werk gelopen')).toEqual([]);
  });

  it('en un separable con ge- en su sitio, lo que falla no es dónde va ge-', () => {
    // «opgebelt» lleva ge- entre la partícula y el verbo: falla la d, como en «gewerkd». «thuisgekomt» es irregular.
    expect(explicarParticipio('opgebeld', 'opgebelt')?.caso).toBe('participio-kofschip');
    expect(explicarParticipio('thuisgekomen', 'thuisgekomt')?.caso).toBe('participio-irregular');
    expect(explicarParticipio('opgebeld', 'opgebelld')).toBeNull();
    expect(casos(diagnostico('Hij is om tien uur', 'Hij is om tien uur thuisgekomt'))).toEqual(['participio-irregular']);
    // Con ge- delante de todo o sin ge-, sí falla dónde va.
    expect(explicarParticipio('opgebeld', 'geopbeld')?.caso).toBe('participio-separable');
    expect(explicarParticipio('opgebeld', 'opbeld')?.caso).toBe('participio-separable');
    // En el hueco del participio de «opbellen».
    const opbellen = ELEMENTOS_VERBOS.find((x) => x.separable?.inf === 'opbellen');
    if (!opbellen) throw new Error('falta opbellen');
    const hueco = verbos.crearEjercicio(opbellen, { ...contexto, formas: new Set(['completar'] as const) });
    expect(hueco.forma).toBe('completar');
    expect(casos(verbos.diagnosticar?.(hueco, 'opgebelt') ?? [])).toEqual(['participio-kofschip']);
  });

  it('un pasado regular nunca se explica como irregular', () => {
    // La vocal mal escrita o el participio por el pasado: no se sabe qué regla falla, y llamarlo irregular es falso.
    for (const [esperada, dada, sujeto] of [
      ['maakte', 'makte', ['mijn', 'moeder']],
      ['woonden', 'wonden', ['we']],
      ['werkte', 'gewerkt', ['ik']],
    ] as const) {
      expect(explicarConjugacion(esperada, dada, sujeto, false), `${esperada}: ${dada}`).toBeNull();
    }
    // También sin raíz en los datos: la de «willen» es la forma de ik («wil»), y «wilde» es regular aunque «wou» no.
    expect(explicarConjugacion('wilde', 'gewild', ['ze'], false)).toBeNull();
    expect(explicarConjugacion('wilde', 'wild', ['ze'], false)).toBeNull();
    expect(explicarConjugacion('wou', 'wilde', ['ze'], false)?.caso).toBe('pasado-irregular');
    const regulares = VERBOS.flatMap((v) => {
      const raiz = v.raiz ?? alternativas(v.presente?.[0] ?? '')[0] ?? '';
      return (v.pasado ?? []).flatMap(alternativas).filter((p) => raiz !== '' && p.startsWith(raiz) && /^[td]en?$/.test(p.slice(raiz.length))).map((p) => [p, v.participio ?? ''] as const);
    });
    for (const [esperada, participio] of regulares) expect(explicarConjugacion(esperada, participio, ['ik'], false), `${esperada}: ${participio}`).toBeNull();
    expect(regulares.map(([p]) => p)).toEqual(expect.arrayContaining(['werkte', 'woonden', 'maakte', 'wilde', 'wilden']));
    // Lo que sí se sabe de los regulares sigue saliendo, y el irregular hecho con la regla también.
    expect(explicarConjugacion('woonden', 'woonten', ['we'], false)?.caso).toBe('pasado-te-de');
    expect(explicarConjugacion('kwam', 'komde', ['hij'], false)?.caso).toBe('pasado-irregular');
    // En su primer ejercicio, el hueco: sin diagnóstico, para que salga la pista general.
    const maken = ELEMENTOS_VERBOS.find((x) => x.grupo === 'pasado' && x.verbo?.inf === 'maken');
    if (!maken) throw new Error('falta maken');
    const hueco = verbos.crearEjercicio(maken, { ...contexto, repeticiones: 0 });
    expect(hueco.forma).toBe('completar');
    expect(verbos.diagnosticar?.(hueco, 'makte')).toEqual([]);
  });

  it('con un nombre delante del hueco, el sujeto es ese nombre y el «het» de detrás es el artículo del objeto', () => {
    expect(sujetoDeHueco('Mijn ouders ', ' het ontbijt.')).toEqual({ sujeto: ['mijn', 'ouders'], invertido: false });
    expect(sujetoDeHueco('Mijn zus ', ' het probleem.')).toEqual({ sujeto: ['mijn', 'zus'], invertido: false });
    // Con otra cosa delante, el pronombre de detrás sí es el sujeto, también «het».
    expect(sujetoDeHueco('Gisteren ', ' het erg druk in de stad.')).toEqual({ sujeto: ['het'], invertido: true });
    expect(sujetoDeHueco('Vorige week ', ' we naar Antwerpen.')).toEqual({ sujeto: ['we'], invertido: true });
    // Un pronombre que solo puede ser sujeto sigue mandando, aunque delante vaya un nombre con su artículo.
    expect(sujetoDeHueco('De hele dag ', ' ik thuis.')).toEqual({ sujeto: ['ik'], invertido: true });
    // Y en el ejercicio, la pista habla del sujeto de verdad y no pide la forma que se acaba de dar.
    const maken = ELEMENTOS_VERBOS.find((x) => x.grupo === 'presente' && x.verbo?.inf === 'maken');
    if (!maken) throw new Error('falta maken');
    const hueco = (antes: string, buena: string): Ejercicio => ({
      forma: 'completar',
      tipo: 'verbos.presente.completar',
      elementoId: maken.id,
      instruccion: '',
      antes,
      despues: ' het ontbijt.',
      pista: 'maken',
      respuestas: [buena],
    });
    const plural = verbos.diagnosticar?.(hueco('Mijn ouders ', 'maken'), 'maakt') ?? [];
    expect(casos(plural)).toEqual(['presente-plural']);
    expect(plural[0]?.pista).toContain('«mijn ouders»');
    const singular = verbos.diagnosticar?.(hueco('Mijn zus ', 'maakt'), 'maak') ?? [];
    expect(casos(singular)).toEqual(['presente-falta-t']);
    expect(singular[0]?.pista).toContain('«mijn zus»');
  });

  it('con otro verbo conjugado delante, lo que lleva del verbo de la frase no es su verbo conjugado fuera de sitio', () => {
    // Dicha con «gaan», un modal o el perfectum, el verbo de la frase va en infinitivo o en participio, o es un nombre
    // («met fiets»): el orden, la partícula y «niet» no se pueden comparar con los de la frase buena.
    for (const [f, r] of [
      ['In het weekend', 'In het weekend gaan we vaak met fiets naar het strand'],
      ['In het weekend', 'In het weekend gaan we vaak fietsen naar het strand'],
      ['Werk jij morgen', 'Ga jij morgen werken?'],
      ['Vandaag werk ik', 'Ik ga vandaag thuis werken'],
      ['Ik kom morgen niet', 'Morgen ga ik niet komen'],
      ['Ik kom morgen niet', 'Ik ga morgen niet komen'],
      ['Meestal eten we', 'Meestal gaan we om zes uur eten'],
      ['Omdat het regent', 'Omdat het regent, gaan we binnen blijven'],
      ['Ik bel je morgen', 'Ik ga je morgen opbellen'],
    ] as const) {
      expect(diagnostico(f, r), r).toEqual([]);
    }
    const werken = ELEMENTOS_VERBOS.find((x) => x.grupo === 'pasado' && x.verbo?.inf === 'werken');
    if (!werken) throw new Error('falta werken');
    const pasado = verbos.crearEjercicio(werken, contexto);
    expect(pasado.forma).toBe('traducir');
    expect(verbos.diagnosticar?.(pasado, 'Vroeger heb ik in een restaurant gewerkt')).toEqual([]);
    // Sin otro verbo delante, el verbo de la frase mal conjugado y fuera de sitio se sigue diagnosticando, también
    // detrás de una subordinada con su verbo mal conjugado.
    expect(casos(diagnostico('Morgen ga ik', 'Morgen ik gaat naar mijn schoonouders'))).toEqual(['presente-ik-con-t', 'inversion-delante']);
    expect(casos(diagnostico('Als ik tijd heb', 'Als ik tijd hebt, komt ik langs'))).toEqual(['presente-ik-con-t']);
    expect(casos(diagnostico('Ik bel je morgen', 'Ik opbel je morgen'))).toEqual(['separable-pegado']);
    // Un sustantivo que se escribe como un verbo («fiets», con un adjetivo detrás del artículo) no es otro verbo.
    expect(casos(diagnostico('Ik wil morgen', 'Een nieuwe fiets wil ik kopen morgen'))).toEqual(['infinitivo-al-final']);
  });

  it('el perfectum dicho en otro tiempo o con otro verbo conjugado no lleva un participio sin ge-', () => {
    // Lo contrario de «Vroeger heb ik … gewerkt»: «werkte» y el «werken» de «ik ga … werken» no intentan ser el participio.
    const werken = ELEMENTOS_VERBOS.find((x) => x.grupo === 'perfectum' && x.verbo?.inf === 'werken');
    if (!werken) throw new Error('falta werken');
    const perfectum = verbos.crearEjercicio(werken, contexto);
    expect(perfectum.forma).toBe('traducir');
    expect(verbos.diagnosticar?.(perfectum, 'Ik werkte de hele dag')).toEqual([]);
    expect(verbos.diagnosticar?.(perfectum, 'Ik ga de hele dag werken')).toEqual([]);
    // Con el auxiliar, lo que va detrás sí es su participio, y se sigue diagnosticando.
    expect(casos(verbos.diagnosticar?.(perfectum, 'Ik heb de hele dag werken') ?? [])).toEqual(['participio-sin-ge']);
    expect(casos(verbos.diagnosticar?.(perfectum, 'Ik heb de hele dag gewerkd') ?? [])).toEqual(['participio-kofschip']);
    // Sin auxiliar, tampoco lo que se escribe como una forma conjugada, aunque los datos no traigan ese pasado
    // («belde», «trouwden») o sea el presente («spelen»).
    const perfectumDe = (inf: string): Ejercicio => {
      const v = ELEMENTOS_VERBOS.find((x) => x.grupo === 'perfectum' && x.verbo?.inf === inf);
      if (!v) throw new Error(`falta ${inf}`);
      return verbos.crearEjercicio(v, contexto);
    };
    for (const [inf, r] of [
      ['bellen', 'Mijn moeder belde gisteren'],
      ['bellen', 'Gisteren belde mijn moeder'],
      ['trouwen', 'Ze trouwden in juni'],
      ['koken', 'Hij kookte voor iedereen'],
      ['spelen', 'De kinderen speelden de hele middag buiten'],
      ['spelen', 'De kinderen spelen de hele middag buiten'],
    ] as const) {
      expect(verbos.diagnosticar?.(perfectumDe(inf), r), r).toEqual([]);
    }
    // Con el auxiliar, o sin él pero con ge-, sí intenta ser el participio.
    expect(casos(verbos.diagnosticar?.(perfectumDe('bellen'), 'Mijn moeder heeft gisteren belt') ?? [])).toEqual(['participio-sin-ge']);
    expect(casos(verbos.diagnosticar?.(perfectumDe('bellen'), 'Mijn moeder gisteren gebelt') ?? [])).toEqual(['participio-kofschip']);
  });
});
