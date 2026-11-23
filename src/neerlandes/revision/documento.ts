// El documento para revisar el neerlandés de la app por partes: solo lo que
// falta por revisar, en lotes de unos 15 minutos, cada elemento con su código
// para poder decir «O12 suena raro». Lo escribe `npm run revision` en
// docs/revision.md, y una prueba avisa si el contenido cambia y el documento no
// se ha vuelto a generar.

import { elementosDeRevision, NOMBRES_TIPO, palabrasDe, type ElementoRevision, type Formato, type Tipo } from './elementos';
import { estaRevisado, tramos, type Registro } from './estado';
import REVISADO from './revisado.json';

/** Lo que cabe en un lote: unos 15 minutos. */
export const SEGUNDOS_POR_LOTE = 900;

/**
 * Las estimaciones no se han medido. Si el primer lote cronometrado sale en 20 minutos y no en 15, aquí va 1.33 y
 * todos los lotes se recalculan a la vez.
 */
export const RITMO = 1;

/**
 * Segundos por elemento: un fijo por pensarlo y un tanto por palabra leída. Las frases de orden llevan más fijo
 * porque además de leerlas hay que pensar si falta alguna forma natural de decirlas; las palabras sueltas, poco.
 */
const ESTIMACION: Readonly<Record<Tipo, { readonly fijo: number; readonly porPalabra: number }>> = {
  O: { fijo: 30, porPalabra: 0.9 },
  R: { fijo: 20, porPalabra: 0.8 },
  V: { fijo: 18, porPalabra: 0.75 },
  S: { fijo: 20, porPalabra: 0.8 },
  P: { fijo: 6, porPalabra: 0.8 },
  E: { fijo: 15, porPalabra: 0.6 },
  T: { fijo: 10, porPalabra: 0.8 },
};

export function segundosDe(e: ElementoRevision): number {
  const { fijo, porPalabra } = ESTIMACION[e.tipo];
  return Math.round(RITMO * (fijo + porPalabra * palabrasDe(e)));
}

function segundosDeTodos(elementos: readonly ElementoRevision[]): number {
  return elementos.reduce((suma, e) => suma + segundosDe(e), 0);
}

