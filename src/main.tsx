import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/estilos/tokens.css';
import './ui/estilos/base.css';
import './ui/estilos/componentes.css';
import { App } from './ui/App';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Falta #raiz en index.html');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
