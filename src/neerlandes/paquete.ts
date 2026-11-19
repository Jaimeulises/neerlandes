// El paquete de neerlandés: lo que el motor recibe.

import type { PaqueteDeIdioma, Pista } from '../motor';
import { orden } from './orden/pista';
import { verbos } from './verbos/pista';
import { vocabulario } from './vocabulario/pista';

export const PISTAS: readonly Pista[] = [orden, verbos, vocabulario] as readonly Pista[];

export const neerlandes: PaqueteDeIdioma = {
  id: 'nl',
  nombre: 'Neerlandés',
  pistas: PISTAS,
};

export function pistaPorId(id: string): Pista | undefined {
  return PISTAS.find((p) => p.id === id);
}
