// Contratos entre el motor y un paquete de idioma. El motor solo conoce estas
// formas: qué es una pista de estudio, un elemento y un ejercicio. Lo que
// significan para un idioma concreto lo decide el paquete.
// Viene de Michi. Aquí cambian los ejercicios: fuera los trazos y la
// furigana, dentro los que obligan a producir la frase (traducir, completar,
// decir en voz alta).

import type { Azar } from './azar';
import type { Veredicto } from './corregir';

/** Cómo le ha ido al alumno con un elemento, en los cuatro niveles de FSRS. */
export type Calificacion = 'otra_vez' | 'dificil' | 'bien' | 'facil';

/** Lo mínimo que el motor necesita de cada cosa que se aprende. */
export interface Elemento {
  /** Único dentro de su pista. */
  readonly id: string;
  /** Grupo de desbloqueo al que pertenece. */
  readonly grupo: string;
}

interface EjercicioBase {
  /** Tipo con espacio de nombres del paquete, por ejemplo «verbos.presente». */
  readonly tipo: string;
  readonly elementoId: string;
  /** Qué tiene que hacer el alumno, en el idioma de la interfaz. */
  readonly instruccion: string;
  /** Lo que se enseña al responder, se acierte o no: la regla que aplica, una nota. */
  readonly aclaracion?: string;
  /** Texto en el idioma que se aprende que se puede escuchar al responder. */
  readonly audio?: string;
  /** Las destrezas que entrena, para medir el nivel de cada una. Si no vienen, las del elemento. */
  readonly destrezas?: readonly string[];
}

/** Opción única: se muestra un enunciado y se elige entre varias opciones. */
export interface EjercicioOpcion extends EjercicioBase {
  readonly forma: 'opcion';
  readonly enunciado: string;
  /** Si el enunciado está en el idioma que se aprende (para lang y la voz). */
  readonly enunciadoEnIdioma: boolean;
  /** Qué dice el enunciado, en el idioma de la interfaz, cuando está en el que se aprende y no lo dicen ya las opciones. */
  readonly significado?: string;
  /** Opciones sin repetir, ya barajadas. */
  readonly opciones: readonly string[];
  readonly opcionesEnIdioma: boolean;
  /** Una de las opciones. */
  readonly respuestaCorrecta: string;
}

/** Una ficha para ordenar: un trozo de frase. */
export interface Ficha {
  readonly id: number;
  readonly texto: string;
}

/** Ordenar: se dan las fichas de una frase desordenadas y hay que ponerlas en su sitio. */
export interface EjercicioOrdenar extends EjercicioBase {
  readonly forma: 'ordenar';
  /** Qué dice la frase, en el idioma de la interfaz. */
  readonly significado: string;
  /** Las fichas, ya barajadas. */
  readonly fichas: readonly Ficha[];
  /** Las frases que valen, sin importar mayúsculas ni puntuación: a veces hay más de un orden bueno. */
  readonly validas: readonly string[];
  /** La frase entera, con su puntuación, para enseñarla al responder. */
  readonly frase: string;
}

/** Traducir: se ve una frase en el idioma de la interfaz y se escribe entera en el que se aprende. */
export interface EjercicioTraducir extends EjercicioBase {
  readonly forma: 'traducir';
  readonly significado: string;
  /** Una ayuda corta para que salga la estructura que se practica («empieza por Morgen»). */
  readonly pista?: string;
  /** Lo que vale. La primera es la que se enseña. */
  readonly respuestas: readonly string[];
}

/** Completar: una frase con un hueco que se rellena escribiendo. */
export interface EjercicioCompletar extends EjercicioBase {
  readonly forma: 'completar';
  readonly antes: string;
  readonly despues: string;
  /** Lo que se da para rellenar el hueco, por ejemplo el infinitivo. */
  readonly pista: string;
  /** Qué dice la frase, si ayuda. */
  readonly significado?: string;
  /** Lo que vale en el hueco. La primera es la que se enseña. */
  readonly respuestas: readonly string[];
}

