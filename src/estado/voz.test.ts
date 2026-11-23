// La voz: solo una del propio dispositivo, nunca una de red, que mandaría cada frase a un servidor.

import { describe, expect, it } from 'vitest';
import { elegirVoz } from './voz';

function voz(name: string, lang: string, localService: boolean): SpeechSynthesisVoice {
  return { name, lang, localService, default: false, voiceURI: name };
}

describe('elegir la voz', () => {
  it('prefiere una local de nl-NL y no usa nunca una de red', () => {
    expect(elegirVoz([voz('Google Nederlands', 'nl-NL', false), voz('Ellen', 'nl-BE', true)])?.name).toBe('Ellen');
    expect(elegirVoz([voz('Ellen', 'nl-BE', true), voz('Xander', 'nl_NL', true)])?.name).toBe('Xander');
    expect(elegirVoz([voz('Google Nederlands', 'nl-NL', false)])).toBeNull();
    expect(elegirVoz([voz('Mónica', 'es-ES', true)])).toBeNull();
  });
});
