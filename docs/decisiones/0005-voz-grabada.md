# 0005. Voz grabada con Azure dentro de la app

20 de noviembre de 2026. El dueño del repositorio encontró robótica la voz del iPhone y pidió las voces de Azure; la forma la decidió Claude.

## Qué se decidió

1. **Lo que la app lee en voz alta se graba una vez en el ordenador** con una voz neuronal de Azure (Fenna, `nl-NL-FennaNeural`, de momento), un 10 % más despacio de lo normal, y va dentro de la app en `public/audio`. La app no habla con Azure ni con ningún servidor: solo reproduce archivos.
2. **Cada archivo se llama por una huella del texto** (FNV-1a de 32 bits). `src/neerlandes/audio-manifiesto.json` dice qué hay grabado, con qué voz y a qué velocidad. Lo que no esté grabado lo lee la voz del dispositivo, la de más calidad que tenga (premium, luego mejorada) y nunca una de red.
3. **`npm run audio`** graba lo que falte y borra lo que ya no suena. Con `-- --voz <voz>` se cambia de voz y se regraba todo; con `-- --muestras <carpeta>` sale una frase con cada voz, para elegir. La clave se lee de `AZURE_SPEECH_KEY` o del llavero del Mac y nunca se guarda en archivos.
4. **La lista de textos sale de crear todos los ejercicios** con semillas fijas y cada forma de ejercicio (`src/neerlandes/audio-textos.ts`). Una prueba comprueba con otras semillas que no se escapa ninguno.
5. **«Más despacio»** en Ajustes reproduce lo grabado al 80 %, sin cambiar el tono.

## Por qué

- Las voces del sistema suenan a máquina, también las mejoradas; las neuronales de Azure suenan a persona.
- Grabada una vez, funciona sin conexión y no manda nada fuera de la app, como pide CLAUDE.md.
- Son unos 624 textos y 12.500 caracteres: cabe de sobra en la capa gratuita de Azure.

## Lo que hay que saber

- Si cambia el contenido (una frase nueva o corregida), hay que volver a lanzar `npm run audio`. Mientras tanto, esa frase la lee la voz del dispositivo.
- Por buena que sea, la voz es sintética: la pronunciación también queda pendiente de que la escuche una persona nativa, como el texto (`docs/revision.md`).
- Se usa la cuenta de Azure del dueño. Si algún día se publica la app, conviene repasar antes las condiciones de uso de Azure Speech.
