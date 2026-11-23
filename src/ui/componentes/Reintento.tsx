// La pista del primer fallo, antes de intentarlo otra vez. Lo que va entre «» es neerlandés.

import type { ReactElement } from 'react';
import { ConNeerlandes } from './Diagnosticos';

export function Reintento({ pistas }: { readonly pistas: readonly string[] }): ReactElement {
  return (
    <div className="reintento" role="status" aria-live="polite">
      <p className="reintento__titulo">Todavía no. Inténtalo otra vez</p>
      {pistas.map((p) => (
        <p key={p} className="reintento__texto">
          <ConNeerlandes texto={p} />
        </p>
      ))}
    </div>
  );
}
