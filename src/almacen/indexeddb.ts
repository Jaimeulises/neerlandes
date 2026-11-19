// El almacén de la app: IndexedDB, que en iOS y Android aguanta mejor que
// localStorage. Si no hay IndexedDB (pruebas, navegadores raros), se usa
// localStorage, y si tampoco, memoria.

import { openDB, type IDBPDatabase } from 'idb';
import { almacenEnMemoria, type Almacen } from '../motor';

const BASE = 'stap';
const TABLA = 'datos';

export function almacenIndexedDB(): Almacen {
  let abierta: Promise<IDBPDatabase> | null = null;
  const bd = (): Promise<IDBPDatabase> => {
    abierta ??= openDB(BASE, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TABLA)) db.createObjectStore(TABLA);
      },
    });
    return abierta;
  };
  return {
    async leer(clave) {
      const valor: unknown = await (await bd()).get(TABLA, clave);
      return typeof valor === 'string' ? valor : null;
    },
    async guardar(clave, valor) {
      await (await bd()).put(TABLA, valor, clave);
    },
    async borrar(clave) {
      await (await bd()).delete(TABLA, clave);
    },
  };
}

export function almacenLocalStorage(): Almacen {
  const prefijo = `${BASE}/`;
  return {
    leer: (clave) => Promise.resolve(localStorage.getItem(prefijo + clave)),
    guardar: (clave, valor) => {
      localStorage.setItem(prefijo + clave, valor);
      return Promise.resolve();
    },
    borrar: (clave) => {
      localStorage.removeItem(prefijo + clave);
      return Promise.resolve();
    },
  };
}

export function almacenDelDispositivo(): Almacen {
  if (typeof indexedDB !== 'undefined') return almacenIndexedDB();
  if (typeof localStorage !== 'undefined') return almacenLocalStorage();
  return almacenEnMemoria();
}
