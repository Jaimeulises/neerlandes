// La voz neerlandesa. Primero, el audio grabado que va dentro de la app
// (src/neerlandes/audio.ts): una voz neuronal, grabada una vez en el
// ordenador. Si un texto no está grabado, la voz del propio dispositivo
// (síntesis del navegador), y de esa solo las locales: las de red (las
// «Google» de Chrome, las «Online» de Edge) mandan cada frase a un servidor.
// Sin audio grabado ni voz neerlandesa local, la app funciona igual sin audio
// ni dictado.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { audioDe, vozGrabada } from '../neerlandes/audio';

export interface Voz {
  readonly disponible: boolean;
  /** Nombre de la voz que suena, para enseñarlo en Ajustes. */
  readonly nombre: string | null;
  readonly decir: (texto: string) => void;
}

function sintesis(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

/** Cuánto suena una voz del sistema: 2 premium, 1 mejorada, 0 la compacta que viene de serie. */
function calidad(v: SpeechSynthesisVoice): number {
  const nombre = `${v.voiceURI} ${v.name}`.toLowerCase();
  if (nombre.includes('premium')) return 2;
  if (nombre.includes('enhanced') || nombre.includes('mejorada') || nombre.includes('verbeterd')) return 1;
  return 0;
}

/**
 * La mejor voz neerlandesa del dispositivo: de nl-NL si la hay, si no cualquier nl, y dentro de
 * cada una la de más calidad (premium, luego mejorada). Nunca una voz de red.
 */
export function elegirVoz(voces: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const idioma = (v: SpeechSynthesisVoice): string => v.lang.toLowerCase().replace('_', '-');
  const nl = voces.filter((v) => v.localService && idioma(v).startsWith('nl'));
  const mejor = (lista: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null =>
    lista.reduce<SpeechSynthesisVoice | null>((elegida, v) => (elegida === null || calidad(v) > calidad(elegida) ? v : elegida), null);
  return mejor(nl.filter((v) => idioma(v) === 'nl-nl')) ?? mejor(nl);
}

// Un solo reproductor para toda la app: dos toques seguidos no se solapan, y en iOS, una vez que ha
// sonado tras un toque, puede volver a sonar sin otro.
let reproductor: HTMLAudioElement | null = null;

function reproducir(ruta: string, lenta: boolean): void {
  if (typeof Audio === 'undefined') return;
  reproductor ??= new Audio();
  reproductor.pause();
  reproductor.src = ruta;
  // Cambiar el archivo devuelve la velocidad a la de por defecto: se fijan las dos.
  const velocidad = lenta ? 0.8 : 1;
  reproductor.defaultPlaybackRate = velocidad;
  reproductor.playbackRate = velocidad;
  reproductor.preservesPitch = true;
  reproductor.play().catch(() => {
    // Sin permiso para sonar todavía (iOS antes del primer toque) o sin archivo: no pasa nada.
  });
}

export function useVoz(activa: boolean, lenta: boolean): Voz {
  const [voz, setVoz] = useState<SpeechSynthesisVoice | null>(null);
  const grabada = vozGrabada();

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
      if (!activa || texto.trim() === '') return;
      const s = sintesis();
      const ruta = audioDe(texto);
      if (ruta) {
        s?.cancel();
        reproducir(ruta, lenta);
        return;
      }
      if (!s || !voz) return;
      reproductor?.pause();
      s.cancel();
      const frase = new SpeechSynthesisUtterance(texto);
      frase.voice = voz;
      frase.lang = voz.lang;
      frase.rate = lenta ? 0.75 : 0.95;
      s.speak(frase);
    },
    [voz, activa, lenta],
  );

  const nombre = grabada ? `${grabada} (grabada con Azure)` : voz ? `${voz.name} (${voz.lang})` : null;
  return useMemo(() => ({ disponible: (voz !== null || grabada !== null) && activa, nombre, decir }), [voz, grabada, activa, nombre, decir]);
}
