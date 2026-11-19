// La voz neerlandesa del propio dispositivo (síntesis del navegador). Se
// prefiere una voz local de nl-NL: así nada sale del dispositivo. Si no hay
// ninguna voz neerlandesa, la app funciona igual sin audio ni dictado.

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface Voz {
  readonly disponible: boolean;
  /** Nombre de la voz elegida, para enseñarlo en Ajustes. */
  readonly nombre: string | null;
  readonly decir: (texto: string) => void;
}

function sintesis(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

/** La mejor voz neerlandesa: primero local y de nl-NL, luego cualquier nl-NL, luego cualquier nl. */
export function elegirVoz(voces: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const nl = voces.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('nl'));
  const puntos = (v: SpeechSynthesisVoice): number => (v.lang.toLowerCase().replace('_', '-') === 'nl-nl' ? 2 : 0) + (v.localService ? 1 : 0);
  return [...nl].sort((a, b) => puntos(b) - puntos(a))[0] ?? null;
}

export function useVoz(activa: boolean, lenta: boolean): Voz {
  const [voz, setVoz] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const s = sintesis();
    if (!s) return;
    const cargar = (): void => {
      setVoz(elegirVoz(s.getVoices()));
    };
    cargar();
    s.addEventListener('voiceschanged', cargar);
    return () => {
      s.removeEventListener('voiceschanged', cargar);
    };
  }, []);

  const decir = useCallback(
    (texto: string) => {
      const s = sintesis();
      if (!s || !voz || !activa || texto.trim() === '') return;
      s.cancel();
      const frase = new SpeechSynthesisUtterance(texto);
      frase.voice = voz;
      frase.lang = voz.lang;
      frase.rate = lenta ? 0.75 : 0.95;
      s.speak(frase);
    },
    [voz, activa, lenta],
  );

  return useMemo(() => ({ disponible: voz !== null && activa, nombre: voz ? `${voz.name} (${voz.lang})` : null, decir }), [voz, activa, decir]);
}
