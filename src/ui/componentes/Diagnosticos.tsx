// Lo que ha fallado en una respuesta, regla a regla. Lo que va entre «» es
// neerlandés y se marca con lang="nl" para que se lea y se pronuncie como tal.

import type { ReactElement, ReactNode } from 'react';
import type { Diagnostico } from '../../motor';

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

export function Diagnosticos({ diagnosticos }: { readonly diagnosticos: readonly Diagnostico[] }): ReactElement | null {
  if (diagnosticos.length === 0) return null;
  return (
    <div className="diagnosticos" aria-label="Qué ha fallado">
      {diagnosticos.map((d) => (
        <div key={d.destreza} className="diagnostico">
          <p className="diagnostico__titulo">
            <ConNeerlandes texto={d.titulo} />
          </p>
          <p className="diagnostico__texto">
            <ConNeerlandes texto={d.texto} />
          </p>
        </div>
      ))}
    </div>
  );
}
