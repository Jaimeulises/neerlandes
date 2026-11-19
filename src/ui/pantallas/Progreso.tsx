// Cómo va cada parte: lo visto, lo asentado (acertado a la primera en dos días
// distintos) y la actividad de las dos últimas semanas.

import type { ReactElement } from 'react';
import { asentada, clave, DIAS_PARA_ASENTAR, racha, ultimosDias, type Datos, type Pista } from '../../motor';

interface Props {
  readonly pistas: readonly Pista[];
  readonly datos: Datos;
}

export function Progreso({ pistas, datos }: Props): ReactElement {
  const ahora = new Date();
  const dias = ultimosDias(datos.historial, ahora, 14);
  const maximo = Math.max(1, ...dias.map((d) => d.respuestas));
  const total = datos.historial.length;
  const aciertos = datos.historial.filter((r) => r.c !== 'otra_vez').length;

  return (
    <div className="columna">
      <header className="cabecera">
        <h1>Progreso</h1>
      </header>

      <div className="cifras">
        <div className="cifra">
          <strong>{racha(datos.historial, ahora)}</strong>
          <span className="texto-3">días seguidos</span>
        </div>
        <div className="cifra">
          <strong>{total === 0 ? '0 %' : `${Math.round((aciertos / total) * 100)} %`}</strong>
          <span className="texto-3">de aciertos</span>
        </div>
      </div>

      <section className="tarjeta columna" style={{ gap: 10 }}>
        <h2>Últimas dos semanas</h2>
        <div className="dias" aria-label="Respuestas por día">
          {dias.map((d) => (
            <div key={d.dia} data-vacio={d.respuestas === 0} style={{ height: `${Math.max(2, Math.round((d.respuestas / maximo) * 100))}%` }} title={`${d.dia}: ${d.respuestas}`} />
          ))}
        </div>
      </section>

      {pistas.map((pista) => {
        const tarjetas = pista.elementos.map((e) => datos.progreso.get(clave(pista.id, e.id)));
        const vistos = tarjetas.filter((t) => t !== undefined).length;
        const asentados = tarjetas.filter((t) => t !== undefined && asentada(t)).length;
        return (
          <section key={pista.id} className="tarjeta columna" style={{ gap: 12 }}>
            <div className="fila fila--entre">
              <h2>{pista.nombre}</h2>
              <span className="texto-3">
                {asentados} asentadas · {vistos}/{pista.elementos.length} vistas
              </span>
            </div>
            {pista.grupos.map((grupo) => {
              const delGrupo = pista.elementos.filter((e) => e.grupo === grupo);
              const vistosGrupo = delGrupo.filter((e) => datos.progreso.has(clave(pista.id, e.id))).length;
              return (
                <div key={grupo} className="columna" style={{ gap: 4 }}>
                  <div className="fila fila--entre pequeno">
                    <span>{pista.nombresDeGrupo?.[grupo] ?? grupo}</span>
                    <span className="texto-3">
                      {vistosGrupo}/{delGrupo.length}
                    </span>
                  </div>
                  <div className="barra-grupo">
                    <div style={{ width: `${Math.round((vistosGrupo / Math.max(1, delGrupo.length)) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      <p className="texto-3">
        Asentada: acertada a la primera en al menos {DIAS_PARA_ASENTAR} días distintos. Los grupos se abren en orden, cuando has visto todo el anterior.
      </p>
    </div>
  );
}
