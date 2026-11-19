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
    if (abierta) return abierta;
    const intento = openDB(BASE, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TABLA)) db.createObjectStore(TABLA);
      },
      // El navegador puede cerrar la conexión con la app abierta (Safari lo hace en segundo plano): la
      // siguiente operación abre otra.
      terminated() {
        if (abierta === intento) abierta = null;
      },
    });
    abierta = intento;
    // Si no se pudo abrir, el siguiente intento («Reintentar», el reintento del guardado) vuelve a probar.
    intento.catch(() => {
      if (abierta === intento) abierta = null;
    });
    return intento;
  };
  /** Hace la operación y, si la conexión ya estaba cerrada, abre otra y la repite una vez. */
  const conBase = async <T>(operacion: (db: IDBPDatabase) => Promise<T>): Promise<T> => {
    const actual = bd();
    const db = await actual;
    try {
      return await operacion(db);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'InvalidStateError')) throw e;
      if (abierta === actual) abierta = null;
      return operacion(await bd());
    }
  };
  return {
    async leer(clave) {
      const valor: unknown = await conBase((db) => db.get(TABLA, clave));
      return typeof valor === 'string' ? valor : null;
    },
    async guardar(clave, valor) {
      await conBase((db) => db.put(TABLA, valor, clave));
    },
    async borrar(clave) {
      await conBase((db) => db.delete(TABLA, clave));
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
