// El documento para revisar de una sentada todo el neerlandés de la app: numerado para poder decir
// «O12 suena raro» y agrupado como en la app. Lo escribe `npm run revision` en docs/revision.md, y una
// prueba avisa si el contenido cambia y el documento no se ha vuelto a generar.

import { alternativas, comoFrase, primera } from './comun';
import { diagnosticarEjemplos } from './diagnostico/ejemplos';
import { GRUPOS_ORDEN, NOMBRES_GRUPO_ORDEN, REGLAS_ORDEN } from './orden/datos';
import { ELEMENTOS_ORDEN } from './orden/pista';
import { SEPARABLES, VERBOS, type DatosVerbo } from './verbos/datos';
import { formaConJij, formasPresente, REGLAS_VERBOS } from './verbos/pista';
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

/** « También: «…», «…»» con las otras formas buenas, o nada. */
function tambien(otras: readonly string[] | undefined): string {
  return otras && otras.length > 0 ? ` También: ${otras.map((o) => `«${comoFrase(o)}»`).join(', ')}` : '';
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
  } else if (v.raiz && v.pasado) {
    // No se practica, pero sale como opción mala en el pasado: también hay que revisarlo.
    lineas.push(`- Presente (solo sale como opción mala en el pasado): ${presenteEnLinea(v)}.`);
  }
  if (v.participio && v.perf) {
    lineas.push(`- Perfectum: ${v.aux === 'zijn' ? 'is' : 'heeft'} ${v.participio}. «${comoFrase(v.perf[0])}» ${v.perf[1]}${tambien(v.perfOtras)}`);
  }
  if (v.pasado) {
    const ejemplo = v.pasadoEj ? ` «${comoFrase(v.pasadoEj[0])}» ${v.pasadoEj[1]}${tambien(v.pasadoOtras)}` : '';
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
    '- Apunta el número (O12, V3, S5, P40, E4) y cómo lo dirías tú.',
    '- Al traducir, la app acepta además, sin que estén apuntadas, las formas tónicas: wij por we, mij por me, y zij por ze cuando abre la frase.',
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
      // La pista sale al traducir y a veces trae neerlandés: también se revisa.
      const es = f.pista ? `${f.es}<br>*Pista:* ${f.pista}` : f.es;
      l.push(`| O${String(n)} | ${celda(nl)} | ${celda(es)} |`);
    }
    l.push('');
  }

  // Las reglas salen al presentar cada grupo y al corregir cada ejercicio de verbos.
  l.push(
    `## Verbos (V1 a V${String(VERBOS.length)})`,
    '',
    `> **Presente.** ${REGLAS_VERBOS.presente}`,
    '>',
    `> **Perfectum regular.** ${REGLAS_VERBOS.perfectum}`,
    '>',
    `> **Perfectum irregular.** ${REGLAS_VERBOS['perfectum-irregular']}`,
    '>',
    `> **Perfectum con zijn.** ${REGLAS_VERBOS.zijn}`,
    '>',
    `> **Pasado simple.** ${REGLAS_VERBOS.pasado}`,
    '',
  );
  VERBOS.forEach((v, i) => l.push(...bloqueVerbo(v, i + 1)));

  l.push(`## Verbos separables (S1 a S${String(SEPARABLES.length)})`, '', `> ${REGLAS_VERBOS.separables}`, '');
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

  const ejemplos = diagnosticarEjemplos();
  l.push(
    `## Explicaciones de errores (E1 a E${String(ejemplos.length)})`,
    '',
    'Cuando se falla una frase, la app explica qué regla se ha roto con las palabras de esa frase. Las explicaciones se montan solas; aquí van fallos típicos con lo que diría la app. Revisa que la regla esté bien dicha y que el neerlandés de la explicación sea correcto.',
    '',
  );
  ejemplos.forEach((e, i) => {
    l.push(`**E${String(i + 1)}.** «${e.frase}» → respuesta: «${e.respuesta}»`, '');
    for (const d of e.diagnosticos) l.push(`- **${d.titulo}.** ${d.texto}`);
    l.push('');
  });

  return `${l.join('\n').trimEnd()}\n`;
}
