// El diagnóstico de una frase mal dicha: compara la respuesta con los papeles
// de la frase buena y dice qué regla se ha roto, con las palabras de esa frase.
// Está pensado para los errores de quien piensa en inglés: el sujeto antes del
// verbo cuando no toca, el verbo en medio cuando va al final, la -t que sobra o
// falta, hebben por zijn, el participio inventado y la partícula pegada.
//
// Solo dice lo que puede asegurar. Si una forma de la respuesta aparece en
// alguna de las respuestas que valen, no se señala: puede que el fallo esté en
// otro sitio. Si no encuentra nada concreto, no dice nada y queda la
// corrección palabra a palabra.

import { comoFrase, palabras, type Diagnostico } from '../../motor';
import { FORMAS_HEBBEN, FORMAS_ZIJN, formasDe, mismoVerbo } from './formas';
import type { Papeles } from './papeles';
import { explicarAuxiliar, explicarConjugacion, explicarParticipio } from './verbo';

const TONICAS: Readonly<Record<string, string>> = { je: 'jij', we: 'wij', ze: 'zij', me: 'mij', jij: 'je', wij: 'we', zij: 'ze', mij: 'me', jou: 'je' };

function iguales(a: string | undefined, b: string | undefined): boolean {
  return a !== undefined && b !== undefined && (a === b || TONICAS[a] === b || TONICAS[b] === a);
}

/** Dónde empieza una secuencia de palabras en otra, desde una posición. -1 si no está. */
export function buscar(en: readonly string[], secuencia: readonly string[], desde = 0): number {
  if (secuencia.length === 0) return -1;
  for (let i = Math.max(0, desde); i + secuencia.length <= en.length; i++) {
    if (secuencia.every((p, j) => iguales(en[i + j], p))) return i;
  }
  return -1;
}

const DETERMINANTES = new Set(['de', 'het', 'een', 'mijn', 'je', 'jouw', 'zijn', 'haar', 'ons', 'onze', 'hun', 'die', 'dat', 'deze', 'dit']);

const cita = (p: readonly string[] | string): string => `«${typeof p === 'string' ? p : p.join(' ')}»`;

/** La frase buena, para enseñarla dentro de la explicación. */
function buena(validas: readonly string[]): string {
  return cita(comoFrase(validas[0] ?? '', '').replace(/\.$/, ''));
}

/** Las palabras que vienen detrás de una secuencia en alguna respuesta que vale. */
function algunaSigueTras(validas: readonly (readonly string[])[], secuencia: readonly string[]): boolean {
  return validas.some((v) => {
    const i = buscar(v, secuencia);
    return i >= 0 && i + secuencia.length < v.length;
  });
}

/** Si alguna respuesta que vale lleva esa palabra. */
function enAlgunaValida(validas: readonly (readonly string[])[], palabra: string): boolean {
  return validas.some((v) => v.includes(palabra));
}

