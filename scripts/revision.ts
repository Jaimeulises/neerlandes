// Escribe docs/revision.md con el neerlandés de la app que falta por revisar. Se lanza con `npm run revision`.

import { writeFileSync } from 'node:fs';
import { documentoDeRevision } from '../src/neerlandes/revision/documento';

const destino = new URL('../docs/revision.md', import.meta.url);
writeFileSync(destino, documentoDeRevision());
console.log(`Escrito ${destino.pathname}`);
