// El documento para revisar el neerlandés de la app por partes: solo lo que
// falta por revisar, en lotes de unos 15 minutos, cada elemento con su código
// para poder decir «O12 suena raro». Lo escribe `npm run revision` en
// docs/revision.md, y una prueba avisa si el contenido cambia y el documento no
// se ha vuelto a generar. Está pensado para leerlo en el móvil o en papel: el
// neerlandés primero, cada forma en su línea, sin tablas anchas, y lo que solo
// necesita quien aplica las correcciones, al final.

import { elementosDeRevision, NOMBRES_TIPO, palabrasDe, type ElementoRevision, type Tipo } from './elementos';
import { estaRevisado, lineaDeLote, tramos, type Registro } from './estado';
import REVISADO from './revisado.json';

/** Lo que cabe en un lote: unos 15 minutos. */
export const SEGUNDOS_POR_LOTE = 900;

/**
 * Las estimaciones no se han medido. Si el primer lote cronometrado sale en 20 minutos y no en 15, aquí va 1.33 y
 * todos los lotes se recalculan a la vez.
 */
export const RITMO = 1;

/** En las frases de orden lo caro es pensar si falta alguna forma natural y escribirla: un fijo alto y un poco por cada forma apuntada. */
const FRASE = { fijo: 45, porForma: 3 };

/** Los demás: un fijo por pensarlo y un tanto por palabra leída (solo del contenido, sin etiquetas ni códigos). */
const ESTIMACION: Readonly<Record<Exclude<Tipo, 'O'>, { readonly fijo: number; readonly porPalabra: number }>> = {
  R: { fijo: 20, porPalabra: 0.8 },
  V: { fijo: 18, porPalabra: 0.75 },
  S: { fijo: 20, porPalabra: 0.8 },
  P: { fijo: 6, porPalabra: 0.8 },
  E: { fijo: 15, porPalabra: 0.6 },
  T: { fijo: 10, porPalabra: 0.8 },
};

export function segundosDe(e: ElementoRevision): number {
  if (e.tipo === 'O') return Math.round(RITMO * (FRASE.fijo + FRASE.porForma * (1 + e.contenido.otras.length)));
  const { fijo, porPalabra } = ESTIMACION[e.tipo];
  return Math.round(RITMO * (fijo + porPalabra * palabrasDe(e)));
}

function segundosDeTodos(elementos: readonly ElementoRevision[]): number {
  return elementos.reduce((suma, e) => suma + segundosDe(e), 0);
}

function minutos(segundos: number): number {
  return Math.max(1, Math.round(segundos / 60));
}

function unosMinutos(segundos: number): string {
  const m = minutos(segundos);
  return m === 1 ? 'un minuto' : `unos ${String(m)} minutos`;
}

/**
 * Reparte lo pendiente en lotes de hasta `limite` segundos sin partir ningún elemento y sin cambiar el orden. Un
 * elemento más largo que el límite va solo en su lote. Una regla no cierra un lote: pasa al siguiente con las frases
 * que la siguen.
 */
export function repartirEnLotes(pendientes: readonly ElementoRevision[], limite = SEGUNDOS_POR_LOTE): ElementoRevision[][] {
  const lotes: ElementoRevision[][] = [];
  let actual: ElementoRevision[] = [];
  for (const e of pendientes) {
    if (actual.length > 0 && segundosDeTodos(actual) + segundosDe(e) > limite) {
      let corte = actual.length;
      while (corte > 0 && actual[corte - 1]?.tipo === 'R') corte--;
      if (corte === 0) corte = actual.length;
      lotes.push(actual.slice(0, corte));
      actual = actual.slice(corte);
    }
    actual.push(e);
  }
  if (actual.length > 0) lotes.push(actual);
  return lotes;
}

/** « También: «…», «…»» con las otras formas buenas, o nada. */
function tambien(otras: readonly string[]): string {
  return otras.length > 0 ? ` También: ${otras.map((o) => `«${o}»`).join(', ')}` : '';
}

