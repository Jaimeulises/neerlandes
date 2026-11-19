import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { documentoDeRevision } from './revision';

describe('el documento de revisión', () => {
  it('está al día con el contenido (si falla: npm run revision)', () => {
    const enDisco = readFileSync(new URL('../../docs/revision.md', import.meta.url), 'utf8');
    expect(enDisco).toBe(documentoDeRevision());
  });

  it('no lleva rayas largas ni medias', () => {
    expect(documentoDeRevision()).not.toMatch(/[\u2013\u2014]/);
  });
});
