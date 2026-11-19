// El documento para revisar de una sentada todo el neerlandés de la app: numerado para poder decir
// «O12 suena raro» y agrupado como en la app. Lo escribe `npm run revision` en docs/revision.md, y una
// prueba avisa si el contenido cambia y el documento no se ha vuelto a generar.

import { alternativas, comoFrase, primera } from './comun';
import { GRUPOS_ORDEN, NOMBRES_GRUPO_ORDEN, REGLAS_ORDEN } from './orden/datos';
import { ELEMENTOS_ORDEN } from './orden/pista';
import { SEPARABLES, VERBOS, type DatosVerbo } from './verbos/datos';
import { formaConJij, formasPresente } from './verbos/pista';
import { GRUPOS_VOCABULARIO, NOMBRES_GRUPO_VOCABULARIO } from './vocabulario/datos';
import { ELEMENTOS_VOCABULARIO } from './vocabulario/pista';

/** Un texto dentro de una celda de tabla: sin barras que la rompan. */
function celda(texto: string): string {
  return texto.replaceAll('|', '\\|');
}

function presenteEnLinea(v: DatosVerbo): string {
  const f = formasPresente(v);
  const [ik, jij, hij, wij, jullie, zij] = f;
  const plural = wij === jullie && jullie === zij ? `wij, jullie, zij ${wij}` : `wij ${wij}, jullie ${jullie}, zij ${zij}`;
  return `ik ${ik}, jij ${jij}, hij ${hij}, ${plural}`;
}

function bloqueVerbo(v: DatosVerbo, n: number): string[] {
  const lineas = [`**V${String(n)}. ${v.inf}**: ${v.es}`, ''];
  if (v.comp !== undefined) {
    const f = formasPresente(v);
    let presente = `- Presente: ${presenteEnLinea(v)}. «${comoFrase(`ik ${primera(f[0])} ${v.comp}`)}»`;
    if (!v.sinPregunta) {
      const [conJij, ...otras] = alternativas(formaConJij(v));
      presente += ` «${comoFrase(`${conJij ?? ''} jij ${v.comp}`, '?')}»`;
      if (otras.length > 0) presente += ` (también ${otras.map((o) => `«${o} jij»`).join(', ')})`;
    }
    lineas.push(presente);
  }
  if (v.participio && v.perf) {
    lineas.push(`- Perfectum: ${v.aux === 'zijn' ? 'is' : 'heeft'} ${v.participio}. «${comoFrase(v.perf[0])}» ${v.perf[1]}`);
  }
  if (v.pasado) {
    const ejemplo = v.pasadoEj ? ` «${comoFrase(v.pasadoEj[0])}» ${v.pasadoEj[1]}` : '';
    lineas.push(`- Pasado: ${v.pasado[0]}, ${v.pasado[1]}.${ejemplo}`);
  }
  if (v.nota) lineas.push(`- Nota: ${v.nota}`);
  lineas.push('');
  return lineas;
}

export function documentoDeRevision(): string {
  const l: string[] = [
    '# Revisión del neerlandés',
    '',
    'Todo el neerlandés que enseña la app, para que una persona nativa lo revise. Lo ha escrito una IA y nadie del equipo es nativo: hasta que se revise, puede haber frases correctas que nadie diría así.',
    '',
    'Este archivo se genera con `npm run revision`: no se edita a mano. Las correcciones van en los datos (`src/neerlandes/*/datos.ts`).',
    '',
    '## Cómo revisarlo',
    '',
    '- Lee cada frase en neerlandés y marca lo que no dirías así, aunque sea correcto.',
    '- Comprueba que la traducción dice lo mismo que la frase.',
    '- Apunta el número (O12, V3, S5, P40) y cómo lo dirías tú.',
    '',
    '**Voor wie dit nakijkt:** hier staan alle Nederlandse zinnen en woorden uit de app. Klopt het en klinkt het natuurlijk? Schrijf het nummer op (bijvoorbeeld O12) en hoe jij het zou zeggen.',
    '',
    `## Orden de la frase (O1 a O${String(ELEMENTOS_ORDEN.length)})`,
    '',
  ];

  let n = 0;
  for (const grupo of GRUPOS_ORDEN) {
    l.push(`### ${NOMBRES_GRUPO_ORDEN[grupo]}`, '', `> ${REGLAS_ORDEN[grupo]}`, '', '| # | Neerlandés | Español |', '|---|---|---|');
    for (const f of ELEMENTOS_ORDEN.filter((e) => e.grupo === grupo)) {
      n++;
      const otras = f.validas.slice(1);
      const nl = otras.length > 0 ? `${f.frase}<br>*También:* ${otras.join(' / ')}` : f.frase;
      l.push(`| O${String(n)} | ${celda(nl)} | ${celda(f.es)} |`);
    }
    l.push('');
  }

  l.push(`## Verbos (V1 a V${String(VERBOS.length)})`, '');
  VERBOS.forEach((v, i) => l.push(...bloqueVerbo(v, i + 1)));

  l.push(`## Verbos separables (S1 a S${String(SEPARABLES.length)})`, '');
  SEPARABLES.forEach((s, i) => {
    const otras = (s.otras ?? []).map((o) => `«${comoFrase(o)}»`);
    l.push(
      `**S${String(i + 1)}. ${s.inf}**: ${s.es}`,
      '',
      `- Presente: «${comoFrase(s.presente.replaceAll('|', ' '))}» ${s.presenteEs}${otras.length > 0 ? ` También: ${otras.join(', ')}` : ''}`,
      `- Perfectum: ${s.aux === 'zijn' ? 'is' : 'heeft'} ${s.participio}. «${comoFrase(s.perf[0])}» ${s.perf[1]}`,
      '',
    );
  });

  l.push(`## Vocabulario (P1 a P${String(ELEMENTOS_VOCABULARIO.length)})`, '');
  n = 0;
  for (const grupo of GRUPOS_VOCABULARIO) {
    l.push(`### ${NOMBRES_GRUPO_VOCABULARIO[grupo]}`, '', '| # | Neerlandés | Español | Nota |', '|---|---|---|---|');
    for (const p of ELEMENTOS_VOCABULARIO.filter((e) => e.grupo === grupo)) {
      n++;
      const nl = p.otras.length > 0 ? `${p.nl}<br>*También:* ${p.otras.join(' / ')}` : p.nl;
      l.push(`| P${String(n)} | ${celda(nl)} | ${celda(p.es)} | ${celda(p.nota ?? '')} |`);
    }
    l.push('');
  }

  return `${l.join('\n').trimEnd()}\n`;
}
