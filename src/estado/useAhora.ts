// La hora de las pantallas que dependen del día (Hoy, Progreso). En el móvil la app vuelve del segundo
// plano sin recargarse: si la hora se tomara solo al pintar, por la mañana seguiría enseñando lo de ayer.

import { useEffect, useState } from 'react';

/** Cada cuánto se renueva con la app a la vista: lo justo para que lo que vence durante el día aparezca. */
const CADA = 60_000;

export function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const renovar = (): void => {
      if (document.visibilityState !== 'hidden') setAhora(new Date());
    };
    const reloj = setInterval(renovar, CADA);
    document.addEventListener('visibilitychange', renovar);
    window.addEventListener('focus', renovar);
    window.addEventListener('pageshow', renovar);
    return () => {
      clearInterval(reloj);
      document.removeEventListener('visibilitychange', renovar);
      window.removeEventListener('focus', renovar);
      window.removeEventListener('pageshow', renovar);
    };
  }, []);
  return ahora;
}
