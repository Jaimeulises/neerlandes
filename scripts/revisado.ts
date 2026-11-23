// Apunta qué se ha revisado y vuelve a escribir docs/revision.md. Se lanza al terminar un lote, después de aplicar
// sus correcciones: `npm run revisado -- O1-O12 R1 V3`. Para desmarcar: `npm run revisado -- --quitar O12`.

import { readFileSync, writeFileSync } from 'node:fs';
import { documentoDeRevision } from '../src/neerlandes/revision/documento';
import { elementosDeRevision } from '../src/neerlandes/revision/elementos';
import { leerCodigos, marcar, quitar, tramos, type Registro } from '../src/neerlandes/revision/estado';

const archivo = new URL('../src/neerlandes/revision/revisado.json', import.meta.url);
const documento = new URL('../docs/revision.md', import.meta.url);

const argumentos = process.argv.slice(2);
const quitando = argumentos.includes('--quitar');
const pedidos = argumentos.filter((a) => a !== '--quitar');
if (pedidos.length === 0) {
  console.error('Uso: npm run revisado -- O1-O12 R1 V3   (para desmarcar: npm run revisado -- --quitar O12)');
  process.exit(1);
}

const elementos = elementosDeRevision();
const registro = JSON.parse(readFileSync(archivo, 'utf8')) as Registro;

/** Hoy, en la hora de este ordenador: AAAA-MM-DD. */
function hoy(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${String(d.getFullYear())}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

try {
  // Al desmarcar valen también los códigos que ya no existen, para poder limpiarlos.
  const validos = quitando ? [...elementos.map((e) => e.codigo), ...Object.keys(registro)] : elementos.map((e) => e.codigo);
  const codigos = leerCodigos(pedidos, validos);
  const nuevo = quitando ? quitar(registro, codigos) : marcar(registro, elementos, codigos, hoy());
  writeFileSync(archivo, `${JSON.stringify(nuevo, null, 2)}\n`);
  writeFileSync(documento, documentoDeRevision(nuevo, elementos));
  console.log(`${quitando ? 'Desmarcado' : 'Revisado'}: ${tramos(codigos)}. Escrito ${documento.pathname}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