/** Las seis formas del presente en una línea, con el plural junto si es igual en las tres personas. */
function presenteEnLinea(formas: readonly string[]): string {
  const [ik, jij, hij, wij, jullie, zij] = formas;
  const plural = wij === jullie && jullie === zij ? `wij, jullie, zij ${wij ?? ''}` : `wij ${wij ?? ''}, jullie ${jullie ?? ''}, zij ${zij ?? ''}`;
  return `ik ${ik ?? ''}, jij ${jij ?? ''}, hij ${hij ?? ''}, ${plural}`;
}

/** Las palabras y los textos sueltos van en lista, una línea cada uno; lo demás, en bloques. */
function enLista(e: ElementoRevision): boolean {
  return e.tipo === 'P' || e.tipo === 'T';
}

/** Cómo se ve cada elemento: las etiquetas y el formato los pone solo esto, y por eso no cuentan para la huella. */
export function pintarElemento(e: ElementoRevision): string[] {
  switch (e.tipo) {
    case 'O': {
      const c = e.contenido;
      return [
        `**${e.codigo}.** ${c.frase}`,
        '',
        ...(c.otras.length > 0 ? ['*También:*', ...c.otras.map((o) => `- ${o}`), ''] : []),
        `*Español:* ${c.es}`,
        '',
        ...(c.pista ? [`*Pista:* ${c.pista}`, ''] : []),
      ];
    }
    case 'R':
      return [`> **${e.codigo}.** ${e.contexto ? `**${e.contexto}.** ` : ''}${e.contenido.texto}`, ''];
    case 'V': {
      const c = e.contenido;
      const lineas = [`**${e.codigo}. ${c.inf}**: ${c.es}`, ''];
      if (c.presente) {
        const { formas, frase, pregunta, otrasConJij } = c.presente;
        const otras = otrasConJij.length > 0 ? ` (también ${otrasConJij.map((o) => `«${o} jij»`).join(', ')})` : '';
        lineas.push(`- Presente: ${presenteEnLinea(formas)}. «${frase}»${pregunta ? ` «${pregunta}»` : ''}${otras}`);
      }
      if (c.presenteEs) {
        const { formas, resto, pregunta } = c.presenteEs;
        lineas.push(`- En español: ${formas.join(', ')} + «${resto}».${pregunta ? ` La pregunta: «${pregunta}»` : ''}`);
      }
      if (c.presenteOpcion) lineas.push(`- Presente (solo sale como opción mala en el pasado): ${presenteEnLinea(c.presenteOpcion)}.`);
      if (c.perfectum) {
        const { auxiliar, participio, frase, es, otras } = c.perfectum;
        lineas.push(`- Perfectum: ${auxiliar} ${participio}. «${frase}» ${es}${tambien(otras)}`);
      }
      if (c.pasado) {
        const { singular, plural, frase, es, otras } = c.pasado;
        lineas.push(`- Pasado: ${singular}, ${plural}.${frase ? ` «${frase}» ${es ?? ''}` : ''}${tambien(otras)}`);
      }
      if (c.nota) lineas.push(`- Nota: ${c.nota}`);
      return [...lineas, ''];
    }
    case 'S': {
      const { inf, es, presente, perfectum } = e.contenido;
      return [
        `**${e.codigo}. ${inf}**: ${es}`,
        '',
        `- Presente: «${presente.frase}» ${presente.es}${tambien(presente.otras)}`,
        `- Perfectum: ${perfectum.auxiliar} ${perfectum.participio}. «${perfectum.frase}» ${perfectum.es}`,
        '',
      ];
    }
    case 'P': {
      const { nl, otras, es, nota } = e.contenido;
      return [`- **${e.codigo}.** ${nl}${otras.length > 0 ? ` (también ${otras.join(', ')})` : ''}: ${es}${nota ? `. *Nota:* ${nota}` : ''}`];
    }
    case 'E': {
      const { frase, respuesta, diagnosticos } = e.contenido;
      return [
        `**${e.codigo}.** Sobre ${e.de}: «${frase}» → respuesta: «${respuesta}»`,
        '',
        ...diagnosticos.flatMap((d) => [`- **${d.titulo}.** ${d.texto}`, ...(d.pista ? [`  - *Pista antes del segundo intento:* ${d.pista}`] : [])]),
        '',
      ];
    }
    case 'T':
      return [`- **${e.codigo}**${e.contexto ? ` (${e.contexto})` : ''}: ${e.contenido.texto}`];
  }
}

