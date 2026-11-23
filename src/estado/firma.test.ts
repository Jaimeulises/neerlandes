// El aviso de caducidad de la firma en el iPhone.

import { describe, expect, it } from 'vitest';
import { avisoFirma } from './firma';

describe('aviso de la firma', () => {
  const caduca = new Date('2026-11-27T15:25:00Z');

  it('con tiempo de sobra solo dice la fecha', () => {
    const aviso = avisoFirma(caduca, new Date('2026-11-23T10:00:00Z'));
    expect(aviso.urgente).toBe(false);
    expect(aviso.texto).toMatch(/^Esta instalación caduca el viernes, 27 de noviembre/);
  });

  it('a dos días o menos pide reinstalar', () => {
    const aviso = avisoFirma(caduca, new Date('2026-11-26T10:00:00Z'));
    expect(aviso.urgente).toBe(true);
    expect(aviso.texto).toContain('npm run iphone');
  });

  it('pasada la fecha dice que caducó', () => {
    expect(avisoFirma(caduca, new Date('2026-11-28T10:00:00Z')).texto).toMatch(/^La instalación caducó/);
  });
});
