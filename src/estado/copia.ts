// La copia de seguridad, de cara al alumno: cómo se entrega el archivo
// (compartir en el móvil, descargar en el navegador o, si no hay otra, el
// portapapeles) y cómo se lee una copia elegida.

import { deserializarCopia, serializarCopia, type Datos } from '../motor';
import { NOMBRE_APP } from './app';

export type Entrega = 'compartida' | 'descargada' | 'portapapeles';

export const MENSAJE_DE_ENTREGA: Readonly<Record<Entrega, string>> = {
  compartida: 'Copia compartida.',
  descargada: 'Copia descargada.',
  portapapeles: 'Copia en el portapapeles.',
};

async function entregarArchivo(contenido: string, nombre: string, titulo: string): Promise<Entrega> {
  try {
    if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
      const archivo = new File([contenido], nombre, { type: 'application/json' });
      if (navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: titulo });
        return 'compartida';
      }
    }
  } catch {
    // Si se cancela el compartir, se cae a la descarga.
  }
  try {
    const url = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
    return 'descargada';
  } catch {
    await navigator.clipboard.writeText(contenido);
    return 'portapapeles';
  }
}

export function exportarCopia(datos: Datos, ahora: Date): Promise<Entrega> {
  return entregarArchivo(serializarCopia(datos, NOMBRE_APP, ahora), `stap-copia-${ahora.toISOString().slice(0, 10)}.json`, 'Copia de Stap');
}

/** Lee una copia. Lanza CopiaIlegible si no es una copia de esta app. */
export function leerCopia(texto: string): Datos {
  return deserializarCopia(texto, NOMBRE_APP);
}
