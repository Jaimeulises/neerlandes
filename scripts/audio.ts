// Graba con una voz neuronal de Azure lo que la app lee en voz alta y aún no
// tiene audio (public/audio), y actualiza el manifiesto
// (src/neerlandes/audio-manifiesto.json). Se lanza a mano en el ordenador: la
// app no habla con Azure ni con nadie, solo reproduce los archivos.
//
// La clave nunca se escribe en archivos: se lee de AZURE_SPEECH_KEY o del
// llavero del Mac (servicio AZURE_SPEECH_LLAVERO; si no se dice otro,
// azure-speech-japones, la misma cuenta de Azure que Michi). La región, de
// AZURE_SPEECH_REGION (westeurope si no).
//
// Uso:
//   npm run audio                                graba lo que falte, con la voz del manifiesto
//   npm run audio -- --voz nl-NL-FennaNeural     elige o cambia la voz (y lo regraba todo)
//   npm run audio -- --muestras <carpeta>        una frase con cada voz, para elegir

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRASE_DE_PRUEBA, huellaAudio, type ManifiestoAudio } from '../src/neerlandes/audio.ts';
import { textosEnVozAlta } from '../src/neerlandes/audio-textos.ts';
import { ELEMENTOS_ORDEN } from '../src/neerlandes/orden/pista.ts';

const RAIZ = resolve(fileURLToPath(import.meta.url), '../..');
const CARPETA = resolve(RAIZ, 'public/audio');
const MANIFIESTO = resolve(RAIZ, 'src/neerlandes/audio-manifiesto.json');

/** Las voces neuronales de neerlandés de los Países Bajos, con el nombre que se enseña en Ajustes. */
const VOCES: Readonly<Record<string, string>> = {
  'nl-NL-FennaNeural': 'Fenna',
  'nl-NL-ColetteNeural': 'Colette',
  'nl-NL-MaartenNeural': 'Maarten',
};

/** Un poco más despacio que lo normal, para aprender. «Más despacio» en Ajustes lo frena aún más al reproducir. */
const VELOCIDAD = '-10%';

