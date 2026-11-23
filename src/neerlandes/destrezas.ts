// Las destrezas que se miden: cada regla que hay que saber aplicar al hablar.
// Cada ejercicio dice cuáles entrena, y cada fallo con diagnóstico dice cuál se
// ha roto. Con eso se calcula el nivel de cada una (src/motor/nivel.ts).
//
// El nivel del Marco Común Europeo de cada destreza es orientativo: dice cuándo
// se espera dominarla, no certifica nada. Lo que la app mide es gramática
// producida, no la conversación ni el oído.

import type { Destreza } from '../motor';

export const DESTREZAS = [
  { id: 'presente', nombre: 'Conjugar en presente', nivel: 'A2', descripcion: 'ik werk, jij werkt, werk jij?, wij werken.' },
  { id: 'inversion', nombre: 'Verbo en segunda posición', nivel: 'A2', descripcion: 'Morgen ga ik…: si la frase no empieza por el sujeto, el verbo va antes que él.' },
  { id: 'modal', nombre: 'Modal + infinitivo al final', nivel: 'A2', descripcion: 'Ik wil morgen een fiets kopen.' },
  { id: 'perfectum-orden', nombre: 'Perfectum: participio al final', nivel: 'A2', descripcion: 'Ik heb gisteren de hele dag gewerkt.' },
  { id: 'participio', nombre: 'Participio regular', nivel: 'A2', descripcion: 'ge + raíz + t o d (’t kofschip).' },
  { id: 'auxiliar', nombre: 'Hebben o zijn', nivel: 'A2', descripcion: 'Ik heb gewerkt, pero ik ben gegaan.' },
  { id: 'niet', nombre: 'Niet y geen', nivel: 'A2', descripcion: 'Dónde va niet y cuándo se dice geen.' },
  { id: 'preguntas', nombre: 'Preguntas', nivel: 'A2', descripcion: 'Werk jij morgen? Waar woont je zus?' },
  { id: 'vocabulario', nombre: 'Vocabulario básico', nivel: 'A2', descripcion: 'Las palabras de todos los días.' },
  { id: 'articulo', nombre: 'De o het', nivel: 'A2', descripcion: 'El artículo de cada sustantivo.' },
  { id: 'participio-irregular', nombre: 'Participios irregulares', nivel: 'B1', descripcion: 'gegeten, geslapen, gedacht…' },
  { id: 'separables', nombre: 'Verbos separables', nivel: 'B1', descripcion: 'Ik bel je op, pero omdat ik je opbel.' },
  { id: 'subordinada', nombre: 'Verbo al final en subordinadas', nivel: 'B1', descripcion: '…omdat ik moe ben, …dat ik het heb gezien.' },
  { id: 'subordinada-delante', nombre: 'Subordinada delante', nivel: 'B1', descripcion: 'Als het regent, neem ik de tram.' },
  { id: 'pasado', nombre: 'Pasado simple', nivel: 'B1', descripcion: 'werkte, woonden, ging, was.' },
] as const satisfies readonly Destreza[];

export type IdDestreza = (typeof DESTREZAS)[number]['id'];

/** Lo que hace falta para B2 y la app aún no practica: se enseña en Progreso para no dar una idea falsa del nivel. */
export const FALTA_PARA_B2: readonly string[] = [
  'Relativas (de man die…, het huis dat…)',
  'Om te + infinitivo y te con los verbos que lo piden',
  'Er en todos sus usos',
  'Pasiva (worden, zijn + participio)',
  'Cuándo pasado simple y cuándo perfectum al contar',
  'Escuchar y responder a velocidad normal',
];

export function nombreDeDestreza(id: string): string {
  return DESTREZAS.find((d) => d.id === id)?.nombre ?? id;
}
