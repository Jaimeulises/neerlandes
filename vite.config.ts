/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: la compilación funciona igual servida en una subcarpeta o abierta desde el móvil.
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  // En el móvil se abre desde el ordenador por la wifi de casa, con su nombre en la red
  // (http://nombre-del-ordenador.local:5181). Siempre el mismo puerto y el mismo nombre: el progreso
  // se guarda por dirección, y con otra dirección el móvil empezaría de cero.
  server: { port: 5181, strictPort: true, allowedHosts: ['.local'] },
  preview: { port: 5181, strictPort: true, allowedHosts: ['.local'] },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
  },
});
