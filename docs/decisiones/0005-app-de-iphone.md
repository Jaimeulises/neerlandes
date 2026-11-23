# 0005. Instalarla en el iPhone como app

20 de noviembre de 2026. El dueño del repositorio pidió tenerla instalada en el iPhone; la forma la decidió Claude.

## Qué se decidió

1. **Stap se empaqueta como app de iPhone con Capacitor** (`capacitor.config.json` y la carpeta `ios/`), sin plugins: es la misma web dentro de un visor nativo. No añade cuentas, analítica ni servidores.
2. **Se instala por cable con `npm run iphone`** (`scripts/iphone.sh`): compila, firma con la cuenta de Apple que haya en Xcode y la instala en el iPhone conectado. Ni la cuenta ni el equipo de firma se guardan en el repositorio: el script los lee del llavero.
3. **Identificador `es.stap.neerlandes`**, nombre «Stap».
4. **Icono**: el de `public/icono.svg`, cuadrado y sin esquinas redondeadas (iOS pone las suyas), en `ios/App/App/Assets.xcassets/AppIcon.appiconset/`. La pantalla de arranque es lisa, con el color de fondo del sistema (claro u oscuro); se quitó la imagen de ejemplo de Capacitor.
5. **`npm run movil` se queda** para usarla por la wifi (decisión 0002).

## Por qué

- Servirla por la wifi depende de que el ordenador acepte conexiones entrantes, y no siempre se puede: un cortafuegos gestionado lo impide. Además pide el ordenador encendido y estar en la misma red.
- Instalada como app funciona sin conexión y fuera de casa, sin el ordenador.
- Capacitor ya se usa en Michi, de donde viene el motor, con la misma versión (8.6.0).
- Probado en el simulador antes de instalarla: dentro de la app funcionan compartir la copia de seguridad (Web Share con archivos), la voz neerlandesa y el guardado en IndexedDB.

## Lo que hay que saber

- **Con una cuenta de Apple gratuita la firma caduca a los siete días**: la app deja de abrirse hasta que se vuelve a instalar con `npm run iphone`. El progreso se conserva, porque se instala encima de la misma app. Con el programa de desarrolladores de pago dura un año.
- **La pantalla Hoy dice cuándo caduca la firma** y, a dos días o menos, pide reinstalar. `npm run iphone` deja la fecha del perfil en `firma.json`, dentro de la app; en el navegador no hay archivo y no sale nada.
- **La app guarda su progreso aparte del de Safari** (su dirección es `capacitor://localhost`). Para pasar el progreso de una a otra: Ajustes, Sacar copia, y en la otra, Restaurar copia.
- Después de cambiar el código hay que volver a lanzar `npm run iphone`; la app no se actualiza sola.
- **La telemetría de la CLI de Capacitor va apagada**: `npm run iphone` lanza `npx cap telemetry off` antes de compilar (se apaga para todo el ordenador), por la regla de no llevar analítica.
- Lo de `ios/App/App/public` se copia de `dist/` en cada compilación y no se guarda en git.

## Qué queda abierto

- Publicarla en TestFlight o en la App Store (pide la cuenta de pago).
- Android: no está preparado.