/** Los elementos de un lote: cada apartado con su título, las listas cerradas con una línea en blanco. */
function pintar(elementos: readonly ElementoRevision[]): string[] {
  const l: string[] = [];
  let apartado: string | null = null;
  let lista = false;
  for (const e of elementos) {
    if (e.apartado !== apartado || enLista(e) !== lista) {
      if (lista) l.push('');
      if (e.apartado !== apartado) l.push(`### ${e.apartado}`, '');
      apartado = e.apartado;
      lista = enLista(e);
    }
    l.push(...pintarElemento(e));
  }
  if (lista) l.push('');
  return l;
}

const TIPOS: readonly Tipo[] = ['O', 'R', 'V', 'S', 'P', 'E', 'T'];

function fila(nombre: string, elementos: readonly ElementoRevision[], registro: Registro, negrita = false): string {
  const pendientes = elementos.filter((e) => !estaRevisado(e, registro));
  const tiempo = pendientes.length > 0 ? String(minutos(segundosDeTodos(pendientes))) : '0';
  const celdas = [nombre, String(pendientes.length), String(elementos.length - pendientes.length), tiempo];
  return `| ${celdas.map((c) => (negrita ? `**${c}**` : c)).join(' | ')} |`;
}

function resumen(elementos: readonly ElementoRevision[], registro: Registro): string[] {
  return [
    '| | Pendientes | Revisados | Minutos |',
    '|---|---|---|---|',
    ...TIPOS.map((tipo) => fila(`${NOMBRES_TIPO[tipo]} (${tipo})`, elementos.filter((e) => e.tipo === tipo), registro)),
    fila('Fase 1: orden, verbos y pistas', elementos.filter((e) => e.fase === 1), registro, true),
    fila('Total', elementos, registro, true),
  ];
}

const PARA_QUIEN_REVISA: readonly string[] = [
  '**Voor wie dit nakijkt.** Hier staan de Nederlandse zinnen en woorden uit de app die nog nagekeken moeten worden. Een AI heeft ze geschreven en niemand van ons is moedertaalspreker. Doe één blok (*Lote*) per keer. Een blok duurt naar schatting een kwartier, maar dat is nog niet gemeten: schrijf op hoeveel minuten het eerste blok je kost.',
  '',
  'Klopt elke zin en klinkt hij natuurlijk? Het belangrijkste bij de zinnen (O): staan alle natuurlijke manieren om het te zeggen erbij? Mist er een, schrijf hem dan op, want anders keurt de app een goed antwoord af. *También* betekent ‘ook goed’, *Español* is de betekenis in het Spaans en *Pista* is een hint voor de leerling, ook in het Spaans. *Wij* voor *we*, *mij* voor *me* en *zij* voor *ze* aan het begin van de zin hoef je niet toe te voegen: die keurt de app al goed.',
  '',
  'Schrijf bij elke opmerking de code (bijvoorbeeld O12) en hoe jij het zou zeggen. Kom je niet tot het eind van een blok, schrijf dan op bij welke code je bent gestopt. (Ook deze uitleg is niet door een moedertaalspreker geschreven.)',
  '',
  `**Para quien revisa.** Aquí sale solo lo que falta por revisar, en lotes de unos ${String(SEGUNDOS_POR_LOTE / 60)} minutos: uno por sesión. Es una estimación sin medir: apunta lo que tarda el primero. Lo más importante en las frases (O) es que estén todas las formas naturales de decirlas: si falta una, la app suspende una respuesta buena. Al traducir, la app acepta además, sin que estén apuntadas, wij por we, mij por me, y zij por ze cuando abre la frase. Apunta siempre el código (O12, R3, V3, S5, P40, E4, T2) y cómo lo dirías; si no terminas un lote, hasta qué código llegaste.`,
  '',
  'Qué mirar en cada tipo:',
  '',
  '- **O, orden de la frase:** que la frase sea natural y que estén todas las formas naturales de decirla.',
  '- **R, reglas:** salen al abrir cada grupo y al corregir. Que la regla esté bien dicha.',
  '- **V y S, verbos:** las formas, los ejemplos y su traducción.',
  '- **E, explicaciones de errores:** cuando se falla, la app da primero una pista y deja intentarlo otra vez; si vuelve a fallar, explica qué regla se ha roto con las palabras de esa frase. Aquí van fallos típicos con lo que diría la app, justo detrás de las frases o los verbos de los que salen. Que la regla esté bien dicha y que el neerlandés sea correcto.',
  '- **P, vocabulario:** la palabra con su artículo, sus otras formas y que el significado sea ese.',
  '- **T, otros textos:** textos de la app que llevan neerlandés o hablan de él.',
];

