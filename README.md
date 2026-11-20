# Stap

App personal para practicar neerlandés hablado (el nombre es provisional). Está pensada para quien ya entiende bastante pero, al hablar, pone las palabras en el orden del inglés y conjuga a medias.

Tiene tres partes, y en cada una los grupos se abren en orden:

- **Orden de la frase**: inversión, verbos modales, perfectum, separables, niet y geen, preguntas y subordinadas. La regla se ve una vez, al abrir el grupo; cada frase se intenta primero con fichas y, en los repasos, se escribe entera desde el español, se dice en voz alta o se escribe al oído.
- **Verbos**: presente, perfectum regular e irregular con hebben o zijn, separables y pasado simple.
- **Vocabulario**: palabras de la vida diaria, siempre con su de o het.

El repaso es espaciado (FSRS): lo que fallas vuelve antes. El corrector de frases escritas no perdona una letra de más o de menos en el verbo, pero sí las mayúsculas, la puntuación y las tildes, y distingue «están todas las palabras, pero en otro orden» de «has dicho otra cosa».

Sin cuentas, sin anuncios y sin enviar nada fuera del dispositivo: el progreso se guarda en el dispositivo y se puede sacar una copia desde Ajustes.

> El contenido lo ha escrito una IA y está pendiente de revisión por una persona nativa. Está todo en [docs/revision.md](docs/revision.md), numerado para apuntar correcciones.

## Instalarla en el iPhone

Se instala como app por cable desde un Mac con Xcode (ver [docs/decisiones/0004-app-de-iphone.md](docs/decisiones/0004-app-de-iphone.md)).

```sh
npm ci          # la primera vez
npm run iphone  # compila, firma con la cuenta de Apple de Xcode y la instala en el iPhone conectado
```

El iPhone tiene que estar conectado, desbloqueado y con el modo de desarrollador activo. Con una cuenta de Apple gratuita la instalación caduca a los siete días: se vuelve a lanzar `npm run iphone` y el progreso se conserva. La app guarda su progreso aparte del de Safari; para pasarlo de una a otra, Sacar copia y Restaurar copia en Ajustes.

## Usarla en el móvil por la wifi

No está publicada: también se puede servir desde el ordenador por la wifi de casa, si el ordenador acepta conexiones entrantes.

```sh
npm ci          # la primera vez
npm run movil   # compila y la sirve en el puerto 5181 para toda la red de casa
```

En el móvil, ábrela siempre con el nombre del ordenador en la red, por ejemplo `http://mi-mac.local:5181` (en un Mac está en Ajustes del Sistema, General, Compartir, «Nombre del host local»). El progreso se guarda por dirección: si un día entras por la IP, el móvil empezaría de cero. Después, en Safari: Compartir, Añadir a pantalla de inicio. Saca una copia desde Ajustes de vez en cuando.

## Probarla en local

Hace falta Node 22.

```sh
npm ci
npm run dev   # http://localhost:5181, se recarga al cambiar el código
```

Para que lea las frases en voz alta, el dispositivo necesita una voz neerlandesa (en iPhone: Ajustes, Accesibilidad, Contenido leído, Voces, Neerlandés). Sin voz no hay dictado; lo demás funciona igual.

## Antes de subir un cambio

```sh
npm run check     # tipos, lint, pruebas y compilación
npm run revision  # si cambia el contenido: vuelve a generar docs/revision.md
```

## Cómo está hecha

- `src/motor/`: rondas, repaso espaciado, historial, rachas, copias de seguridad y corrector de frases. No sabe de idiomas. Viene de Michi, una app de japonés del mismo autor.
- `src/neerlandes/`: el contenido (`*/datos.ts`) y cómo se convierte en ejercicios.
- `src/ui/`: pantallas en React.
- `docs/decisiones/`: por qué está hecha así.
