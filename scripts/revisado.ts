// Apunta qué se ha revisado y vuelve a escribir docs/revision.md. Se lanza al terminar un lote y antes de aplicar
// sus correcciones, con los códigos de la copia que se leyó: `npm run revisado -- O1-O12 R1 V3`. Lo que después se
// corrija vuelve solo a pendiente. Para desmarcar: `npm run revisado -- --quitar O12`.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { audioDe } from '../src/neerlandes/audio';
import { textosEnVozAlta } from '../src/neerlandes/audio-textos';
import { documentoDeRevision } from '../src/neerlandes/revision/documento';
import { elementosDeRevision } from '../src/neerlandes/revision/elementos';
import { cambiadosDesdeSuRevision, cambiosQueImpidenMarcar, leerCodigos, marcar, quitar, serializarRegistro, tramos, type Registro } from '../src/neerlandes/revision/estado';

const archivo = new URL('../src/neerlandes/revision/revisado.json', import.meta.url);
const documento = new URL('../docs/revision.md', import.meta.url);
const raiz = fileURLToPath(new URL('..', import.meta.url));

const argumentos = process.argv.slice(2);
const quitando = argumentos.includes('--quitar');
const pedidos = argumentos.filter((a) => a !== '--quitar');
if (pedidos.length === 0) {
  console.error('Uso: npm run revisado -- O1-O12 R1 V3   (para desmarcar: npm run revisado -- --quitar O12)');
  process.exit(1);
}

/** Hoy, en la hora de este ordenador: AAAA-MM-DD. */
function hoy(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${String(d.getFullYear())}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Los cambios sin guardar en el contenido, o null si no se puede preguntar a git. */
function cambiosSinGuardar(): string[] | null {
  try {
    return cambiosQueImpidenMarcar(execFileSync('git', ['status', '--porcelain', '--', 'src/neerlandes'], { cwd: raiz, encoding: 'utf8' }));
  } catch {
    return null;
  }
}

try {
  const elementos = elementosDeRevision();
  const registro = JSON.parse(readFileSync(archivo, 'utf8')) as Registro;
  if (!quitando) {
    const cambios = cambiosSinGuardar();
    if (cambios === null) {
      console.warn('No se ha podido preguntar a git si hay cambios sin guardar: marca solo lo que la persona nativa ha visto tal como está ahora.');
    } else if (cambios.length > 0) {
      throw new Error(
        `Hay cambios sin guardar en el contenido (${cambios.join(', ')}). Marca el lote antes de aplicar sus correcciones: si no, quedaría como revisado un texto que la persona nativa no ha visto. Guarda o aparta esos cambios (git commit o git stash), marca y después corrige.`,
      );
    }
  }
  // Al desmarcar valen también los códigos que ya no existen, para poder limpiarlos.
  const validos = quitando ? [...elementos.map((e) => e.codigo), ...Object.keys(registro)] : elementos.map((e) => e.codigo);
  const codigos = leerCodigos(pedidos, validos);
  const cambiados = quitando ? [] : cambiadosDesdeSuRevision(registro, elementos, codigos);
  const nuevo = quitando ? quitar(registro, codigos) : marcar(registro, elementos, codigos, hoy());
  writeFileSync(archivo, serializarRegistro(nuevo));
  writeFileSync(documento, documentoDeRevision(nuevo, elementos));
  console.log(`${quitando ? 'Desmarcado' : 'Revisado'}: ${tramos(codigos)}. Escrito ${documento.pathname}`);
  if (cambiados.length > 0) {
    console.warn(`Ojo: ${tramos(cambiados)} ya se había revisado y ha cambiado desde entonces. Déjalo marcado solo si la persona nativa ha visto el texto de ahora (si no: npm run revisado -- --quitar ${tramos(cambiados, '-', ' ')}).`);
  }
  const sinGrabar = textosEnVozAlta(5).filter((t) => audioDe(t) === null);
  if (sinGrabar.length > 0) console.warn(`${String(sinGrabar.length)} textos que suenan no tienen audio grabado: lanza npm run audio en el Mac antes de instalar la app.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
