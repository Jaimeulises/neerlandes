// Los textos en español llevan el neerlandés entre «»: aquí se marca con
// lang="nl" para que se lea y se pronuncie como tal. Lo citado en español o en
// inglés va entre “” y se queda como texto normal.

import type { ReactElement, ReactNode } from 'react';

/** Un texto con los trozos entre «» marcados como neerlandés. */
export function ConNeerlandes({ texto }: { readonly texto: string }): ReactElement {
  const partes: ReactNode[] = [];
  const patron = /«([^»]*)»/g;
  let ultimo = 0;
  for (let m = patron.exec(texto); m !== null; m = patron.exec(texto)) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    partes.push(
      <span key={m.index} lang="nl" className="nl">
        «{m[1]}»
      </span>,
    );
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return <>{partes}</>;
}

/** El mismo texto sin las «», para donde no se puede marcar un trozo: un aria-label o un title. */
export function sinMarcas(texto: string): string {
  return texto.replace(/[«»]/g, '');
}
