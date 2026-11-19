// El almacén de IndexedDB se recupera solo: si no se pudo abrir, se vuelve a probar en el siguiente
// intento, y si el navegador cerró la conexión, se abre otra.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { almacenIndexedDB } from './indexeddb';

interface OpcionesDeApertura {
  readonly terminated?: () => void;
}

const abrir = vi.hoisted(() => vi.fn<(nombre: string, version: number, opciones: OpcionesDeApertura) => Promise<unknown>>());
vi.mock('idb', () => ({ openDB: abrir }));

function base(get: () => Promise<unknown>): unknown {
  return { get, put: () => Promise.resolve(), delete: () => Promise.resolve() };
}

describe('el almacén de IndexedDB', () => {
  beforeEach(() => {
    abrir.mockReset();
  });

  it('si no se pudo abrir, el siguiente intento vuelve a probar', async () => {
    abrir.mockRejectedValueOnce(new Error('bloqueado')).mockResolvedValueOnce(base(() => Promise.resolve('hola')));
    const almacen = almacenIndexedDB();
    await expect(almacen.leer('x')).rejects.toThrow('bloqueado');
    await expect(almacen.leer('x')).resolves.toBe('hola');
    expect(abrir).toHaveBeenCalledTimes(2);
  });

  it('si la conexión ya estaba cerrada, abre otra y repite la operación', async () => {
    abrir
      .mockResolvedValueOnce(base(() => Promise.reject(new DOMException('cerrada', 'InvalidStateError'))))
      .mockResolvedValueOnce(base(() => Promise.resolve('hola')));
    await expect(almacenIndexedDB().leer('x')).resolves.toBe('hola');
    expect(abrir).toHaveBeenCalledTimes(2);
  });

  it('si el navegador la cierra por su cuenta, la siguiente operación abre otra', async () => {
    let cerrar: (() => void) | undefined;
    abrir.mockImplementation((_nombre, _version, opciones) => {
      cerrar = opciones.terminated;
      return Promise.resolve(base(() => Promise.resolve('hola')));
    });
    const almacen = almacenIndexedDB();
    await almacen.leer('x');
    await almacen.leer('x');
    expect(abrir).toHaveBeenCalledTimes(1);
    cerrar?.();
    await almacen.leer('x');
    expect(abrir).toHaveBeenCalledTimes(2);
  });

  it('otros errores no se esconden', async () => {
    abrir.mockResolvedValue(base(() => Promise.reject(new Error('cuota'))));
    await expect(almacenIndexedDB().leer('x')).rejects.toThrow('cuota');
    expect(abrir).toHaveBeenCalledTimes(1);
  });
});