export function diagnosticarFrase(p: Papeles, respuesta: string, validasTexto: readonly string[]): Diagnostico[] {
  const u = palabras(respuesta);
  const validas = validasTexto.map(palabras);
  if (u.length === 0 || validas.length === 0) return [];
  const resultado: Diagnostico[] = [];
  const anadir = (d: Diagnostico | null): void => {
    if (d && !resultado.some((r) => r.destreza === d.destreza)) resultado.push(d);
  };
  const frase = buena(validasTexto);
  // Si la frase buena es una pregunta, ya trae su signo dentro de las comillas.
  const fin = frase.endsWith('?»') ? '' : '.';
  const sub = p.subordinada;

  // Dónde ha puesto el verbo conjugado de la principal, aunque lo haya conjugado mal.
  let iVerbo = -1;
  if (p.verbo !== '') {
    // En una subordinada delante, el verbo de la principal se busca detrás de la subordinada.
    const desde = sub?.delante ? Math.max(0, u.indexOf(sub.verbo) + 1) : 0;
    iVerbo = u.indexOf(p.verbo, desde);
    if (iVerbo < 0) {
      const esAux = FORMAS_HEBBEN.has(p.verbo) || FORMAS_ZIJN.has(p.verbo);
      // Detrás de un artículo o un posesivo no es un verbo sino un sustantivo («met de fiets»).
      iVerbo = u.findIndex(
        (w, i) => i >= desde && !DETERMINANTES.has(u[i - 1] ?? '') && (mismoVerbo(w, p.verbo) || (esAux && (FORMAS_HEBBEN.has(w) || FORMAS_ZIJN.has(w)))),
      );
      const dada = u[iVerbo];
      if (dada !== undefined && !enAlgunaValida(validas, dada)) {
        const contrario = (FORMAS_HEBBEN.has(p.verbo) && FORMAS_ZIJN.has(dada)) || (FORMAS_ZIJN.has(p.verbo) && FORMAS_HEBBEN.has(dada));
        if (contrario && p.tipoFinal === 'participio') {
          anadir(explicarAuxiliar(dada, p.verbo, p.finales.at(-1) ?? '', frase));
        } else if (!contrario) {
          const invertido = buscar(u, p.sujeto) > iVerbo;
          anadir(explicarConjugacion(p.verbo, dada, p.sujeto, invertido));
        }
      }
    }
  }

  // El participio, si lo hay.
  if (p.tipoFinal === 'participio') {
    const participio = p.finales.at(-1) ?? '';
    if (!u.includes(participio)) {
      const dado = u.find((w, i) => i > iVerbo && w !== participio && (mismoVerbo(w, participio) || formasDe(w).some((f) => formasDe(participio).some((g) => g.inf === f.inf)) || (w.startsWith('ge') && i >= u.length - 2)));
      if (dado && !enAlgunaValida(validas, dado)) anadir(explicarParticipio(participio, dado));
    }
  }

  // El orden de la principal.
  const iSujeto = p.sujeto.length > 0 ? buscar(u, p.sujeto) : -1;
  if (iVerbo >= 0 && iSujeto >= 0 && !sub?.delante) {
    const verbo = u[iVerbo] ?? p.verbo;
    if (p.pregunta) {
      if (iSujeto < iVerbo) {
        anadir({
          destreza: 'preguntas',
          titulo: p.interrogativa.length > 0 ? `En la pregunta, el verbo va justo detrás de ${cita(p.interrogativa)}` : 'En la pregunta, el verbo va primero',
          texto:
            p.interrogativa.length > 0
              ? `Después de ${cita(p.interrogativa)} va el verbo (${cita(verbo)}) y luego el sujeto (${cita(p.sujeto)}): ${frase} Con el sujeto antes del verbo sería una subordinada («…waar je zus woont»), no una pregunta.`
              : `En una pregunta de sí o no, el verbo (${cita(verbo)}) va delante del sujeto (${cita(p.sujeto)}): ${frase} En inglés se usa do o se cambia el orden con el auxiliar; en neerlandés siempre se pone delante el verbo, sea el que sea.`,
          pista:
            p.interrogativa.length > 0
              ? `En inglés el sujeto va detrás de do o does (“Where does your sister live?”); en neerlandés no hay do, y es el verbo el que va delante del sujeto. ¿Dónde va ${cita(verbo)}?`
              : `En inglés, la pregunta de sí o no empieza por do o por el auxiliar (“Do you work tomorrow?”); en neerlandés, por el verbo, sea el que sea. ¿Dónde va ${cita(verbo)}?`,
        });
      }
    } else if (p.delante.length > 0 && buscar(u, p.delante) === 0 && iSujeto < iVerbo) {
      anadir({
        destreza: 'inversion',
        titulo: `Tras ${cita(p.delante)}, el verbo va antes que el sujeto`,
        texto: `Empezaste por ${cita(p.delante)}, así que eso ocupa la primera posición: el verbo (${cita(verbo)}) va segundo y el sujeto (${cita(p.sujeto)}) justo detrás: ${frase}${fin} En inglés el sujeto va antes del verbo (“Tomorrow I go”); por eso sale así.`,
        pista: `Has empezado por ${cita(p.delante)}, y eso ya ocupa la primera posición. En inglés iría ahora el sujeto (“Tomorrow I go”); en neerlandés, el verbo conjugado. ¿Dónde va ${cita(verbo)}?`,
      });
    } else if (iSujeto > 0 && iSujeto < iVerbo && !iguales(u[0], p.sujeto[0]) && !u.slice(0, iSujeto).some((w) => p.finales.includes(w) || TONICAS[w] !== undefined)) {
      const primero = u.slice(0, iSujeto);
      anadir({
        destreza: 'inversion',
        titulo: `Tras ${cita(primero)}, el verbo va antes que el sujeto`,
        texto: `Si la frase empieza por ${cita(primero)}, eso ocupa la primera posición y el verbo (${cita(verbo)}) tiene que ir segundo, antes del sujeto (${cita(p.sujeto)}): ${cita([...primero, verbo, ...p.sujeto])}… O empieza por el sujeto: ${frase}${fin}`,
        pista: `Si empiezas por ${cita(primero)}, eso ocupa la primera posición y el verbo conjugado tiene que ir segundo, antes que el sujeto. ¿Dónde va ${cita(verbo)}? También puedes empezar por el sujeto.`,
      });
    } else if (iSujeto === 0 && iVerbo > p.sujeto.length) {
      anadir({
        destreza: 'inversion',
        titulo: 'El verbo conjugado va en segunda posición',
        texto: `Empezando por el sujeto (${cita(p.sujeto)}), el verbo (${cita(verbo)}) va justo detrás, y lo demás (cuándo, dónde) después: ${frase}${fin} En inglés el adverbio puede ir entre los dos (“I often go”); en neerlandés no.`,
        pista: `Entre el sujeto y el verbo conjugado no se mete nada: en inglés sí (“I often go”), pero en neerlandés el cuándo y el cómo van detrás del verbo. ¿Dónde va ${cita(verbo)}?`,
      });
    }
  }

  // La partícula pegada al verbo («ik opbel je»): entonces el verbo es esa palabra.
  if (p.tipoFinal === 'particula' && iVerbo < 0) {
    const particula = p.finales[0] ?? '';
    const i = u.findIndex((w) => w.length > particula.length && w.startsWith(particula) && mismoVerbo(w.slice(particula.length), p.verbo));
    const pegada = u[i];
    if (pegada) {
      anadir({
        destreza: 'separables',
        titulo: `${cita(pegada)} se separa en la frase principal`,
        texto: `Con el verbo conjugado en la principal, la partícula ${cita(particula)} se separa y se va al final: ${frase}${fin} Solo va pegada con un modal («ik wil je opbellen»), en una subordinada («omdat ik je opbel») y en el participio («opgebeld»).`,
        pista: `${cita(pegada)} es un verbo separable, y conjugado en la frase principal se parte en dos. ¿Qué parte va en segunda posición y cuál se va al final?`,
      });
    }
  }

  // Lo que se va al final: infinitivo, participio o partícula.
  if (p.tipoFinal && p.finales.length > 0 && iVerbo >= 0) {
    const iFinal = buscar(u, p.finales, iVerbo + 1);
    const verbo = u[iVerbo] ?? p.verbo;
    if (iFinal >= 0 && iFinal + p.finales.length < u.length && !algunaSigueTras(validas, p.finales)) {
      if (p.tipoFinal === 'participio') {
        anadir({
          destreza: 'perfectum-orden',
          titulo: `El participio ${cita(p.finales)} va al final`,
          texto: `En el perfectum, ${cita(verbo)} se queda en segunda posición y el participio cierra la frase: ${frase}${fin} En inglés el participio va pegado al auxiliar (“I have worked all day”); en neerlandés todo lo demás va en medio.`,
          pista: `En el perfectum, ${cita(verbo)} va en segunda posición y el participio cierra la frase, con todo lo demás en medio. En inglés van juntos (“I have worked all day”). ¿Qué tienes que mover?`,
        });
      } else if (p.tipoFinal === 'infinitivo') {
        anadir({
          destreza: 'modal',
          titulo: `El infinitivo ${cita(p.finales)} va al final`,
          texto: `Con ${cita(verbo)}, el infinitivo se va al final de la frase y todo lo demás queda en medio: ${frase}${fin} En inglés va pegado al modal (“I want to buy a bike tomorrow”).`,
          pista: `Con ${cita(verbo)}, el infinitivo se va al final y todo lo demás queda en medio. En inglés va pegado al modal (“I want to buy a bike tomorrow”). ¿Qué tienes que mover?`,
        });
      } else {
        anadir({
          destreza: 'separables',
          titulo: `La partícula ${cita(p.finales)} va al final`,
          texto: `En la frase principal, la partícula se separa del verbo y se va al final: ${frase}${fin}`,
          pista: 'En la frase principal, la partícula de un verbo separable cierra la frase. ¿Qué tienes que mover?',
        });
      }
    }
    if (p.tipoFinal === 'particula') {
      const particula = p.finales[0] ?? '';
      if (!u.includes(particula)) {
        anadir({
          destreza: 'separables',
          titulo: `Falta la partícula ${cita(particula)}`,
          texto: `El verbo es separable: la partícula ${cita(particula)} no desaparece, se va al final de la frase: ${frase}${fin}`,
          pista: 'El verbo es separable y le falta su partícula: no desaparece al conjugarlo, se va al final de la frase. ¿Cuál es?',
        });
      }
    }
  }

  // La subordinada: su verbo conjugado va al final; si va delante, la principal empieza por el verbo.
  if (sub) {
    const iConj = u.indexOf(sub.conjuncion);
    const iVerboSub = iConj < 0 ? -1 : u.findIndex((w, i) => i > iConj && (w === sub.verbo || mismoVerbo(w, sub.verbo)));
    if (iConj >= 0 && iVerboSub > iConj) {
      const iSujetoPrincipal = sub.delante ? buscar(u, p.sujeto, iVerboSub + 1) : -1;
      const finSub = sub.delante ? Math.min(...[iVerbo, iSujetoPrincipal, u.length].filter((i) => i > iVerboSub)) : u.length;
      // Lo de la subordinada que aún no ha salido antes de su verbo y sale detrás: eso está fuera de sitio.
      const pendientes = [...sub.resto];
      for (const w of u.slice(iConj + 1, iVerboSub)) {
        const i = pendientes.findIndex((r) => iguales(r, w));
        if (i >= 0) pendientes.splice(i, 1);
      }
      const restoDetras = u.slice(iVerboSub + 1, finSub).filter((w) => pendientes.some((r) => iguales(r, w)) && !sub.verbos.some((v) => iguales(v, w)));
      if (restoDetras.length > 0) {
        const verbos = sub.verbos.length > 1 ? `los verbos (${cita(sub.verbos)}) van juntos al final` : `el verbo conjugado (${cita(sub.verbo)}) se va al final`;
        anadir({
          destreza: 'subordinada',
          titulo: `Después de ${cita(sub.conjuncion)}, el verbo va al final`,
          texto: `${cita(sub.conjuncion)} abre una subordinada, y en la subordinada ${verbos}: ${cita([sub.conjuncion, ...sub.resto, ...sub.verbos])}. Lo dejaste en medio, como en inglés (“because I am not well”, “that it is going to rain”).`,
          pista: `${cita(sub.conjuncion)} abre una subordinada, y en una subordinada ${sub.verbos.length > 1 ? 'los verbos se van juntos al final' : 'el verbo conjugado se va al final'}. En inglés se queda en medio (“because I am not well”). ¿Qué tienes que mover?`,
        });
      }
      if (sub.delante && iVerbo > iVerboSub) {
        if (iSujetoPrincipal > iVerboSub && iSujetoPrincipal < iVerbo) {
          const verbo = u[iVerbo] ?? p.verbo;
          anadir({
            destreza: 'subordinada-delante',
            titulo: 'Tras la subordinada, primero el verbo y luego el sujeto',
            texto: `La subordinada entera (${cita([sub.conjuncion, ...sub.resto, ...sub.verbos])}) cuenta como primera posición, así que detrás va el verbo (${cita(verbo)}) y luego el sujeto (${cita(p.sujeto)}): ${frase}${fin} Es la misma regla que con «Morgen ga ik».`,
            // Sin citar la subordinada buena: si también está mal ordenada, la daría hecha.
            pista: `Si la frase empieza por una subordinada (${cita(sub.conjuncion)}…), toda ella ocupa la primera posición, como «morgen» en «Morgen ga ik». ¿Qué va justo detrás de la coma?`,
          });
        }
      }
    }
  }

  // Niet y geen.
  const modelo = validas[0] ?? [];
  if (modelo.includes('geen') && !u.includes('geen') && u.includes('niet')) {
    const i = modelo.indexOf('geen');
    anadir({
      destreza: 'niet',
      titulo: `Aquí va geen, no niet`,
      texto: `Con un sustantivo sin artículo o con een (${cita(modelo.slice(i + 1, i + 2))}), la negación es geen: ${frase}${fin} Niet niega el verbo, un adjetivo o algo definido (de, het, mijn…).`,
      pista: 'En inglés dirías “I have no time”, no “I have not time”. En neerlandés pasa algo parecido: con un sustantivo sin artículo o con een, la negación no es niet. ¿Cuál es?',
    });
  } else if (modelo.includes('niet') && u.includes('niet')) {
    // Los vecinos de niet sin contar los verbos: si el verbo está mal puesto, eso ya se dice aparte.
    const verbos = new Set([p.verbo, u[iVerbo] ?? '', sub?.verbo ?? '', ...(sub?.verbos ?? [])].filter((x) => x !== ''));
    const sinVerbos = (w: readonly string[]): string[] => w.filter((x) => !verbos.has(x));
    const vecinos = (w: readonly string[]): string => {
      const i = w.indexOf('niet');
      return `${w[i - 1] ?? ''}|${w[i + 1] ?? ''}`;
    };
    const deLaRespuesta = vecinos(sinVerbos(u));
    const mismoSitio = validas.some((v) => v.includes('niet') && vecinos(sinVerbos(v)) === deLaRespuesta);
    if (!mismoSitio) {
      const i = modelo.indexOf('niet');
      const antes = modelo[i - 1];
      const despues = modelo[i + 1];
      const donde = [antes ? `detrás de ${cita(antes)}` : '', despues ? `delante de ${cita(despues)}` : 'al final'].filter((x) => x !== '').join(' y ');
      anadir({
        destreza: 'niet',
        titulo: `Niet va ${donde}`,
        texto: `Niet va detrás del verbo, del cuándo (morgen, vandaag…) y del objeto definido (het, de film, hem), pero delante del participio, del infinitivo, de la partícula, del adjetivo y del lugar: ${frase}${fin} En inglés va pegado al auxiliar (“I have not seen it”); en neerlandés se mueve.`,
        pista: 'Niet no va pegado al verbo como “not” en inglés. Va detrás del verbo, del cuándo y de lo definido (het, hem, de film), y delante del participio, del infinitivo, de la partícula, del adjetivo o del lugar. ¿Dónde va en esta frase?',
      });
    }
  }

  return resultado;
}
