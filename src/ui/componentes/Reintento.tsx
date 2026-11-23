// La pista del primer fallo, antes de intentarlo otra vez. Lo que va entre «» es neerlandés.

import { useEffect, useRef, type ReactElement } from 'react';
import { Boton } from './Boton';
import { ConNeerlandes } from './ConNeerlandes';

export function Reintento({ pistas }: { readonly pistas: readonly string[] }): ReactElement {
  const panel = useRef<HTMLDivElement>(null);

  // En el móvil, el teclado puede tapar la pista justo cuando hace falta leerla.
  useEffect(() => {
    panel.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  return (
    <div ref={panel} className="reintento" role="status" aria-live="polite">
      <p className="reintento__titulo">Todavía no. Inténtalo otra vez</p>
      {pistas.map((p) => (
        <p key={p} className="reintento__texto">
          <ConNeerlandes texto={p} />
        </p>
      ))}
    </div>
  );
}

/**
 * Rendirse en el segundo intento. La solución es también donde se da por buena una respuesta que
 * falta en los datos: nadie del equipo es nativo y alguna forma buena puede no estar apuntada.
 */
export function VerSolucion({ onVer }: { readonly onVer: () => void }): ReactElement {
  return (
    <>
      <Boton ancho variante="texto" onClick={onVer}>
        Ver la solución
      </Boton>
      <p className="reintento__nota">Si crees que la tuya también vale, en la solución puedes darla por buena.</p>
    </>
  );
}
