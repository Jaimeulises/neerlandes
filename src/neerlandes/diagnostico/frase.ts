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
import { FORMAS_HEBBEN, FORMAS_ZIJN, formasDe, mismoVerbo, pareceConjugada, presenteDelVerbo } from './formas';
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
  // Dónde va el primer verbo conjugado que no es el de la frase, si lo hay: entonces la ha dicho de otra manera.
  let iOtroVerbo = -1;
  // Si es un perfectum dicho en otro tiempo: sin intentar el participio y con su verbo conjugado, en el sitio del
  // auxiliar si lo hay («Ik begrijp het niet», «Ik had vorige week griep» por «Ik heb vorige week griep gehad»).
  // Entonces un pasado no es un auxiliar mal conjugado, y «niet» no se puede comparar con el de la frase buena.
  let enOtroTiempo = false;
  if (p.verbo !== '') {
    // En una subordinada delante, el verbo de la principal se busca detrás de la subordinada.
    const desde = sub?.delante ? Math.max(0, u.indexOf(sub.verbo) + 1) : 0;
    const esAux = FORMAS_HEBBEN.has(p.verbo) || FORMAS_ZIJN.has(p.verbo);
    // Detrás de un artículo o un posesivo no es un verbo sino un sustantivo («met de fiets»), salvo detrás del
    // je que es el sujeto («wat je gaat doen»).
    const trasDeterminante = (i: number): boolean => {
      const antes = u[i - 1] ?? '';
      return DETERMINANTES.has(antes) && !(sujetoJij && iguales(antes, 'je'));
    };
    const delVerbo = (w: string): boolean => mismoVerbo(w, p.verbo) || (esAux && (FORMAS_HEBBEN.has(w) || FORMAS_ZIJN.has(w)));
    const conjugado = (w: string): boolean => FORMAS_HEBBEN.has(w) || FORMAS_ZIJN.has(w) || formasDe(w).some((f) => f.tipo === 'presente' || f.tipo === 'pasado');
    // Un sustantivo que se escribe como un verbo: detrás de un artículo o un posesivo, también con un adjetivo en medio
    // («een nieuwe fiets»).
    const sustantivo = (i: number): boolean => trasDeterminante(i) || (trasDeterminante(i - 1) && /e$/.test(u[i - 1] ?? '') && formasDe(u[i - 1] ?? '').length === 0);
    // Lo de la subordinada no cuenta, ni su verbo ni lo demás («als ik slaap heb»: «slaap» también es una forma de
    // «slapen»): si su verbo está mal conjugado o en medio, no se sabe dónde acaba y se mira desde el principio.
    const deLaSubordinada = (w: string): boolean => sub !== null && ([sub.verbo, ...sub.verbos].some((v) => mismoVerbo(w, v)) || sub.resto.some((r) => iguales(r, w)));
    const exacto = u.indexOf(p.verbo, desde);
    // Tampoco es otro verbo conjugado el infinitivo del final dicho antes del verbo, aunque se escriba como el plural
    // («We morgen naar de markt gaan zullen?»), ni, con el verbo de la frase tal cual y sin ser él un infinitivo, una
    // forma que es la del infinitivo («Ze naar huis gaan wilde»): lo que falla es el orden.
    const esInfinitivo = (w: string): boolean => formasDe(w).some((f) => f.tipo === 'infinitivo');
    const infinitivoDelante = (w: string): boolean => p.finales.some((f) => iguales(f, w)) || (exacto >= 0 && !esInfinitivo(p.verbo) && esInfinitivo(w));
    iOtroVerbo = u.findIndex((w, i) => i >= desde && !sustantivo(i) && conjugado(w) && !delVerbo(w) && !deLaSubordinada(w) && !infinitivoDelante(w));
    iVerbo = exacto >= 0 ? exacto : u.findIndex((w, i) => i >= desde && !trasDeterminante(i) && delVerbo(w));
    // Con otro verbo conjugado delante («Ik ga vandaag thuis werken», «Vroeger heb ik … gewerkt»), lo que lleva del
    // verbo de la frase es un infinitivo, un participio o un nombre («met fiets»), no su verbo conjugado fuera de sitio.
    if (iOtroVerbo >= 0 && iOtroVerbo < iVerbo) iVerbo = -1;
    if (p.tipoFinal === 'participio') {
      const participio = p.finales.at(-1) ?? '';
      // Con el auxiliar, lo que va detrás y es del verbo del participio intenta serlo («ik ben … was»), y también lo
      // que empieza por ge- al final, como en la comprobación del participio («ik heb … gehat»); sin él, lo que es
      // del verbo y no se escribe como una forma conjugada.
      const intentaParticipio = (w: string, i: number): boolean =>
        w === participio || (iVerbo >= 0 ? i > iVerbo && (mismoVerbo(w, participio) || (w.startsWith('ge') && i >= u.length - 2)) : mismoVerbo(w, participio) && !pareceConjugada(w, participio));
      enOtroTiempo = !u.some(intentaParticipio) && (iVerbo < 0 ? u.some((w) => pareceConjugada(w, participio)) : pareceConjugada(u[iVerbo] ?? '', participio));
    }
    const dada = exacto < 0 ? u[iVerbo] : undefined;
    // En otro tiempo, un pasado en el sitio del auxiliar es el verbo de la frase dicha en pasado. Un presente mal
    // conjugado («Ik nog nooit in Groningen bent») sí se explica: falla la persona, se diga en el tiempo que se diga.
    const pasadoEnOtroTiempo = enOtroTiempo && dada !== undefined && formasDe(dada).some((f) => f.tipo === 'pasado') && !formasDe(dada).some((f) => f.tipo === 'presente' || f.tipo === 'infinitivo');
    if (dada !== undefined && !pasadoEnOtroTiempo && !enAlgunaValida(validas, dada)) {
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
  /** Si delante de esa posición (o en toda la principal, si es -1) va un verbo conjugado que no es el de la frase. */
  const otroVerboAntes = (i: number): boolean => iOtroVerbo >= 0 && (i < 0 || iOtroVerbo < i);

  // El participio, si lo hay. Dicha en otro tiempo («Ik werkte de hele dag», «Mijn moeder belde gisteren») o con
  // otro verbo conjugado («Ik ga de hele dag werken»), lo que lleva del verbo no intenta ser el participio. Sin
  // auxiliar, una forma que se escribe como conjugada tampoco.
  if (p.tipoFinal === 'participio' && !otroVerboAntes(iVerbo) && !enOtroTiempo) {
    const participio = p.finales.at(-1) ?? '';
    if (!u.includes(participio)) {
      const otroTiempo = (w: string): boolean => iVerbo < 0 && pareceConjugada(w, participio);
      const dado = u.find(
        (w, i) => i > iVerbo && w !== participio && !otroTiempo(w) && (mismoVerbo(w, participio) || formasDe(w).some((f) => formasDe(participio).some((g) => g.inf === f.inf)) || (w.startsWith('ge') && i >= u.length - 2)),
      );
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
    const pistaJij = formaPorOrden ? ` Y con ${cita(p.sujeto)} detrás, ojo con la forma del verbo.` : '';
    if (p.pregunta) {
      if (iSujeto < iVerbo) {
        const conInterrogativa = p.interrogativa.length > 0;
        anadir({
          caso: conInterrogativa ? 'pregunta-interrogativa' : 'pregunta-si-no',
          destreza: 'preguntas',
          titulo: conInterrogativa ? `En la pregunta, el verbo va justo detrás de ${cita(p.interrogativa)}` : 'En la pregunta, el verbo va primero',
          texto: conInterrogativa
            ? `Después de ${cita(p.interrogativa)} va el verbo (${cita(verboBueno)}) y luego el sujeto (${cita(p.sujeto)}): ${frase} Con el sujeto delante, suena a subordinada (como en «Ik weet niet waar je zus woont»), no a pregunta.${notaJij}`
            : `En una pregunta de sí o no, el verbo (${cita(verboBueno)}) va delante del sujeto (${cita(p.sujeto)}): ${frase} En inglés se usa “do” o se cambia el orden con el auxiliar; en neerlandés siempre se pone delante el verbo, sea el que sea.${notaJij}`,
          pista: conInterrogativa
            ? `En inglés, la pregunta se apoya en “do” o “does”. En neerlandés no existen: ¿qué hace entonces el verbo conjugado?${pistaJij}`
            : `Tal como está, es una afirmación. En inglés empezarías por “do” o por el auxiliar; en neerlandés, ¿qué va primero?${pistaJij}`,
        });
      }
    } else if (p.delante.length > 0 && buscar(u, p.delante) === 0 && iSujeto < iVerbo) {
      anadir({
        caso: 'inversion-delante',
        destreza: 'inversion',
        titulo: `Tras ${cita(p.delante)}, el verbo va antes que el sujeto`,
        texto: `Empezaste por ${cita(p.delante)}, así que eso ocupa la primera posición: el verbo (${cita(verboBueno)}) va segundo y el sujeto (${cita(p.sujeto)}) justo detrás: ${frase}${fin} En inglés el sujeto iría delante del verbo (como en “Tomorrow I go”); por eso sale así.${notaJij}`,
        pista: `Has empezado por ${cita(p.delante)} y has seguido con el sujeto, como en inglés. ¿Qué cambia en neerlandés cuando la frase no empieza por el sujeto?${pistaJij}`,
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
        pista: `Has empezado por ${cita(primero)}, que no es el sujeto. ¿Qué tiene que ir justo detrás de lo que ocupa la primera posición?${conSujeto ? ' También puedes empezar por el sujeto.' : ''}${pistaJij}`,
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
          texto: `${principio}, y «niet» después: ${conSujeto ?? frase}${fin} En español el “no” va delante del verbo; en neerlandés, en la frase principal, «niet» nunca va entre el sujeto y el verbo conjugado.`,
          pista: `Has puesto ${cita('niet')} delante del verbo, como el “no” del español. En neerlandés, ¿en qué posición va siempre el verbo conjugado?`,
        });
      } else {
        anadir({
          caso: 'inversion-segunda',
          destreza: 'inversion',
          titulo: 'El verbo conjugado va en segunda posición',
          texto: `${principio}, y lo demás (cuándo, dónde) después: ${conSujeto ?? frase}${fin} En inglés el adverbio puede ir entre los dos (“I often go”); en neerlandés no.`,
          pista: 'Has metido algo entre el sujeto y el verbo, como hace el inglés en “I often go”. En neerlandés, ¿en qué posición va el verbo conjugado?',
        });
      }
    }
  }

  // La partícula pegada al verbo («ik opbel je»): entonces el verbo es esa palabra. Con otro verbo conjugado
  // delante es el infinitivo, que va pegado («ik ga je opbellen»).
  if (p.tipoFinal === 'particula' && iVerbo < 0) {
    const particula = p.finales[0] ?? '';
    const i = u.findIndex((w) => w.length > particula.length && w.startsWith(particula) && mismoVerbo(w.slice(particula.length), p.verbo));
    const pegada = u[i];
    if (pegada && !otroVerboAntes(i)) {
      anadir({
        caso: 'separable-pegado',
        destreza: 'separables',
        titulo: `${cita(pegada)} se separa en la frase principal`,
        texto: `Con el verbo conjugado en la principal, la partícula ${cita(particula)} se separa y se va al final: ${frase}${fin} Solo va pegada con un modal, en una subordinada y en el participio (con «opbellen»: «ik wil je opbellen», «omdat ik je opbel», «opgebeld»).`,
        pista: `${cita(pegada)} es un verbo separable. ¿Qué le pasa a un separable cuando va conjugado en la frase principal?`,
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
          pista: 'Has dejado el participio junto al auxiliar, como en inglés. En el perfectum neerlandés, ¿dónde va el participio?',
        });
      } else if (p.tipoFinal === 'infinitivo') {
        anadir({
          caso: 'infinitivo-al-final',
          destreza: 'modal',
          titulo: `El infinitivo ${cita(p.finales)} va al final`,
          texto: `Con ${cita(verbo)}, el infinitivo se va al final de la frase y todo lo demás queda en medio: ${frase}${fin} En inglés va pegado al modal (“I want to buy a bike tomorrow”).`,
          pista: `Has dejado el infinitivo junto a ${cita(verbo)}, como en inglés. Con un verbo así, ¿dónde va el infinitivo en neerlandés?`,
        });
      } else {
        anadir({
          caso: 'particula-al-final',
          destreza: 'separables',
          titulo: `La partícula ${cita(p.finales)} va al final`,
          texto: `En la frase principal, la partícula se separa del verbo y se va al final: ${frase}${fin}`,
          pista: 'La partícula del verbo separable no está en su sitio. En la frase principal, ¿dónde va?',
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
          pista: 'El verbo es separable y le falta algo: al conjugarlo, su partícula no desaparece. ¿Cuál es y dónde va?',
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
      // Dónde acaba la subordinada: desde su conjunción, mientras sigan saliendo sus palabras, aunque sea en otro orden
      // («als heb ik tijd»). El sujeto de la principal se busca detrás: si no, el «ik» de una subordinada con el verbo
      // en medio pasaría por el de la principal.
      const porSalir = [...sub.resto, ...sub.verbos];
      let finSubordinada = iConj + 1;
      for (; finSubordinada < u.length; finSubordinada++) {
        const w = u[finSubordinada];
        const i = porSalir.findIndex((r) => iguales(r, w) || (sub.verbos.includes(r) && w !== undefined && mismoVerbo(r, w)));
        if (i < 0) break;
        porSalir.splice(i, 1);
      }
      let iSujetoPrincipal = sub.delante ? buscar(u, p.sujeto, Math.max(iVerboSub + 1, finSubordinada)) : -1;
      // Con la subordinada sin sujeto, como en español («Nadat gegeten hebben, we gaan wandelen»), el recorrido se
      // lleva el de la principal: si no queda otro detrás y va justo delante del verbo de la principal, es ese.
      if (sub.delante && iSujetoPrincipal < 0 && iVerbo > iVerboSub) {
        const antes = buscar(u, p.sujeto, iVerboSub + 1);
        if (antes >= 0 && antes + p.sujeto.length === iVerbo) iSujetoPrincipal = antes;
      }
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
          pista: `Detrás de ${cita(sub.conjuncion)} has seguido el orden del inglés${ingles ? ` (${ingles})` : ''}. En esa parte de la frase, ¿dónde ${sub.verbos.length > 1 ? 'van los verbos' : 'va el verbo conjugado'}?`,
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
            pista: `Has empezado por una subordinada (${cita(sub.conjuncion)}…) y has seguido con el sujeto. ¿Qué pasa en neerlandés cuando la frase no empieza por el sujeto?`,
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
      titulo: `Aquí va «geen», no «niet»`,
      texto: `Con un sustantivo sin artículo o con «een» (${cita(modelo.slice(i + 1, i + 2))}), la negación es «geen»: ${frase}${fin} «Niet» niega el verbo, un adjetivo o algo definido («de, het, mijn…»).`,
      // El mismo criterio sirve en las dos direcciones: la pista no dice cuál de las dos negaciones falla.
      pista: `Mira qué niegas: ¿un sustantivo sin artículo o con ${cita('een')}, o un verbo, un adjetivo o algo definido? En neerlandés no se niegan igual.`,
    });
  } else if (modelo.includes('niet') && u.includes('niet')) {
    // Los vecinos de niet sin contar los verbos: si el verbo está mal puesto, eso ya se dice aparte. Un participio o un
    // infinitivo del final mal formado cuenta como el bueno («Ik heb het niet begrijpt»): lo que falla es la forma.
    const verbos = new Set([p.verbo, u[iVerbo] ?? '', sub?.verbo ?? '', ...(sub?.verbos ?? [])].filter((x) => x !== ''));
    const finalVerbal = p.tipoFinal === 'participio' || p.tipoFinal === 'infinitivo' ? p.finales : [];
    const comoElBueno = (x: string): string => finalVerbal.find((f) => x !== f && mismoVerbo(x, f)) ?? x;
    const sinVerbos = (w: readonly string[]): string[] => w.filter((x) => !verbos.has(x)).map(comoElBueno);
    const vecinos = (w: readonly string[]): string => {
      const i = w.indexOf('niet');
      return `${w[i - 1] ?? ''}|${w[i + 1] ?? ''}`;
    };
    const deLaRespuesta = vecinos(sinVerbos(u));
    const mismoSitio = validas.some((v) => v.includes('niet') && vecinos(sinVerbos(v)) === deLaRespuesta);
    // Dicha con otro verbo conjugado («Morgen ga ik niet komen») o en otro tiempo, sus vecinos no se pueden comparar con los de la buena.
    if (!mismoSitio && !otroVerboAntes(iVerbo) && !enOtroTiempo) {
      const i = modelo.indexOf('niet');
      const antes = modelo[i - 1];
      const despues = modelo[i + 1];
      const donde = [antes ? `detrás de ${cita(antes)}` : '', despues ? `delante de ${cita(despues)}` : 'al final'].filter((x) => x !== '').join(' y ');
      anadir({
        caso: 'niet-sitio',
        destreza: 'niet',
        titulo: `«Niet» va ${donde}`,
        texto: `«Niet» va detrás del verbo, del cuándo («morgen, vandaag…») y del objeto definido («het, de film, hem»), pero delante del participio, del infinitivo, de la partícula, del adjetivo y del lugar: ${frase}${fin} En inglés va pegado al auxiliar (“I have not seen it”); en neerlandés se mueve.`,
        pista: `${cita('niet')} no va donde iría “not” en inglés. Piensa qué niega: ¿qué palabras de la frase tienen que quedar antes que ${cita('niet')}?`,
      });
    }
  }

  return resultado;
}
