// Fallos típicos, sobre frases y palabras reales de la app, con la explicación
// que daría. Salen en docs/revision.md para que una persona nativa revise que
// esas explicaciones dicen bien la regla: hay al menos uno por cada caso (ver
// casos.ts), y las pruebas comprueban que cada uno da el caso que dice.

import { crearAzar, type Diagnostico, type Ejercicio } from '../../motor';
import { alternativas, comoFrase } from '../comun';
import { ELEMENTOS_ORDEN, ejercicioDeFrase, orden } from '../orden/pista';
import { ELEMENTOS_VERBOS, formasPresente, SUJETOS, verbos } from '../verbos/pista';
import { ELEMENTOS_VOCABULARIO, vocabulario } from '../vocabulario/pista';
import { CASOS, type Caso, type DiagnosticoNl } from './casos';

interface Base {
  /** Su código permanente para revisarlo (E17). */
  readonly codigo: string;
  /** El caso que tiene que dar: lo comprueban las pruebas. */
  readonly caso: Caso;
  readonly respuesta: string;
}

export type EjemploDeError =
  /** Una frase de la pista de orden (por su código), traducida. */
  | (Base & { readonly frase: string })
  /** La frase de ejemplo de un verbo (por su código), traducida en perfectum o en pasado. */
  | (Base & { readonly verbo: string; readonly traducir: 'perfectum' | 'pasado' })
  /** Una forma escrita en el hueco: el presente de un verbo con un sujeto, o el participio de su frase de ejemplo (también de un separable). */
  | (Base & { readonly verbo: string; readonly hueco: 'presente' | 'participio'; readonly sujeto?: string })
  /** El artículo elegido para una palabra (por su código). */
  | (Base & { readonly palabra: string });

