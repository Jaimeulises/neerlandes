// Lo que ha fallado en una respuesta, regla a regla.

import type { ReactElement } from 'react';
import type { Diagnostico } from '../../motor';
import { ConNeerlandes } from './ConNeerlandes';

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
