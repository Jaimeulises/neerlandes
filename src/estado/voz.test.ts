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

describe('elegir la voz por calidad', () => {
  function conUri(name: string, lang: string, voiceURI: string): SpeechSynthesisVoice {
    return { name, lang, localService: true, default: false, voiceURI };
  }

  it('prefiere la premium y luego la mejorada, sin salir de nl-NL si la hay', () => {
    const compacta = conUri('Xander', 'nl-NL', 'com.apple.voice.compact.nl-NL.Xander');
    const mejorada = conUri('Claire (mejorada)', 'nl-NL', 'com.apple.voice.enhanced.nl-NL.Claire');
    const premium = conUri('Xander', 'nl-NL', 'com.apple.voice.premium.nl-NL.Xander');
    const belga = conUri('Ellen', 'nl-BE', 'com.apple.voice.premium.nl-BE.Ellen');
    expect(elegirVoz([compacta, mejorada])?.voiceURI).toBe(mejorada.voiceURI);
    expect(elegirVoz([mejorada, premium, compacta])?.voiceURI).toBe(premium.voiceURI);
    expect(elegirVoz([belga, compacta])?.voiceURI).toBe(compacta.voiceURI);
  });
});