/** Fallos típicos con su código permanente. Uno nuevo lleva el siguiente número libre; un código no se reutiliza. */
export const EJEMPLOS_DE_ERROR: readonly EjemploDeError[] = [
  { codigo: 'E1', caso: 'inversion-delante', frase: 'O1', respuesta: 'Morgen ik ga naar mijn schoonouders' },
  { codigo: 'E2', caso: 'infinitivo-al-final', frase: 'O9', respuesta: 'Ik wil kopen morgen een nieuwe fiets' },
  { codigo: 'E3', caso: 'participio-al-final', frase: 'O17', respuesta: 'Ik heb gewerkt gisteren de hele dag' },
  { codigo: 'E4', caso: 'participio-kofschip', frase: 'O17', respuesta: 'Ik heb gisteren de hele dag gewerkd' },
  { codigo: 'E5', caso: 'auxiliar-zijn', frase: 'O18', respuesta: 'We hebben in het weekend naar Utrecht gegaan' },
  { codigo: 'E6', caso: 'participio-irregular', frase: 'O19', respuesta: 'Heb je goed geslaapt?' },
  { codigo: 'E7', caso: 'separable-pegado', frase: 'O25', respuesta: 'Ik opbel je morgen' },
  { codigo: 'E8', caso: 'niet-sitio', frase: 'O34', respuesta: 'Ik heb niet het gezien' },
  { codigo: 'E9', caso: 'geen', frase: 'O39', respuesta: 'Ik heb vandaag niet tijd' },
  { codigo: 'E10', caso: 'pregunta-interrogativa', frase: 'O42', respuesta: 'Waar je zus woont?' },
  { codigo: 'E11', caso: 'presente-jij-detras', frase: 'O41', respuesta: 'Werkt jij morgen?' },
  { codigo: 'E12', caso: 'presente-ik-con-t', frase: 'O2', respuesta: 'Vandaag werkt ik thuis' },
  { codigo: 'E13', caso: 'subordinada-un-verbo', frase: 'O49', respuesta: 'Ik blijf thuis omdat ik ben niet lekker' },
  { codigo: 'E14', caso: 'subordinada-varios-verbos', frase: 'O50', respuesta: 'Ik denk dat het gaat regenen morgen' },
  { codigo: 'E15', caso: 'subordinada-delante', frase: 'O57', respuesta: 'Als ik tijd heb, ik kom langs' },
  { codigo: 'E16', caso: 'subordinada-un-verbo', frase: 'O57', respuesta: 'Als ik heb tijd, kom ik langs' },
  { codigo: 'E17', caso: 'pregunta-si-no', frase: 'O13', respuesta: 'Ik mag je iets vragen?' },
  // Con jij delante, «werkt» está bien para ese orden: lo que falla es el orden, y al cambiarlo se cae la -t.
  { codigo: 'E18', caso: 'pregunta-si-no', frase: 'O46', respuesta: 'Jij komt ook naar het feest?' },
  { codigo: 'E19', caso: 'inversion-otro-delante', frase: 'O8', respuesta: 'Om zes uur we eten meestal' },
  { codigo: 'E20', caso: 'inversion-segunda', frase: 'O33', respuesta: 'Ik morgen kom niet' },
  { codigo: 'E21', caso: 'inversion-niet', frase: 'O35', respuesta: 'Dat niet is waar' },
  { codigo: 'E22', caso: 'particula-al-final', frase: 'O25', respuesta: 'Ik bel je op morgen' },
  { codigo: 'E23', caso: 'falta-particula', frase: 'O30', respuesta: 'Ik nodig mijn vrienden voor zaterdag' },
  { codigo: 'E24', caso: 'pasado-con-presente', verbo: 'V1', traducir: 'pasado', respuesta: 'Vroeger werk ik in een restaurant' },
  { codigo: 'E25', caso: 'pasado-plural-sin-n', verbo: 'V2', traducir: 'pasado', respuesta: 'Toen woonde we in Madrid' },
  { codigo: 'E26', caso: 'pasado-singular-con-n', verbo: 'V3', traducir: 'pasado', respuesta: 'Mijn moeder maakten altijd paella' },
  { codigo: 'E27', caso: 'pasado-te-de', verbo: 'V2', traducir: 'pasado', respuesta: 'Toen woonten we in Madrid' },
  // El irregular hecho con la regla: el fallo más típico del pasado.
  { codigo: 'E28', caso: 'pasado-irregular', verbo: 'V21', traducir: 'pasado', respuesta: 'Hij komde om negen uur thuis' },
  { codigo: 'E29', caso: 'presente-falta-t', verbo: 'V1', hueco: 'presente', sujeto: 'hij', respuesta: 'werk' },
  { codigo: 'E30', caso: 'presente-je-posesivo', frase: 'O42', respuesta: 'Waar woon je zus?' },
  { codigo: 'E31', caso: 'presente-plural', frase: 'O11', respuesta: 'We moet om acht uur bij mijn ouders zijn' },
  { codigo: 'E32', caso: 'presente-infinitivo', frase: 'O37', respuesta: 'Ik begrijpen het niet' },
  { codigo: 'E33', caso: 'presente-con-pasado', frase: 'O2', respuesta: 'Vandaag werkte ik thuis' },
  { codigo: 'E34', caso: 'presente-otra', frase: 'O49', respuesta: 'Ik blijf thuis omdat ik niet lekker is' },
  { codigo: 'E35', caso: 'participio-separable', verbo: 'S1', hueco: 'participio', respuesta: 'geopbeld' },
  { codigo: 'E36', caso: 'participio-prefijo', verbo: 'V9', traducir: 'perfectum', respuesta: 'Ik heb de rekening al gebetaald' },
  { codigo: 'E37', caso: 'participio-sin-ge', verbo: 'V10', traducir: 'perfectum', respuesta: 'De kinderen hebben de hele middag buiten speeld' },
  { codigo: 'E38', caso: 'participio-raiz-td', verbo: 'V4', traducir: 'perfectum', respuesta: 'Ik heb lang met mijn schoonvader gepraatt' },
  { codigo: 'E39', caso: 'participio-kofschip', verbo: 'V13', traducir: 'perfectum', respuesta: 'Ze hebben veel gereist' },
  { codigo: 'E40', caso: 'auxiliar-hebben', frase: 'O19', respuesta: 'Ben je goed geslapen?' },
  { codigo: 'E41', caso: 'articulo-diminutivo', palabra: 'P18', respuesta: 'de' },
  { codigo: 'E42', caso: 'articulo-het', palabra: 'P21', respuesta: 'de' },
  { codigo: 'E43', caso: 'articulo-de', palabra: 'P20', respuesta: 'het' },
];

export interface EjemploDiagnosticado {
  readonly codigo: string;
  readonly caso: Caso;
  /** El código de la frase, el verbo o la palabra de la app en que se basa (O13, V2, S1, P18). */
  readonly de: string;
  /** La frase o la palabra buena. */
  readonly frase: string;
  /** Lo que se ha escrito o elegido, en su frase. */
  readonly respuesta: string;
  readonly diagnosticos: readonly DiagnosticoNl[];
}

const CASOS_VALIDOS: ReadonlySet<string> = new Set(CASOS);

/** Si un diagnóstico lleva caso: todos los de la parte de neerlandés lo llevan. */
function conCaso(d: Diagnostico): d is DiagnosticoNl {
  return 'caso' in d && typeof d.caso === 'string' && CASOS_VALIDOS.has(d.caso);
}

function soloConCaso(lista: readonly Diagnostico[], codigo: string): DiagnosticoNl[] {
  return lista.map((d) => {
    if (!conCaso(d)) throw new Error(`${codigo}: diagnóstico sin caso («${d.titulo}»)`);
    return d;
  });
}

