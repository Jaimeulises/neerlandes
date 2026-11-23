// Fallos típicos de quien habla con el orden del inglés, sobre frases reales de
// la app. Salen en docs/revision.md con la explicación que daría la app, para
// revisar que esas explicaciones dicen bien la regla, y las pruebas comprueban
// que cada uno tiene diagnóstico.

import { crearAzar, type Diagnostico } from '../../motor';
import { ELEMENTOS_ORDEN, ejercicioDeFrase, orden } from '../orden/pista';

export interface EjemploDeError {
  readonly codigo: string;
  readonly inicio: string;
  readonly respuesta: string;
}

/** Fallos típicos con su código permanente (E1), el principio de la frase de la pista de orden y la respuesta mal dicha. */
export const EJEMPLOS_DE_ERROR: readonly EjemploDeError[] = [
  { codigo: 'E1', inicio: 'Morgen ga ik', respuesta: 'Morgen ik ga naar mijn schoonouders' },
  { codigo: 'E2', inicio: 'Ik wil morgen', respuesta: 'Ik wil kopen morgen een nieuwe fiets' },
  { codigo: 'E3', inicio: 'Ik heb gisteren', respuesta: 'Ik heb gewerkt gisteren de hele dag' },
  { codigo: 'E4', inicio: 'Ik heb gisteren', respuesta: 'Ik heb gisteren de hele dag gewerkd' },
  { codigo: 'E5', inicio: 'We zijn in het weekend', respuesta: 'We hebben in het weekend naar Utrecht gegaan' },
  { codigo: 'E6', inicio: 'Heb je goed', respuesta: 'Heb je goed geslaapt?' },
  { codigo: 'E7', inicio: 'Ik bel je morgen', respuesta: 'Ik opbel je morgen' },
  { codigo: 'E8', inicio: 'Ik heb het niet', respuesta: 'Ik heb niet het gezien' },
  { codigo: 'E9', inicio: 'Ik heb vandaag geen', respuesta: 'Ik heb vandaag niet tijd' },
  { codigo: 'E10', inicio: 'Waar woont je zus', respuesta: 'Waar je zus woont?' },
  { codigo: 'E11', inicio: 'Werk jij morgen', respuesta: 'Werkt jij morgen?' },
  { codigo: 'E12', inicio: 'Vandaag werk ik', respuesta: 'Vandaag werkt ik thuis' },
  { codigo: 'E13', inicio: 'Ik blijf thuis omdat', respuesta: 'Ik blijf thuis omdat ik ben niet lekker' },
  { codigo: 'E14', inicio: 'Ik denk dat het', respuesta: 'Ik denk dat het gaat regenen morgen' },
  { codigo: 'E15', inicio: 'Als ik tijd heb', respuesta: 'Als ik tijd heb, ik kom langs' },
  { codigo: 'E16', inicio: 'Als ik tijd heb', respuesta: 'Als ik heb tijd, kom ik langs' },
];

export interface EjemploDiagnosticado {
  readonly codigo: string;
  readonly frase: string;
  readonly respuesta: string;
  readonly diagnosticos: readonly Diagnostico[];
}

export function diagnosticarEjemplos(): EjemploDiagnosticado[] {
  const contexto = { azar: crearAzar(1), vistos: new Set<string>(), repeticiones: 1, formas: new Set(['traducir'] as const) };
  return EJEMPLOS_DE_ERROR.map(({ codigo, inicio, respuesta }) => {
    const f = ELEMENTOS_ORDEN.find((e) => e.frase.startsWith(inicio));
    if (!f) throw new Error(`Ejemplo de error sin frase: ${inicio}`);
    const ejercicio = ejercicioDeFrase(f, 'traducir', contexto);
    return { codigo, frase: f.frase, respuesta, diagnosticos: orden.diagnosticar?.(ejercicio, respuesta) ?? [] };
  });
}
