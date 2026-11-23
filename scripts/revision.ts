// Escribe docs/revision.md con el neerlandés de la app que falta por revisar. Se lanza con `npm run revision`.
// Avisa también si hay textos que suenan sin audio grabado: después de corregir, toca grabarlos en el Mac.

import { writeFileSync } from 'node:fs';
import { audioDe } from '../src/neerlandes/audio';
import { textosEnVozAlta } from '../src/neerlandes/audio-textos';
import { documentoDeRevision } from '../src/neerlandes/revision/documento';

const destino = new URL('../docs/revision.md', import.meta.url);
writeFileSync(destino, documentoDeRevision());
console.log(`Escrito ${destino.pathname}`);

const sinGrabar = textosEnVozAlta(5).filter((t) => audioDe(t) === null);
if (sinGrabar.length > 0) console.warn(`${sinGrabar.length === 1 ? 'Un texto que suena no tiene' : `${String(sinGrabar.length)} textos que suenan no tienen`} audio grabado: lanza npm run audio en el Mac antes de instalar la app.`);
