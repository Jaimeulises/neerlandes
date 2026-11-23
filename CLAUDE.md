# Instrucciones para Claude en este repositorio

Stap (nombre provisional) es una app personal para practicar neerlandés hablado: orden de la frase, verbos y vocabulario. Decide quien es dueño del repositorio; cuando no esté, decide tú y deja apuntado por qué en `docs/decisiones/`.

## Cómo trabajas

- Español directo, sin rayas (ni raya larga ni media) en código, textos, documentación ni commits: comas, dos puntos, paréntesis o puntos.
- Antes de un commit, en verde: `npm run check` (tipos, lint, pruebas y compilación).
- Cambios pequeños y commits que expliquen el porqué. Nunca un push forzado a `main`.
- No está publicada en ninguna web. En el iPhone se instala como app por cable (`npm run iphone`, ver `docs/decisiones/0005-app-de-iphone.md`); también se puede servir por la wifi (`npm run movil`, ver `docs/decisiones/0002-movil-sin-publicar.md`).
- Nada personal (nombres, familia, datos de contacto) en código, contenido, documentos ni commits: el repositorio ha sido público.

## Lo que no se hace nunca

- Guardar claves en archivos o en el chat.
- Copiar código, frases, textos, diseño o datos de otras apps o cursos de idiomas, ni material ajeno sin una licencia que lo permita.
- Añadir dependencias que recojan datos, muestren anuncios o hablen con servidores. Sin cuentas, sin anuncios, sin analítica.
- Dar por buena una frase «porque suena bien»: nadie del equipo es nativo. Todo el contenido pasa por `docs/revision.md` (`npm run revision`) y queda pendiente hasta que lo revisa una persona nativa.

## El neerlandés, con cuidado

- Todo el neerlandés en pantalla lleva `lang="nl"`. Dentro de un texto en español va entre «», que `ConNeerlandes` marca como neerlandés; lo citado en español o en inglés va entre “”. Lo comprueba `src/neerlandes/marcado.test.ts`.
- El significado en español de cada palabra es único en todo el vocabulario, para que cada ejercicio tenga una sola respuesta buena. Las demás formas válidas van en `otras`.
- Cada frase de orden lleva en `otras` las demás formas naturales de decirla: si falta una, el corrector suspende una respuesta buena.
- Los participios regulares siguen la regla de ’t kofschip y las pruebas lo comprueban; los irregulares van marcados.
- Lo regular se intenta sin enseñarlo antes; se presenta la regla al abrir su grupo (ver `docs/decisiones/0001-arranque.md`).
- `docs/revision.md` muestra solo lo pendiente, en lotes de unos 15 minutos que se llaman por sus códigos. Al terminar un lote se marca con la orden que lleva debajo de su título, tal como sale en la copia que se leyó (`npm run revisado -- O1-O9 R1 --lote 43ab45e2`; si no se terminó, solo con los códigos leídos): se apunta lo que decía esa copia, así que lo corregido después vuelve solo a pendiente y sale en el lote siguiente para confirmarlo (decisión 0007). Los códigos no se reutilizan: lo nuevo lleva el siguiente número (`ULTIMO_CODIGO`) y lo borrado va a `RETIRADOS`, en `src/neerlandes/ids-fijos.ts`.

## Dónde va cada cosa

- `src/motor/`: no sabe de idiomas ni de pantallas (el lint lo impide). Viene de Michi.
- `src/neerlandes/`: contenido y reglas del neerlandés. Los datos, en `*/datos.ts`.
- `src/ui/`: pantallas y componentes. Colores y letras solo desde `src/ui/estilos/tokens.css`.
- `docs/decisiones/`: una nota corta por cada decisión que otro tenga que entender después.
- `public/`: icono (`icono.svg`; los PNG se sacan de él) y manifiesto para añadirla a la pantalla de inicio.
- `docs/revision.md`: se genera; no se edita a mano.
- `ios/`: el proyecto de Xcode de Capacitor. `ios/App/App/public` se copia de `dist/` al compilar y no se edita.
- `public/audio/` y `src/neerlandes/audio-manifiesto.json`: el audio grabado (decisión 0006). Los escribe `npm run audio`; no se editan a mano. Si cambia el contenido, se vuelve a lanzar.
