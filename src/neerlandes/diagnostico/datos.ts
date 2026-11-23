// Verbos de las frases de orden que no están en verbos/datos.ts y cuyo
// participio no sale de la regla: sin ellos, la explicación de un fallo no
// puede decir que «gebakken» es irregular ni que en «thuisgekomen» el ge- va en
// medio. Las pruebas comprueban que cada participio de las frases de orden está
// aquí o en los verbos.
//
// Pendiente de revisión por una persona nativa (ver docs/revision.md).

export interface OtroVerbo {
  readonly inf: string;
  readonly participio: string;
  readonly aux: 'hebben' | 'zijn';
  /** Participio que no sigue la regla de ge- + raíz + t/d. */
  readonly irregular: boolean;
  /** Si es separable: en el participio, ge- va entre la partícula y el verbo. */
  readonly separable?: boolean;
}

export const OTROS_VERBOS: readonly OtroVerbo[] = [
  { inf: 'bakken', participio: 'gebakken', aux: 'hebben', irregular: true },
  { inf: 'lachen', participio: 'gelachen', aux: 'hebben', irregular: true },
  { inf: 'thuiskomen', participio: 'thuisgekomen', aux: 'zijn', irregular: true, separable: true },
];