/** Lo que pide el ejemplo, con la frase buena y la respuesta en su frase. */
function ejercicioDe(e: EjemploDeError): { de: string; ejercicio: Ejercicio; frase: string; respuesta: string; diagnosticar: (ej: Ejercicio, r: string) => readonly Diagnostico[] } {
  const azar = crearAzar(1);
  if ('frase' in e) {
    const f = ELEMENTOS_ORDEN.find((x) => x.codigo === e.frase);
    if (!f) throw new Error(`${e.codigo}: no existe la frase ${e.frase}`);
    const ejercicio = ejercicioDeFrase(f, 'traducir', { azar, vistos: new Set(), repeticiones: 1, formas: new Set(['traducir'] as const) });
    return { de: e.frase, ejercicio, frase: f.frase, respuesta: e.respuesta, diagnosticar: (ej, r) => orden.diagnosticar?.(ej, r) ?? [] };
  }
  if ('palabra' in e) {
    const p = ELEMENTOS_VOCABULARIO.find((x) => x.codigo === e.palabra);
    if (!p?.articulo) throw new Error(`${e.codigo}: ${e.palabra} no es una palabra con artículo`);
    const sustantivo = p.nl.replace(/^(de|het) /, '');
    const ejercicio: Ejercicio = {
      forma: 'opcion',
      tipo: 'vocabulario.articulo',
      elementoId: p.id,
      instruccion: '',
      enunciado: sustantivo,
      enunciadoEnIdioma: true,
      opciones: ['de', 'het'],
      opcionesEnIdioma: true,
      respuestaCorrecta: p.articulo,
    };
    return { de: e.palabra, ejercicio, frase: p.nl, respuesta: `${e.respuesta} ${sustantivo}`, diagnosticar: (ej, r) => vocabulario.diagnosticar?.(ej, r) ?? [] };
  }
  const diagnosticar = (ej: Ejercicio, r: string): readonly Diagnostico[] => verbos.diagnosticar?.(ej, r) ?? [];
  if ('traducir' in e) {
    const grupos = e.traducir === 'pasado' ? ['pasado'] : ['perfectum', 'perfectum-irregular'];
    const v = ELEMENTOS_VERBOS.find((x) => x.verbo?.codigo === e.verbo && grupos.includes(x.grupo));
    if (!v) throw new Error(`${e.codigo}: ${e.verbo} no tiene ${e.traducir}`);
    const ejercicio = verbos.crearEjercicio(v, { azar, vistos: new Set(), repeticiones: 1, formas: new Set(['traducir'] as const) });
    if (ejercicio.forma !== 'traducir') throw new Error(`${e.codigo}: no sale un ejercicio de traducir`);
    return { de: e.verbo, ejercicio, frase: ejercicio.respuestas[0] ?? '', respuesta: e.respuesta, diagnosticar };
  }
  if (e.hueco === 'participio') {
    const v = ELEMENTOS_VERBOS.find((x) => (x.verbo?.codigo ?? x.separable?.codigo) === e.verbo && x.grupo !== 'presente' && x.grupo !== 'pasado');
    if (!v) throw new Error(`${e.codigo}: ${e.verbo} no tiene participio`);
    const ejercicio = verbos.crearEjercicio(v, { azar, vistos: new Set(), repeticiones: 1, formas: new Set(['completar'] as const) });
    if (ejercicio.forma !== 'completar') throw new Error(`${e.codigo}: no sale un ejercicio de completar`);
    return { de: e.verbo, ejercicio, frase: `${ejercicio.antes}${ejercicio.respuestas[0] ?? ''}${ejercicio.despues}`, respuesta: `${ejercicio.antes}${e.respuesta}${ejercicio.despues}`, diagnosticar };
  }
  // El presente con un sujeto fijo: en la app el sujeto sale al azar.
  const v = ELEMENTOS_VERBOS.find((x) => x.verbo?.codigo === e.verbo && x.grupo === 'presente');
  const sujeto = SUJETOS.find((s) => s.nl === e.sujeto);
  if (!v?.verbo || !sujeto) throw new Error(`${e.codigo}: ${e.verbo} no tiene presente con «${e.sujeto ?? ''}»`);
  const antes = `${comoFrase(sujeto.nl, '').trimEnd()} `;
  const despues = ` ${v.verbo.comp ?? ''}.`;
  const respuestas = alternativas(formasPresente(v.verbo)[sujeto.i] ?? '');
  const ejercicio: Ejercicio = { forma: 'completar', tipo: 'verbos.presente.completar', elementoId: v.id, instruccion: '', antes, despues, pista: v.verbo.inf, respuestas };
  return { de: e.verbo, ejercicio, frase: `${antes}${respuestas[0] ?? ''}${despues}`, respuesta: `${antes}${e.respuesta}${despues}`, diagnosticar };
}

export function diagnosticarEjemplos(): EjemploDiagnosticado[] {
  return EJEMPLOS_DE_ERROR.map((e) => {
    const { de, ejercicio, frase, respuesta, diagnosticar } = ejercicioDe(e);
    return { codigo: e.codigo, caso: e.caso, de, frase, respuesta, diagnosticos: soloConCaso(diagnosticar(ejercicio, e.respuesta), e.codigo) };
  });
}