/** Dictado: suena una frase y se escribe. */
export interface EjercicioDictado extends EjercicioBase {
  readonly forma: 'dictado';
  /** Lo que se lee en voz alta. */
  readonly dictar: string;
  readonly significado: string;
  readonly respuestas: readonly string[];
}

/** Decir: se ve la frase en el idioma de la interfaz, se dice en voz alta y se valora uno mismo. */
export interface EjercicioDecir extends EjercicioBase {
  readonly forma: 'decir';
  readonly significado: string;
  /** La frase buena, que se enseña después de decirla. */
  readonly texto: string;
  /** Las demás formas buenas, que se enseñan con ella: no hace falta decirla igual. */
  readonly otras?: readonly string[];
  readonly pista?: string;
  /** El dominio (de 0 a 1) de lo que se practica, si se sabe: la cuenta atrás aprieta más si se domina y menos si está flojo. */
  readonly dominio?: number;
}

export type Ejercicio = EjercicioOpcion | EjercicioOrdenar | EjercicioTraducir | EjercicioCompletar | EjercicioDictado | EjercicioDecir;

/** Los ejercicios en los que se escribe la respuesta. */
export type EjercicioEscrito = EjercicioTraducir | EjercicioCompletar | EjercicioDictado;

/** Lo que se enseña de un elemento nuevo antes de preguntarlo. */
export interface Presentacion {
  /** Lo que se pone encima. Si no viene, «Nuevo». */
  readonly etiqueta?: string;
  /** Lo que se aprende, en grande. */
  readonly principal: string;
  /** Qué significa, en el idioma de la interfaz, si tiene significado propio. */
  readonly significado?: string;
  /** Pista opcional para recordarlo, en el idioma de la interfaz. */
  readonly nota: string | null;
  /** Texto que se puede escuchar. */
  readonly audio?: string;
  /** Una segunda línea, por ejemplo la regla de gramática. */
  readonly detalle?: string;
  /** Formas que conviene ver juntas (una conjugación), si las hay. */
  readonly tabla?: readonly (readonly [CeldaDeTabla, CeldaDeTabla])[];
  /** Frases de ejemplo, cada una con su traducción. */
  readonly ejemplos?: readonly Ejemplo[];
}

/** Una celda de la tabla: texto en el idioma que se aprende, o una etiqueta en el de la interfaz (como «pregunta»). */
export type CeldaDeTabla = string | { readonly etiqueta: string };

/** Una frase en el idioma que se aprende y lo que dice en el de la interfaz. */
export interface Ejemplo {
  readonly texto: string;
  readonly significado: string;
}

/** Lo que una pista sabe del alumno al crear un ejercicio. */
export interface ContextoEjercicio {
  readonly azar: Azar;
  /** Elementos de la pista que el alumno ya ha visto (candidatos a distractor). */
  readonly vistos: ReadonlySet<string>;
  /** Cuántas veces se ha repasado el elemento. 0 si es nuevo. */
  readonly repeticiones: number;
  /** Formas de ejercicio que el alumno tiene activadas. */
  readonly formas: ReadonlySet<Ejercicio['forma']>;
  /** Variante del idioma de la interfaz, por si el paquete adapta sus textos. */
  readonly variante?: string;
  /** Lo que domina el alumno cada destreza, de 0 a 1, o null si aún no hay datos. Sirve para subir o bajar la dificultad. */
  readonly dominio?: (destreza: string) => number | null;
  /**
   * El alumno ya conoce lo básico y pide menos ayuda: lo nuevo empieza sin andamiaje (escribiendo, en vez de
   * eligiendo u ordenando fichas), salvo que su destreza esté floja o que la forma de escribir que le toca no esté
   * entre las `formas`. Lo que no sale de ninguna regla puede seguir
   * empezando con opciones, como las palabras del paquete de neerlandés, que empiezan por “¿Qué significa?”: una
   * palabra hay que reconocerla antes de escribirla.
   */
  readonly sinAndamiaje?: boolean;
}

