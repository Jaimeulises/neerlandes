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

import { comoFrase, palabras } from '../../motor';
import type { DiagnosticoNl } from './casos';
import { FORMAS_HEBBEN, FORMAS_ZIJN, formasDe, mismoVerbo, presenteDelVerbo } from './formas';
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

/** Una frase buena, para enseñarla dentro de la explicación. */
function buena(valida: string): string {
  return cita(comoFrase(valida, '').replace(/\.$/, ''));
}

/** La primera respuesta buena que empieza por esas palabras, o null si ninguna. */
function buenaQueEmpiezaPor(validas: readonly string[], inicio: readonly string[]): string | null {
  const v = inicio.length > 0 ? validas.find((t) => buscar(palabras(t), inicio) === 0) : undefined;
  return v === undefined ? null : buena(v);
}

/** Las formas del presente con jij delante del verbo («jij werkt», «jij gaat»): con la regla si el verbo no está en los datos. */
function formasConJijDelante(verbo: string): readonly string[] {
  return presenteDelVerbo(verbo)?.formas[1] ?? [verbo.endsWith('t') ? verbo : `${verbo}t`];
}

/** Lo que dice el inglés en cada subordinada, para enseñar que allí el verbo se queda en medio. */
const SUBORDINADA_EN_INGLES: Readonly<Record<string, string>> = {
  omdat: '“because I am not well”',
  dat: '“that it is going to rain”',
  of: '“if she is coming tonight”',
  als: '“if I have time”',
  waar: '“where the keys are”',
  toen: '“when I lived in Spain”',
  nadat: '“after we have eaten”',
  zodra: '“as soon as I am home”',
};

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

