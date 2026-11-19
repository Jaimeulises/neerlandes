import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REGLAS_ORDEN } from './orden/datos';
import { ELEMENTOS_ORDEN } from './orden/pista';
import { documentoDeRevision } from './revision';
import { REGLAS_VERBOS } from './verbos/pista';

describe('el documento de revisión', () => {
  it('está al día con el contenido (si falla: npm run revision)', () => {
    const enDisco = readFileSync(new URL('../../docs/revision.md', import.meta.url), 'utf8');
    expect(enDisco).toBe(documentoDeRevision());
  });

  it('trae todo el texto con neerlandés que enseña la app: las reglas y las pistas', () => {
    const documento = documentoDeRevision();
    for (const regla of [...Object.values(REGLAS_ORDEN), ...Object.values(REGLAS_VERBOS)]) expect(documento).toContain(regla);
    for (const f of ELEMENTOS_ORDEN) if (f.pista) expect(documento, f.id).toContain(f.pista);
  });

  it('no lleva rayas largas ni medias', () => {
    expect(documentoDeRevision()).not.toMatch(/[\u2013\u2014]/);
  });
});
