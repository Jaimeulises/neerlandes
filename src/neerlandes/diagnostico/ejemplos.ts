// Fallos típicos de quien habla con el orden del inglés, sobre frases reales de
// la app. Salen en docs/revision.md con la explicación que daría la app, para
// revisar que esas explicaciones dicen bien la regla, y las pruebas comprueban
// que cada uno tiene diagnóstico.

import { crearAzar, type Diagnostico } from '../../motor';
import { ELEMENTOS_ORDEN, ejercicioDeFrase, orden } from '../orden/pista';

/** El principio de una frase de la pista de orden y una respuesta mal dicha. */
export const EJEMPLOS_DE_ERROR: readonly (readonly [string, string])[] = [
  ['Morgen ga ik', 'Morgen ik ga naar mijn schoonouders'],
  ['Ik wil morgen', 'Ik wil kopen morgen een nieuwe fiets'],
  ['Ik heb gisteren', 'Ik heb gewerkt gisteren de hele dag'],
  ['Ik heb gisteren', 'Ik heb gisteren de hele dag gewerkd'],
  ['We zijn in het weekend', 'We hebben in het weekend naar Utrecht gegaan'],
  ['Heb je goed', 'Heb je goed geslaapt?'],
  ['Ik bel je morgen', 'Ik opbel je morgen'],
  ['Ik heb het niet', 'Ik heb niet het gezien'],
  ['Ik heb vandaag geen', 'Ik heb vandaag niet tijd'],
  ['Waar woont je zus', 'Waar je zus woont?'],
  ['Werk jij morgen', 'Werkt jij morgen?'],
  ['Vandaag werk ik', 'Vandaag werkt ik thuis'],
  ['Ik blijf thuis omdat', 'Ik blijf thuis omdat ik ben niet lekker'],
  ['Ik denk dat het', 'Ik denk dat het gaat regenen morgen'],
  ['Als ik tijd heb', 'Als ik tijd heb, ik kom langs'],
  ['Als ik tijd heb', 'Als ik heb tijd, kom ik langs'],
];

export interface EjemploDiagnosticado {
  readonly frase: string;
  readonly respuesta: string;
  readonly diagnosticos: readonly Diagnostico[];
}

export function diagnosticarEjemplos(): EjemploDiagnosticado[] {
  const contexto = { azar: crearAzar(1), vistos: new Set<string>(), repeticiones: 1, formas: new Set(['traducir'] as const) };
  return EJEMPLOS_DE_ERROR.map(([inicio, respuesta]) => {
    const f = ELEMENTOS_ORDEN.find((e) => e.frase.startsWith(inicio));
    if (!f) throw new Error(`Ejemplo de error sin frase: ${inicio}`);
    const ejercicio = ejercicioDeFrase(f, 'traducir', contexto);
    return { frase: f.frase, respuesta, diagnosticos: orden.diagnosticar?.(ejercicio, respuesta) ?? [] };
  });
}