/**
 * Una pista de estudio con su progreso y su repaso propios. Los grupos se
 * desbloquean en el orden en que aparecen.
 */
export interface Pista<E extends Elemento = Elemento> {
  readonly id: string;
  readonly nombre: string;
  /** Una línea que dice qué se aprende aquí. */
  readonly descripcion: string;
  readonly grupos: readonly string[];
  /** Nombre para enseñar de cada grupo, si no basta con su id. */
  readonly nombresDeGrupo?: Readonly<Record<string, string>>;
  readonly elementos: readonly E[];
  crearEjercicio(elemento: E, contexto: ContextoEjercicio): Ejercicio;
  /**
   * Si existe, cada elemento nuevo se presenta antes de su primer ejercicio, salvo que devuelva null:
   * lo que sale de una regla ya presentada se intenta sin verlo antes.
   */
  presentar?(elemento: E, variante?: string): Presentacion | null;
  /**
   * Si existe, decide si un grupo puede abrirse mirando el progreso de otras
   * pistas. Si no, solo manda el orden de los grupos.
   */
  grupoListo?(grupo: string, vistosPorPista: ReadonlyMap<string, ReadonlySet<string>>): boolean;
  /** Si existe, explica un fallo en un ejercicio de opciones. null si no hay nada concreto que decir. */
  explicarFallo?(ejercicio: Ejercicio, elegida: string, variante?: string): ExplicacionFallo | null;
  /** Si existe, las destrezas que entrena un elemento (para el nivel y para practicar una regla tras fallarla). */
  destrezasDe?(elemento: E): readonly string[];
  /**
   * Si existe, explica qué falla en una respuesta escrita u ordenada que no vale: la regla concreta que se ha
   * roto y dónde. Vacío si no encuentra nada concreto (una palabra que no se sabe, por ejemplo).
   */
  diagnosticar?(ejercicio: Ejercicio, respuesta: string): readonly Diagnostico[];
  /**
   * Si existe, lo que se dice tras el primer fallo de una respuesta escrita u ordenada para dejar intentarlo otra vez:
   * la regla con las palabras de la respuesta, sin dar la solución. Vacío si en ese ejercicio no se pide otro intento
   * (si lo que se pregunta es una palabra o lo que se oye, una pista solo daría la respuesta).
   */
  pistasDeReintento?(ejercicio: Ejercicio, diagnosticos: readonly Diagnostico[], veredicto: Veredicto): readonly string[];
}

/** Un fallo concreto en una respuesta: qué regla se ha roto, dónde y cómo se arregla. */
export interface Diagnostico {
  /** La destreza que se ha fallado. */
  readonly destreza: string;
  /** Una línea que dice qué ha fallado. */
  readonly titulo: string;
  /** Por qué, con la regla aplicada a esta frase. */
  readonly texto: string;
  /**
   * Lo que se dice antes de dejar intentarlo otra vez: la regla con las palabras de la respuesta y, si el fallo viene
   * del inglés, el contraste, sin dar la frase ni la forma buenas.
   */
  readonly pista?: string;
}

/** Una destreza que se mide: una regla o un tipo de conocimiento. */
export interface Destreza {
  readonly id: string;
  readonly nombre: string;
  /** Nivel del Marco Común Europeo en que se espera dominarla. */
  readonly nivel: string;
  /** Qué es, en una línea. */
  readonly descripcion: string;
}

/** Por qué una respuesta elegida no era la buena, y qué elementos conviene practicar juntos. */
export interface ExplicacionFallo {
  readonly texto: string;
  /** Ids de elementos de la misma pista: el que se preguntaba y, si lo es, el que se eligió. */
  readonly elementos: readonly string[];
}

/** Lo que un idioma entrega al motor. */
export interface PaqueteDeIdioma {
  /** Código del idioma, de BCP 47. */
  readonly id: string;
  readonly nombre: string;
  readonly pistas: readonly Pista[];
  /** Las destrezas que se miden, en el orden en que se enseñan. */
  readonly destrezas?: readonly Destreza[];
}
