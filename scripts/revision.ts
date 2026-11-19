// Escribe docs/revision.md con todo el neerlandés de la app. Se lanza con `npm run revision`.

import { writeFileSync } from 'node:fs';
import { documentoDeRevision } from '../src/neerlandes/revision';

const destino = new URL('../docs/revision.md', import.meta.url);
writeFileSync(destino, documentoDeRevision());
console.log(`Escrito ${destino.pathname}`);