function argumento(nombre: string): string | undefined {
  const i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function clave(): string {
  const env = process.env.AZURE_SPEECH_KEY;
  if (env) return env;
  const servicio = process.env.AZURE_SPEECH_LLAVERO ?? 'azure-speech-japones';
  try {
    return execFileSync('security', ['find-generic-password', '-s', servicio, '-w'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error(`Sin clave de Azure: define AZURE_SPEECH_KEY o guárdala en el llavero como ${servicio}.`);
  }
}

function ssml(texto: string, voz: string): string {
  const escapado = texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="nl-NL"><voice name="${voz}"><prosody rate="${VELOCIDAD}">${escapado}</prosody></voice></speak>`;
}

const esperar = (ms: number): Promise<void> =>
  new Promise((r) => {
    setTimeout(r, ms);
  });

/** La capa gratuita de Azure limita las peticiones por minuto: ante un 429 (o un fallo suyo) se espera y se reintenta. */
async function sintetizar(texto: string, voz: string, region: string, k: string, intento = 0): Promise<Buffer> {
  const respuesta = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': k,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'stap-audio',
    },
    body: ssml(texto, voz),
    signal: AbortSignal.timeout(20_000),
  });
  if ((respuesta.status === 429 || respuesta.status >= 500) && intento < 6) {
    const pedida = Number(respuesta.headers.get('retry-after'));
    const pausa = Number.isFinite(pedida) && pedida > 0 ? pedida * 1000 : ([5_000, 15_000, 30_000, 60_000][intento] ?? 60_000);
    console.log(`Azure pide esperar (${respuesta.status}): ${pausa / 1000} s`);
    await esperar(pausa);
    return sintetizar(texto, voz, region, k, intento + 1);
  }
  if (!respuesta.ok) throw new Error(`Azure ${respuesta.status}: ${await respuesta.text()}`);
  const datos = Buffer.from(await respuesta.arrayBuffer());
  if (datos.length < 1000) throw new Error(`Audio demasiado corto para «${texto}»`);
  return datos;
}

function leerManifiesto(): ManifiestoAudio {
  return JSON.parse(readFileSync(MANIFIESTO, 'utf8')) as ManifiestoAudio;
}

function guardarManifiesto(m: ManifiestoAudio): void {
  writeFileSync(MANIFIESTO, `${JSON.stringify({ ...m, archivos: [...m.archivos].sort() }, null, 2)}\n`);
}

async function muestras(carpeta: string, region: string, k: string): Promise<void> {
  const ejemplo = ELEMENTOS_ORDEN[0]?.frase ?? '';
  const texto = `${FRASE_DE_PRUEBA} ${ejemplo}`;
  mkdirSync(carpeta, { recursive: true });
  for (const [voz, nombre] of Object.entries(VOCES)) {
    const ruta = resolve(carpeta, `${nombre}.mp3`);
    writeFileSync(ruta, await sintetizar(texto, voz, region, k));
    console.log(ruta);
  }
  console.log(`Texto de las muestras: ${texto}`);
}

async function principal(): Promise<void> {
  const region = process.env.AZURE_SPEECH_REGION ?? 'westeurope';
  const carpetaMuestras = argumento('--muestras');
  if (carpetaMuestras) {
    await muestras(resolve(carpetaMuestras), region, clave());
    return;
  }

  const anterior = leerManifiesto();
  const voz = argumento('--voz') ?? anterior.voz;
  const nombre = VOCES[voz];
  if (!nombre) throw new Error(`Elige una voz con --voz: ${Object.keys(VOCES).join(', ')}.`);

  mkdirSync(CARPETA, { recursive: true });
  const textos = textosEnVozAlta();
  const huellas = new Map(textos.map((t) => [huellaAudio(t), t]));
  if (huellas.size !== textos.length) throw new Error('Dos textos con la misma huella: hay que cambiar de huella.');

  // Con otra voz u otra velocidad se regraba todo; lo que ya no suena en la app se borra.
  const mismaVoz = anterior.voz === voz && anterior.velocidad === VELOCIDAD;
  const grabados = new Set(mismaVoz ? anterior.archivos.filter((h) => huellas.has(h) && existsSync(resolve(CARPETA, `${h}.mp3`))) : []);
  const faltan = [...huellas].filter(([h]) => !grabados.has(h));
  console.log(`${textos.length} textos, ${grabados.size} ya grabados, faltan ${faltan.length} (${nombre}, ${VELOCIDAD}).`);

  // Antes de borrar nada, la clave y el primer audio: si la clave falta o Azure no responde, el audio de antes
  // sigue entero (al cambiar de voz se borraría todo antes de saber si se puede regrabar).
  const k = faltan.length > 0 ? clave() : '';
  const [primero] = faltan;
  const audioPrimero = primero ? await sintetizar(primero[1], voz, region, k) : null;

  for (const archivo of readdirSync(CARPETA)) {
    if (archivo.endsWith('.mp3') && !grabados.has(archivo.slice(0, -4))) rmSync(resolve(CARPETA, archivo));
  }
  const manifiesto = (): ManifiestoAudio => ({ voz, nombre, velocidad: VELOCIDAD, archivos: [...grabados] });
  // El manifiesto no puede apuntar a archivos borrados: la app intentaría tocarlos en vez de usar la voz del dispositivo.
  guardarManifiesto(manifiesto());
  if (!primero || !audioPrimero) return;

  let hechos = 0;
  for (const [huella, texto] of faltan) {
    writeFileSync(resolve(CARPETA, `${huella}.mp3`), huella === primero[0] ? audioPrimero : await sintetizar(texto, voz, region, k));
    grabados.add(huella);
    hechos++;
    // Se guarda cada poco: si se corta, la siguiente vez sigue donde lo dejó.
    if (hechos % 20 === 0) {
      guardarManifiesto(manifiesto());
      console.log(`${hechos}/${faltan.length}`);
    }
  }
  guardarManifiesto(manifiesto());
  console.log(`Hecho: ${hechos} audios nuevos con ${nombre}.`);
}

await principal();