const PARA_QUIEN_CORRIGE: readonly string[] = [
  '## Para quien aplica las correcciones',
  '',
  'Este archivo se genera con `npm run revision` y no se edita a mano: las correcciones van en los datos (`src/neerlandes/*/datos.ts`) o en el código de donde sale cada texto.',
  '',
  '1. Al terminar un lote se marca con la orden que lleva debajo de su título, tal como sale en la copia que se leyó; si no se terminó, solo con los códigos que se leyeron. Se apunta lo que decía esa copia (su orden lleva el id con que se encuentra en este archivo o en su historial de git), no lo que diga el código al marcar, y no se puede marcar nada que no sea de ese lote.',
  '2. Las correcciones se aplican antes o después de marcar, da igual: lo que haya cambiado desde la copia, también lo corregido, vuelve solo a pendiente y sale en el lote siguiente, para que la persona nativa vea cómo ha quedado.',
  '3. Si se corrige una regla (R), hay que mirar también las explicaciones (E) y las pistas (T26, T27 y T29) que la repiten con otras palabras.',
  '4. Si cambia algo que suena (una frase, una palabra o un ejemplo), hay que lanzar `npm run audio` en el Mac antes de instalar la app (`npm run iphone`): hasta entonces lo lee la voz del dispositivo.',
  '5. Los tiempos son una estimación (`ESTIMACION` en `src/neerlandes/revision/documento.ts`); con lo que tarde de verdad el primer lote se ajusta `RITMO`.',
];

export function documentoDeRevision(registro: Registro = REVISADO, elementos: readonly ElementoRevision[] = elementosDeRevision()): string {
  const pendientes = elementos.filter((e) => !estaRevisado(e, registro));
  const revisados = elementos.filter((e) => estaRevisado(e, registro));
  const lotes = repartirEnLotes(pendientes);

  const l: string[] = ['# Revisión del neerlandés', '', ...PARA_QUIEN_REVISA, '', '## Resumen', '', ...resumen(elementos, registro), ''];

  if (lotes.length === 0) l.push('Todo está revisado.', '');
  for (const lote of lotes) {
    const codigos = lote.map((e) => e.codigo);
    // El lote se llama por sus códigos, no por su número: el número cambiaría al marcar o corregir otros. Su orden
    // lleva el id de la línea oculta con las huellas de lo que enseña esta copia, que es lo que se apunta al marcar.
    const { id, linea } = lineaDeLote(lote);
    l.push(`## Lote ${tramos(codigos)} (${unosMinutos(segundosDeTodos(lote))})`, '', `Se marca con: \`npm run revisado -- ${tramos(codigos, '-', ' ')} --lote ${id}\``, linea, '', ...pintar(lote));
  }

  l.push('## Ya revisado', '');
  if (revisados.length === 0) l.push('Nada todavía.');
  for (const tipo of TIPOS) {
    const delTipo = revisados.filter((e) => e.tipo === tipo).map((e) => e.codigo);
    if (delTipo.length > 0) l.push(`- ${NOMBRES_TIPO[tipo]}: ${tramos(delTipo)}`);
  }
  l.push('', ...PARA_QUIEN_CORRIGE);

  return `${l.join('\n').trimEnd()}\n`;
}
