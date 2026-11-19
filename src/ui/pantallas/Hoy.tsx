// La pantalla de inicio: la ronda de hoy, que mezcla todo, y cada pista por
// separado con lo que tiene pendiente.

import type { ReactElement } from 'react';
import { diaDe, racha, respuestasHoy, resumirPista, vistosPorPista, type Datos, type Pista } from '../../motor';
import { Boton } from '../componentes/Boton';

interface Props {
  readonly pistas: readonly Pista[];
  readonly datos: Datos;
  readonly onEmpezar: (pistas: readonly Pista[]) => void;
}

export function Hoy({ pistas, datos, onEmpezar }: Props): ReactElement {
  const ahora = new Date();
  const vistos = vistosPorPista(pistas, datos.progreso);
  const resumenes = pistas.map((p) => ({ pista: p, resumen: resumirPista(p, datos.progreso, ahora, vistos) }));
  const pendientes = resumenes.reduce((s, r) => s + r.resumen.paraRepasar, 0);
  const nuevas = resumenes.reduce((s, r) => s + r.resumen.nuevosDisponibles, 0);
  const dias = racha(datos.historial, ahora);
  const hoy = respuestasHoy(datos.historial, ahora);
  const primeraVez = datos.historial.length === 0;

  return (
    <div className="columna">
      <header className="cabecera columna" style={{ gap: 4 }}>
        <h1>Stap</h1>
        <p className="texto-2">{primeraVez ? 'Neerlandés para hablarlo, frase a frase.' : `Hoy, ${diaDe(ahora).split('-').reverse().join('/')}`}</p>
      </header>

      <section className="tarjeta tarjeta--destacada columna">
        <h2>Ronda de hoy</h2>
        <p className="texto-2">
          {pendientes > 0 ? `${pendientes} por repasar` : 'Nada pendiente de repaso'}
          {nuevas > 0 ? ` y cosas nuevas de las tres partes.` : '.'}
        </p>
        <Boton
          ancho
          variante="claro"
          onClick={() => {
            onEmpezar(pistas);
          }}
        >
          {primeraVez ? 'Empezar' : 'Empezar la ronda'}
        </Boton>
      </section>

      <div className="cifras">
        <div className="cifra">
          <strong>{dias}</strong>
          <span className="texto-3">{dias === 1 ? 'día seguido' : 'días seguidos'}</span>
        </div>
        <div className="cifra">
          <strong>{hoy}</strong>
          <span className="texto-3">respuestas hoy</span>
        </div>
      </div>

      {resumenes.map(({ pista, resumen }) => (
        <section key={pista.id} className="tarjeta columna" style={{ gap: 10 }}>
          <div className="fila fila--entre">
            <h2>{pista.nombre}</h2>
            <span className="texto-3">
              {resumen.vistos}/{resumen.total}
            </span>
          </div>
          <p className="texto-2 pequeno">{pista.descripcion}</p>
          <div className="fila fila--entre">
            <span className="texto-3">
              {resumen.paraRepasar} por repasar · {resumen.nuevosDisponibles} {resumen.nuevosDisponibles === 1 ? 'nueva' : 'nuevas'}
            </span>
            <Boton
              variante="secundario"
              onClick={() => {
                onEmpezar([pista]);
              }}
            >
              Practicar
            </Boton>
          </div>
        </section>
      ))}

      <p className="aviso">
        El contenido lo ha escrito una IA y está pendiente de revisión por una persona nativa. Si algo suena raro, apúntalo para corregirlo.
      </p>
    </div>
  );
}
