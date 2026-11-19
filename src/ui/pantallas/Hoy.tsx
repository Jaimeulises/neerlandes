// La pantalla de inicio: la ronda de hoy, que mezcla todo, y cada pista por
// separado con lo que tiene pendiente.

import type { ReactElement } from 'react';
import { preverRonda } from '../../estado/ronda';
import { useAhora } from '../../estado/useAhora';
import { diaDe, racha, respuestasHoy, resumirPista, vistosPorPista, type Datos, type OpcionesRonda, type Pista } from '../../motor';
import { Boton } from '../componentes/Boton';

interface Props {
  readonly pistas: readonly Pista[];
  readonly datos: Datos;
  /** Las opciones con que se construirá la ronda de hoy, para decir qué traerá. */
  readonly opciones: OpcionesRonda;
  readonly onEmpezar: (pistas: readonly Pista[]) => void;
}

/** Lo que trae la ronda de hoy, dicho como se dice: «3 repasos y 4 cosas nuevas». */
export function textoDeRonda(repasos: number, nuevos: number, pendientes: number): string {
  if (repasos + nuevos === 0) return 'Nada pendiente por hoy.';
  const partes = [repasos > 0 ? `${String(repasos)} ${repasos === 1 ? 'repaso' : 'repasos'}` : '', nuevos > 0 ? `${String(nuevos)} ${nuevos === 1 ? 'cosa nueva' : 'cosas nuevas'}` : ''];
  const quedan = pendientes - repasos;
  return `${partes.filter((p) => p !== '').join(' y ')}.${quedan > 0 ? ` ${quedan === 1 ? 'Queda' : 'Quedan'} ${String(quedan)} por repasar para otra ronda.` : ''}`;
}

export function Hoy({ pistas, datos, opciones, onEmpezar }: Props): ReactElement {
  const ahora = useAhora();
  const vistos = vistosPorPista(pistas, datos.progreso);
  const resumenes = pistas.map((p) => ({ pista: p, resumen: resumirPista(p, datos.progreso, ahora, vistos) }));
  const pendientes = resumenes.reduce((s, r) => s + r.resumen.paraRepasar, 0);
  const prevision = preverRonda(pistas, datos.progreso, ahora, opciones);
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
        <p className="texto-2">{textoDeRonda(prevision.repasos, prevision.nuevos, pendientes)}</p>
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
