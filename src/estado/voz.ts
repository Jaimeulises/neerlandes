// La voz neerlandesa del propio dispositivo (síntesis del navegador). Solo
// voces locales: las de red (las «Google» de Chrome, las «Online» de Edge)
// mandan cada frase a un servidor. Si no hay ninguna voz neerlandesa local, la
// app funciona igual sin audio ni dictado.

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

/** La mejor voz neerlandesa del dispositivo: de nl-NL si la hay, si no cualquier nl. Nunca una voz de red. */
export function elegirVoz(voces: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const idioma = (v: SpeechSynthesisVoice): string => v.lang.toLowerCase().replace('_', '-');
  const nl = voces.filter((v) => v.localService && idioma(v).startsWith('nl'));
  return nl.find((v) => idioma(v) === 'nl-nl') ?? nl[0] ?? null;
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
