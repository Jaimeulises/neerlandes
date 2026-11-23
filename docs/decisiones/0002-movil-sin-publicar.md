# 0002. Usarla en el móvil sin publicarla

19 de noviembre de 2026. Decidido por el dueño del repositorio, a propuesta de Claude.

## Qué se decidió

1. **Código privado y sin web publicada, de momento.** Se preparó la publicación en GitHub Pages, pero Pages con un repositorio privado es de pago, y el dueño prefirió tener el código privado sin pagar. Si algún día se publica, basta con recuperar el flujo de Pages del historial (commit «Publicar la app en GitHub Pages…»).
2. **En el móvil se usa servida desde el ordenador** por la wifi de casa: `npm run movil` compila y la sirve en el puerto 5181 para toda la red.
3. **Siempre con el nombre del ordenador en la red** (`http://nombre.local:5181`), nunca con la IP. El navegador guarda el progreso por dirección: si la IP cambia, el móvil empezaría de cero. Vite solo acepta nombres `.local`, `localhost` e IP (`allowedHosts`), para que otra web no pueda hablar con el servidor.
4. **Se queda lo que ya servía para el móvil**: manifiesto e icono propio para añadirla a la pantalla de inicio, y la petición de almacenamiento persistente (solo funciona con https; por la wifi de casa no hace nada y no estorba).

## Por qué

- En iPhone, Safari borra lo que guarda una web que no se abre en siete días; una web añadida a la pantalla de inicio cuenta sus propios días de uso. Ajustes lo explica junto a la copia de seguridad.

## Qué queda abierto

- Usarla fuera de casa: publicarla (Pages con GitHub Pro, u otro alojamiento) o instalarla en el móvil con Capacitor. *Resuelto con Capacitor en la decisión 0005.*
- Que funcione sin conexión (con un service worker).