export function diagnosticarFrase(p: Papeles, respuesta: string, validasTexto: readonly string[]): DiagnosticoNl[] {
  const u = palabras(respuesta);
  const validas = validasTexto.map(palabras);
  if (u.length === 0 || validas.length === 0) return [];
  const resultado: DiagnosticoNl[] = [];
  const anadir = (d: DiagnosticoNl | null): void => {
    if (d && !resultado.some((r) => r.destreza === d.destreza)) resultado.push(d);
  };
  // La frase buena que se enseña es la que empieza como la respuesta, si la hay: así no se contradice con lo que
  // dice la explicación («empezando por el sujeto…») ni cambia más de lo que hace falta.
  const cercana = validasTexto.find((t) => iguales(palabras(t)[0], u[0])) ?? validasTexto[0] ?? '';
  const frase = buena(cercana);
  // Si la frase buena es una pregunta, ya trae su signo dentro de las comillas.
  const fin = frase.endsWith('?»') ? '' : '.';
  const sub = p.subordinada;
  // El sujeto jij o je de la principal: con él delante del verbo, la forma con -t es la buena para ese orden.
  const sujetoJij = p.sujeto.length === 1 && iguales(p.sujeto[0], 'jij');
  let formaPorOrden = false;

  // Dónde ha puesto el verbo conjugado de la principal, aunque lo haya conjugado mal.
  let iVerbo = -1;
  if (p.verbo !== '') {
    // En una subordinada delante, el verbo de la principal se busca detrás de la subordinada.
    const desde = sub?.delante ? Math.max(0, u.indexOf(sub.verbo) + 1) : 0;
    iVerbo = u.indexOf(p.verbo, desde);
    if (iVerbo < 0) {
      const esAux = FORMAS_HEBBEN.has(p.verbo) || FORMAS_ZIJN.has(p.verbo);
      // Detrás de un artículo o un posesivo no es un verbo sino un sustantivo («met de fiets»), salvo detrás del
      // je que es el sujeto («wat je gaat doen»).
      const trasDeterminante = (i: number): boolean => {
        const antes = u[i - 1] ?? '';
        return DETERMINANTES.has(antes) && !(sujetoJij && iguales(antes, 'je'));
      };
      iVerbo = u.findIndex((w, i) => i >= desde && !trasDeterminante(i) && (mismoVerbo(w, p.verbo) || (esAux && (FORMAS_HEBBEN.has(w) || FORMAS_ZIJN.has(w)))));
      const dada = u[iVerbo];
      if (dada !== undefined && !enAlgunaValida(validas, dada)) {
        const contrario = (FORMAS_HEBBEN.has(p.verbo) && FORMAS_ZIJN.has(dada)) || (FORMAS_ZIJN.has(p.verbo) && FORMAS_HEBBEN.has(dada));
        if (contrario && p.tipoFinal === 'participio') {
          anadir(explicarAuxiliar(dada, p.verbo, p.finales.at(-1) ?? '', frase));
        } else if (!contrario) {
          const iSuj = buscar(u, p.sujeto);
          // «Jij werkt morgen?»: con jij delante, «werkt» es lo que toca. Falla el orden, y eso se explica abajo.
          formaPorOrden = sujetoJij && iSuj >= 0 && iSuj < iVerbo && formasConJijDelante(p.verbo).includes(dada);
          if (!formaPorOrden) anadir(explicarConjugacion(p.verbo, dada, p.sujeto, iSuj > iVerbo));
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
    // En la pista, el verbo como lo ha escrito; en la explicación, el bueno. Solo cambian si la -t estaba bien
    // para su orden y deja de estarlo al mover el verbo: eso se dice aparte.
    const verbo = u[iVerbo] ?? p.verbo;
    const verboBueno = formaPorOrden ? p.verbo : verbo;
    const notaJij = formaPorOrden ? ` Con ${cita(p.sujeto)} detrás, ${cita(verbo)} pierde la -t: ${cita([p.verbo, ...p.sujeto])}.` : '';
    const pistaJij = formaPorOrden ? ` Y con ${cita(p.sujeto)} detrás, mira bien la forma del verbo.` : '';
    if (p.pregunta) {
      if (iSujeto < iVerbo) {
        const conInterrogativa = p.interrogativa.length > 0;
        anadir({
          caso: conInterrogativa ? 'pregunta-interrogativa' : 'pregunta-si-no',
          destreza: 'preguntas',
          titulo: conInterrogativa ? `En la pregunta, el verbo va justo detrás de ${cita(p.interrogativa)}` : 'En la pregunta, el verbo va primero',
          texto: conInterrogativa
            ? `Después de ${cita(p.interrogativa)} va el verbo (${cita(verboBueno)}) y luego el sujeto (${cita(p.sujeto)}): ${frase} Con el sujeto delante, suena a subordinada (como en «Ik weet niet waar je zus woont»), no a pregunta.${notaJij}`
            : `En una pregunta de sí o no, el verbo (${cita(verboBueno)}) va delante del sujeto (${cita(p.sujeto)}): ${frase} En inglés se usa do o se cambia el orden con el auxiliar; en neerlandés siempre se pone delante el verbo, sea el que sea.${notaJij}`,
          pista: conInterrogativa
            ? `En inglés el sujeto va detrás de do o does (“Where does your sister live?”); en neerlandés no hay do, y es el verbo el que va delante del sujeto. ¿Dónde va ${cita(verbo)}?${pistaJij}`
            : `En inglés, la pregunta de sí o no empieza por do o por el auxiliar (“Do you work tomorrow?”); en neerlandés, por el verbo, sea el que sea. ¿Dónde va ${cita(verbo)}?${pistaJij}`,
        });
      }
    } else if (p.delante.length > 0 && buscar(u, p.delante) === 0 && iSujeto < iVerbo) {
      anadir({
        caso: 'inversion-delante',
        destreza: 'inversion',
        titulo: `Tras ${cita(p.delante)}, el verbo va antes que el sujeto`,
        texto: `Empezaste por ${cita(p.delante)}, así que eso ocupa la primera posición: el verbo (${cita(verboBueno)}) va segundo y el sujeto (${cita(p.sujeto)}) justo detrás: ${frase}${fin} En inglés el sujeto iría delante del verbo (como en “Tomorrow I go”); por eso sale así.${notaJij}`,
        pista: `Has empezado por ${cita(p.delante)}, y eso ya ocupa la primera posición. En inglés iría ahora el sujeto (como en “Tomorrow I go”); en neerlandés, el verbo conjugado. ¿Dónde va ${cita(verbo)}?${pistaJij}`,
      });
    } else if (iSujeto > 0 && iSujeto < iVerbo && !iguales(u[0], p.sujeto[0]) && !u.slice(0, iSujeto).some((w) => p.finales.includes(w) || TONICAS[w] !== undefined)) {
      const primero = u.slice(0, iSujeto);
      // Con lo que ha puesto delante, la frase entera si alguna buena empieza así; si no, el principio.
      const conPrimero = buenaQueEmpiezaPor(validasTexto, primero);
      const conSujeto = buenaQueEmpiezaPor(validasTexto, p.sujeto);
      anadir({
        caso: 'inversion-otro-delante',
        destreza: 'inversion',
        titulo: `Tras ${cita(primero)}, el verbo va antes que el sujeto`,
        texto: `Si la frase empieza por ${cita(primero)}, eso ocupa la primera posición y el verbo (${cita(verboBueno)}) tiene que ir segundo, antes del sujeto (${cita(p.sujeto)}): ${conPrimero ? `${conPrimero}${fin}` : `${cita([...primero, verboBueno, ...p.sujeto])}…`}${conSujeto ? ` O empieza por el sujeto: ${conSujeto}${fin}` : ''}${notaJij}`,
        pista: `Si empiezas por ${cita(primero)}, eso ocupa la primera posición y el verbo conjugado tiene que ir segundo, antes que el sujeto. ¿Dónde va ${cita(verbo)}?${conSujeto ? ' También puedes empezar por el sujeto.' : ''}${pistaJij}`,
      });
    } else if (iSujeto === 0 && iVerbo > p.sujeto.length) {
      const entre = u.slice(p.sujeto.length, iVerbo);
      // Solo se dice «empezando por el sujeto» si alguna frase buena empieza por él.
      const conSujeto = buenaQueEmpiezaPor(validasTexto, p.sujeto);
      const principio = conSujeto ? `Empezando por el sujeto (${cita(p.sujeto)}), el verbo (${cita(verboBueno)}) va justo detrás` : `El verbo (${cita(verboBueno)}) va en segunda posición`;
      if (entre.includes('niet')) {
        // «Dat niet is waar»: es el orden del español («eso no es verdad»), no el del inglés.
        anadir({
          caso: 'inversion-niet',
          destreza: 'inversion',
          titulo: 'El verbo conjugado va en segunda posición',
          texto: `${principio}, y niet después: ${conSujeto ?? frase}${fin} En español el «no» va delante del verbo; en neerlandés, niet nunca va entre el sujeto y el verbo conjugado.`,
          pista: `En español el «no» va delante del verbo, pero en neerlandés niet va detrás del verbo conjugado. ¿Dónde va ${cita(verbo)}?`,
        });
      } else {
        anadir({
          caso: 'inversion-segunda',
          destreza: 'inversion',
          titulo: 'El verbo conjugado va en segunda posición',
          texto: `${principio}, y lo demás (cuándo, dónde) después: ${conSujeto ?? frase}${fin} En inglés el adverbio puede ir entre los dos (“I often go”); en neerlandés no.`,
          pista: `Entre el sujeto y el verbo conjugado no se mete nada: en inglés sí (“I often go”), pero en neerlandés el cuándo y el cómo van detrás del verbo. ¿Dónde va ${cita(verbo)}?`,
        });
      }
    }
  }

  // La partícula pegada al verbo («ik opbel je»): entonces el verbo es esa palabra.
  if (p.tipoFinal === 'particula' && iVerbo < 0) {
    const particula = p.finales[0] ?? '';
    const i = u.findIndex((w) => w.length > particula.length && w.startsWith(particula) && mismoVerbo(w.slice(particula.length), p.verbo));
    const pegada = u[i];
    if (pegada) {
      anadir({
        caso: 'separable-pegado',
        destreza: 'separables',
        titulo: `${cita(pegada)} se separa en la frase principal`,
        texto: `Con el verbo conjugado en la principal, la partícula ${cita(particula)} se separa y se va al final: ${frase}${fin} Solo va pegada con un modal, en una subordinada y en el participio (con opbellen: «ik wil je opbellen», «omdat ik je opbel», «opgebeld»).`,
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
          caso: 'participio-al-final',
          destreza: 'perfectum-orden',
          titulo: `El participio ${cita(p.finales)} va al final`,
          texto: `En el perfectum, ${cita(verbo)} se queda en segunda posición y el participio cierra la frase: ${frase}${fin} En inglés el participio va pegado al auxiliar (“I have worked all day”); en neerlandés todo lo demás va en medio.`,
          pista: `En el perfectum, ${cita(verbo)} va en segunda posición y el participio cierra la frase, con todo lo demás en medio. En inglés van juntos (“I have worked all day”). ¿Qué tienes que mover?`,
        });
      } else if (p.tipoFinal === 'infinitivo') {
        anadir({
          caso: 'infinitivo-al-final',
          destreza: 'modal',
          titulo: `El infinitivo ${cita(p.finales)} va al final`,
          texto: `Con ${cita(verbo)}, el infinitivo se va al final de la frase y todo lo demás queda en medio: ${frase}${fin} En inglés va pegado al modal (“I want to buy a bike tomorrow”).`,
          pista: `Con ${cita(verbo)}, el infinitivo se va al final y todo lo demás queda en medio. En inglés va pegado al modal (“I want to buy a bike tomorrow”). ¿Qué tienes que mover?`,
        });
      } else {
        anadir({
          caso: 'particula-al-final',
          destreza: 'separables',
          titulo: `La partícula ${cita(p.finales)} va al final`,
          texto: `En la frase principal, la partícula se separa del verbo y se va al final: ${frase}${fin}`,
          pista: 'En la frase principal, la partícula de un verbo separable cierra la frase. ¿Qué tienes que mover?',
        });
      }
    }
    if (p.tipoFinal === 'particula') {
      const particula = p.finales[0] ?? '';
      // Si alguna respuesta buena va sin ella (bellen por opbellen), no falta.
      if (!u.includes(particula) && validas.every((v) => v.includes(particula))) {
        anadir({
          caso: 'falta-particula',
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
      // Su verbo, bien conjugado para su sujeto («omdat ik niet lekker is»).
      const dadaSub = u[iVerboSub];
      if (dadaSub !== undefined && dadaSub !== sub.verbo && sub.sujeto.length > 0 && !enAlgunaValida(validas, dadaSub)) {
        anadir(explicarConjugacion(sub.verbo, dadaSub, sub.sujeto, false));
      }
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
        const ingles = SUBORDINADA_EN_INGLES[sub.conjuncion];
        anadir({
          caso: sub.verbos.length > 1 ? 'subordinada-varios-verbos' : 'subordinada-un-verbo',
          destreza: 'subordinada',
          titulo: `Después de ${cita(sub.conjuncion)}, el verbo va al final`,
          texto: `${cita(sub.conjuncion)} abre una subordinada, y en la subordinada ${verbos}: ${cita([sub.conjuncion, ...sub.resto, ...sub.verbos])}. Lo dejaste en medio, como en inglés${ingles ? ` (${ingles})` : ''}.`,
          pista: `${cita(sub.conjuncion)} abre una subordinada, y en una subordinada ${sub.verbos.length > 1 ? 'los verbos se van juntos al final' : 'el verbo conjugado se va al final'}. En inglés se queda en medio${ingles ? ` (${ingles})` : ''}. ¿Qué tienes que mover?`,
        });
      }
      if (sub.delante && iVerbo > iVerboSub) {
        if (iSujetoPrincipal > iVerboSub && iSujetoPrincipal < iVerbo) {
          const verbo = u[iVerbo] ?? p.verbo;
          anadir({
            caso: 'subordinada-delante',
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

  // Niet y geen, mirando la frase buena que se enseña.
  const modelo = palabras(cercana);
  if (modelo.includes('geen') && !u.includes('geen') && u.includes('niet')) {
    const i = modelo.indexOf('geen');
    anadir({
      caso: 'geen',
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
        caso: 'niet-sitio',
        destreza: 'niet',
        titulo: `Niet va ${donde}`,
        texto: `Niet va detrás del verbo, del cuándo (morgen, vandaag…) y del objeto definido (het, de film, hem), pero delante del participio, del infinitivo, de la partícula, del adjetivo y del lugar: ${frase}${fin} En inglés va pegado al auxiliar (“I have not seen it”); en neerlandés se mueve.`,
        pista: 'Niet no va pegado al verbo como “not” en inglés. Va detrás del verbo, del cuándo y de lo definido (het, hem, de film), y delante del participio, del infinitivo, de la partícula, del adjetivo o del lugar. ¿Dónde va en esta frase?',
      });
    }
  }

  return resultado;
}
