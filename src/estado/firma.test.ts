// El aviso de caducidad de la firma en el iPhone.

import { describe, expect, it } from 'vitest';
import { avisoFirma } from './firma';

describe('aviso de la firma', () => {
  // A mediodía en UTC es viernes 27 en todas las zonas, de UTC-11 a UTC+11: la prueba no depende de dónde se pase.
  const caduca = new Date('2026-11-27T12:00:00Z');

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
