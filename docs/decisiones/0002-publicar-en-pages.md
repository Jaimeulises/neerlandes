# 0002. Publicarla en GitHub Pages para usarla en el móvil

19 de noviembre de 2026. Decidido por el dueño del repositorio, a propuesta de Claude.

## Qué se decidió

1. Cada vez que algo entra en `main`, un flujo de GitHub Actions lo comprueba entero (`npm run check`) y publica `dist/` en GitHub Pages. Si algo falla, no se publica.
2. La app es estática y guarda todo en el navegador: publicarla no añade servidores, cuentas ni datos que salgan del móvil.
3. Para usarla como una app se añade a la pantalla de inicio. Lleva manifiesto e icono propios (`public/icono.svg`; los PNG se sacan de él) y pide al navegador almacenamiento persistente.

## Por qué

- Sin una web publicada, usarla en el móvil exige el ordenador encendido en la misma wifi, y eso acaba con la costumbre diaria.
- En iPhone, Safari borra lo que guarda una web que no se abre en siete días; una web añadida a la pantalla de inicio cuenta sus propios días de uso. Ajustes lo explica junto a la copia de seguridad.

## Qué queda abierto

- Que funcione sin conexión (con un service worker).
- Activar Pages en el repositorio, con «GitHub Actions» como origen: es un ajuste de GitHub que hace el dueño.