function minutos(segundos: number): number {
  return Math.max(1, Math.round(segundos / 60));
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

const CABECERAS: Readonly<Partial<Record<Formato, readonly string[]>>> = {
  'tabla-orden': ['| # | Neerlandés | Español |', '|---|---|---|'],
  'tabla-palabras': ['| # | Neerlandés | Español | Nota |', '|---|---|---|---|'],
};

/** Los elementos de un lote con su formato: cada apartado con su título, las tablas con su cabecera. */
function pintar(elementos: readonly ElementoRevision[]): string[] {
  const l: string[] = [];
  let apartado: string | null = null;
  let formato: Formato | null = null;
  // Las filas de una tabla y los puntos de una lista van seguidos: se cierran con una línea en blanco al acabar.
  const cerrar = () => {
    if (formato !== null && formato !== 'bloque') l.push('');
  };
  for (const e of elementos) {
    if (e.apartado !== apartado) {
      cerrar();
      l.push(`### ${e.apartado}`, '');
      apartado = e.apartado;
      formato = null;
    }
    if (e.formato !== formato) {
      cerrar();
      l.push(...(CABECERAS[e.formato] ?? []));
      formato = e.formato;
    }
    l.push(...e.lineas);
    if (e.formato === 'bloque') l.push('');
  }
  cerrar();
  return l;
}

const TIPOS: readonly Tipo[] = ['O', 'R', 'V', 'S', 'P', 'E', 'T'];

function resumen(elementos: readonly ElementoRevision[], registro: Registro): string[] {
  const filas = TIPOS.map((tipo) => {
    const delTipo = elementos.filter((e) => e.tipo === tipo);
    const pendientes = delTipo.filter((e) => !estaRevisado(e, registro));
    const tiempo = pendientes.length > 0 ? String(minutos(segundosDeTodos(pendientes))) : '0';
    return `| ${NOMBRES_TIPO[tipo]} (${tipo}) | ${String(pendientes.length)} | ${String(delTipo.length - pendientes.length)} | ${tiempo} |`;
  });
  const pendientes = elementos.filter((e) => !estaRevisado(e, registro));
  const total = pendientes.length > 0 ? String(minutos(segundosDeTodos(pendientes))) : '0';
  return [
    '| | Pendientes | Revisados | Minutos pendientes |',
    '|---|---|---|---|',
    ...filas,
    `| **Total** | **${String(pendientes.length)}** | **${String(elementos.length - pendientes.length)}** | **${total}** |`,
  ];
}

export function documentoDeRevision(registro: Registro = REVISADO, elementos: readonly ElementoRevision[] = elementosDeRevision()): string {
  const pendientes = elementos.filter((e) => !estaRevisado(e, registro));
  const revisados = elementos.filter((e) => estaRevisado(e, registro));
  const lotes = repartirEnLotes(pendientes);

  const l: string[] = [
    '# Revisión del neerlandés',
    '',
    'El neerlandés que enseña la app, para que una persona nativa lo revise. Lo ha escrito una IA y nadie del equipo es nativo: hasta que se revise, puede haber frases correctas que nadie diría así.',
    '',
    'Este archivo se genera con `npm run revision`: no se edita a mano. Las correcciones van en los datos (`src/neerlandes/*/datos.ts`) o en el texto de donde sale cada cosa.',
    '',
    '## Cómo revisarlo',
    '',
    `Aquí sale solo lo que falta por revisar, en lotes de unos ${String(SEGUNDOS_POR_LOTE / 60)} minutos: uno por sesión. Los tiempos son una estimación sin medir; si el primer lote no sale en ${String(SEGUNDOS_POR_LOTE / 60)} minutos, se ajusta \`RITMO\` en \`src/neerlandes/revision/documento.ts\`.`,
    '',
    '- Lee cada frase en neerlandés y marca lo que no dirías así, aunque sea correcto.',
    '- Comprueba que la traducción dice lo mismo que la frase.',
    '- Apunta el código (O12, R3, V3, S5, P40, E4, T2) y cómo lo dirías tú.',
    '- Al traducir, la app acepta además, sin que estén apuntadas, las formas tónicas: wij por we, mij por me, y zij por ze cuando abre la frase.',
    '',
    'Qué mirar en cada tipo:',
    '',
    '- **O, orden de la frase:** que la frase sea natural y que estén todas las formas naturales de decirla. Si falta una, la app suspende una respuesta buena.',
    '- **R, reglas:** salen al abrir cada grupo y al corregir. Que la regla esté bien dicha.',
    '- **V y S, verbos:** las formas, los ejemplos y su traducción.',
    '- **P, vocabulario:** la palabra con su artículo, sus otras formas y que el significado sea ese.',
    '- **E, explicaciones de errores:** cuando se falla una frase, la app explica qué regla se ha roto con las palabras de esa frase. Las explicaciones se montan solas; aquí van fallos típicos con lo que diría la app. Que la regla esté bien dicha y que el neerlandés de la explicación sea correcto.',
    '- **T, otros textos:** textos de la app que llevan neerlandés o hablan de él.',
    '',
    'Al terminar un lote: aplica sus correcciones y marca el lote con la orden que lleva debajo del título (`npm run revisado -- …`), que apunta qué se ha revisado y vuelve a generar este archivo. Marca solo lo que ha visto tal como queda: si al corregir cambias algo más de lo que dijo, deja ese código fuera. Si después cambia algo de lo revisado, vuelve solo a pendiente.',
    '',
    '**Voor wie dit nakijkt:** hier staan de Nederlandse zinnen en woorden uit de app die nog niemand heeft nagekeken. Klopt het en klinkt het natuurlijk? Schrijf het nummer op (bijvoorbeeld O12) en hoe jij het zou zeggen. Je hoeft niet alles in één keer te doen: elk blok (Lote) kost ongeveer een kwartier.',
    '',
    '## Resumen',
    '',
    ...resumen(elementos, registro),
    '',
  ];

  if (lotes.length === 0) l.push('Todo está revisado.', '');
  lotes.forEach((lote, i) => {
    const codigos = lote.map((e) => e.codigo);
    l.push(
      `## Lote ${String(i + 1)} (unos ${String(minutos(segundosDeTodos(lote)))} minutos)`,
      '',
      `Para marcarlo cuando esté corregido: \`npm run revisado -- ${tramos(codigos, '-', ' ')}\``,
      '',
      ...pintar(lote),
    );
  });

  l.push('## Ya revisado', '');
  if (revisados.length === 0) l.push('Nada todavía.');
  for (const tipo of TIPOS) {
    const delTipo = revisados.filter((e) => e.tipo === tipo).map((e) => e.codigo);
    if (delTipo.length > 0) l.push(`- ${NOMBRES_TIPO[tipo]}: ${tramos(delTipo)}`);
  }

  return `${l.join('\n').trimEnd()}\n`;
}
