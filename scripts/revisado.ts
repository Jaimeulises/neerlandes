// Apunta qué se ha revisado y vuelve a escribir docs/revision.md. Se lanza al terminar un lote, con la orden que lleva
// debajo de su título en la copia que se leyó: `npm run revisado -- O1-O12 R1 V3 --lote 3fa2b1c4`. El id del lote
// sirve para encontrar esa copia (en docs/revision.md o en su historial de git) y apuntar lo que decía, no lo que
// diga el código ahora: lo que se haya corregido después sigue pendiente. Para desmarcar: `npm run revisado -- --quitar O12`.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { audioDe } from '../src/neerlandes/audio';
import { textosEnVozAlta } from '../src/neerlandes/audio-textos';
import { documentoDeRevision } from '../src/neerlandes/revision/documento';
import { elementosDeRevision } from '../src/neerlandes/revision/elementos';
import { cambiadosDesdeQueSeLeyo, leerCodigos, leerLote, marcar, quitar, serializarRegistro, tramos, type Registro } from '../src/neerlandes/revision/estado';

const archivo = new URL('../src/neerlandes/revision/revisado.json', import.meta.url);
const documento = new URL('../docs/revision.md', import.meta.url);
const raiz = fileURLToPath(new URL('..', import.meta.url));
const USO = 'Uso: npm run revisado -- O1-O12 R1 V3 --lote 3fa2b1c4, la orden de debajo del título del lote (para desmarcar: npm run revisado -- --quitar O12)';

const argumentos = process.argv.slice(2);
const quitando = argumentos.includes('--quitar');
const posLote = argumentos.indexOf('--lote');
const idLote = posLote >= 0 ? argumentos[posLote + 1] : undefined;
const pedidos = argumentos.filter((a, i) => a !== '--quitar' && i !== posLote && i !== posLote + 1);
if (pedidos.length === 0 || (posLote >= 0 && !/^[0-9a-f]{8}$/i.test(idLote ?? '')) || (!quitando && posLote < 0)) {
  console.error(USO);
  process.exit(1);
}

/** Hoy, en la hora de este ordenador: AAAA-MM-DD. */
function hoy(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${String(d.getFullYear())}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Las copias de docs/revision.md, de la más nueva a la más vieja: la del disco y las guardadas en git. */
function* copias(): Generator<string> {
  yield readFileSync(documento, 'utf8');
  let commits: string[] = [];
  try {
    commits = execFileSync('git', ['log', '--format=%H', '--', 'docs/revision.md'], { cwd: raiz, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    console.warn('No se ha podido mirar el historial de git: solo se busca el lote en docs/revision.md tal como está.');
  }
  for (const commit of commits) {
    try {
      yield execFileSync('git', ['show', `${commit}:docs/revision.md`], { cwd: raiz, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch {
      // Una versión que no se puede leer no impide buscar en las demás.
    }
  }
}

/** Las huellas del lote tal como salían en la copia que se leyó. */
function loteLeido(id: string): Map<string, string> {
  for (const copia of copias()) {
    const lote = leerLote(copia, id);
    if (lote) return lote;
  }
  throw new Error(
    `No encuentro el lote ${id} en docs/revision.md ni en su historial de git. Copia la orden tal como sale en la copia que se leyó; si esa copia no se llegó a guardar en git, no se puede saber qué decía: hay que volver a leer el lote en una copia nueva.`,
  );
}

try {
  const elementos = elementosDeRevision();
  const registro = JSON.parse(readFileSync(archivo, 'utf8')) as Registro;
  let nuevo: Registro;
  let codigos: string[];
  let cambiados: string[] = [];
  if (quitando) {
    // Al desmarcar valen también los códigos que ya no existen, para poder limpiarlos.
    codigos = leerCodigos(pedidos, [...elementos.map((e) => e.codigo), ...Object.keys(registro)]);
    nuevo = quitar(registro, codigos);
  } else {
    const id = (idLote ?? '').toLowerCase();
    const leidas = loteLeido(id);
    codigos = leerCodigos(pedidos, leidas.keys(), `el lote ${id}`);
    cambiados = cambiadosDesdeQueSeLeyo(leidas, elementos, codigos);
    nuevo = marcar(registro, leidas, codigos, hoy());
  }
  writeFileSync(archivo, serializarRegistro(nuevo));
  writeFileSync(documento, documentoDeRevision(nuevo, elementos));
  console.log(`${quitando ? 'Desmarcado' : 'Revisado'}: ${tramos(codigos)}. Escrito ${documento.pathname}`);
  if (cambiados.length > 0) {
    console.log(`${tramos(cambiados)}: ha cambiado desde esa copia, así que se apunta lo que se leyó y sigue pendiente. Sale en el lote siguiente para confirmarlo.`);
  }
  const sinGrabar = textosEnVozAlta(5).filter((t) => audioDe(t) === null);
  if (sinGrabar.length > 0) console.warn(`${sinGrabar.length === 1 ? 'Un texto que suena no tiene' : `${String(sinGrabar.length)} textos que suenan no tienen`} audio grabado: lanza npm run audio en el Mac antes de instalar la app.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
