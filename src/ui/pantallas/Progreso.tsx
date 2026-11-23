// Cómo va cada parte: el nivel de cada regla (sacado de cada respuesta), lo
// que más se falla, lo visto, lo asentado (acertado a la primera en dos días
// distintos) y la actividad de las dos últimas semanas.

import type { ReactElement } from 'react';
import { useAhora } from '../../estado/useAhora';
import {
  asentada,
  clave,
  DIAS_PARA_ASENTAR,
  estimarNivel,
  MINIMO_PARA_NIVEL,
  racha,
  UMBRAL_DOMINADA,
  ultimosDias,
  type Datos,
  type EstadoDestreza,
  type Historial,
  type Pista,
} from '../../motor';
import { DESTREZAS, FALTA_PARA_B2, nombreDeDestreza } from '../../neerlandes/destrezas';

interface Props {
  readonly pistas: readonly Pista[];
  readonly datos: Datos;
  readonly niveles: ReadonlyMap<string, EstadoDestreza>;
}

function estadoDe(e: EstadoDestreza | undefined): { texto: string; clase: string } {
  if (!e || e.respuestas < MINIMO_PARA_NIVEL) return { texto: 'sin datos', clase: 'nivel--nada' };
  if (e.dominio >= UMBRAL_DOMINADA) return { texto: 'dominada', clase: 'nivel--alto' };
  if (e.dominio >= 0.45) return { texto: 'en camino', clase: 'nivel--medio' };
  return { texto: 'floja', clase: 'nivel--bajo' };
}

/** Las destrezas con más fallos diagnosticados en los últimos días, de más a menos. */
function masFalladas(historial: Historial, ahora: Date, dias = 14): [string, number][] {
  const desde = ahora.getTime() - dias * 86_400_000;
  const cuenta = new Map<string, number>();
  for (const r of historial) {
    if (r.t < desde) continue;
    for (const d of r.x ?? []) cuenta.set(d, (cuenta.get(d) ?? 0) + 1);
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

function Nivel({ niveles, historial, ahora }: { readonly niveles: ReadonlyMap<string, EstadoDestreza>; readonly historial: Historial; readonly ahora: Date }): ReactElement {
  const estimado = estimarNivel(DESTREZAS, niveles);
  const falladas = masFalladas(historial, ahora);
  const porNivel = [...new Set(DESTREZAS.map((d) => d.nivel))];
  const resumen =
    estimado.alcanzado === null && estimado.dominadasDelSiguiente === 0
      ? `Aún no hay reglas dominadas. Cada frase que escribes u ordenas cuenta.`
      : estimado.siguiente
        ? `${estimado.alcanzado ? `${estimado.alcanzado} dominado. ` : ''}${estimado.siguiente}: ${estimado.dominadasDelSiguiente} de ${estimado.totalDelSiguiente} reglas dominadas.`
        : `Todas las reglas de la app dominadas.`;
  return (
    <section className="tarjeta columna" style={{ gap: 12 }} aria-label="Tu nivel por regla">
      <div className="columna" style={{ gap: 4 }}>
        <h2>Tu nivel por regla</h2>
        <p className="texto-2">{resumen}</p>
      </div>

      {falladas.length > 0 ? (
        <div className="columna" style={{ gap: 4 }}>
          <span className="pequeno">Lo que más fallas (últimas dos semanas)</span>
          <ul className="lista-fallos">
            {falladas.map(([d, n]) => (
              <li key={d}>
                {nombreDeDestreza(d)} <span className="texto-3">· {n} {n === 1 ? 'vez' : 'veces'}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {porNivel.map((nivel) => (
        <div key={nivel} className="columna" style={{ gap: 8 }}>
          <span className="etiqueta-nivel">{nivel}</span>
          {DESTREZAS.filter((d) => d.nivel === nivel).map((d) => {
            const e = niveles.get(d.id);
            const estado = estadoDe(e);
            const porcentaje = e && e.respuestas >= MINIMO_PARA_NIVEL ? Math.round(e.dominio * 100) : 0;
            return (
              <div key={d.id} className="columna" style={{ gap: 4 }} title={d.descripcion}>
                <div className="fila fila--entre pequeno">
                  <span>{d.nombre}</span>
                  <span className="texto-3">
                    {estado.texto}
                    {e ? ` · ${e.respuestas}` : ''}
                  </span>
                </div>
                <div className={`barra-grupo ${estado.clase}`} role="meter" aria-label={d.nombre} aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje}>
                  <div style={{ width: `${porcentaje}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div className="columna" style={{ gap: 4 }}>
        <span className="etiqueta-nivel">B2</span>
        <p className="texto-3">Aún no está en la app: {FALTA_PARA_B2.map((f) => f.texto).join('; ')}.</p>
      </div>

      <p className="texto-3">
        Cada respuesta cuenta más si escribes la frase entera que si ordenas fichas, y lo reciente pesa más que lo antiguo. Si fallas con un error concreto, solo le cuenta a esa regla. Mide la gramática que produces, no la conversación ni el oído: el nivel es orientativo.
      </p>
    </section>
  );
}

export function Progreso({ pistas, datos, niveles }: Props): ReactElement {
  const ahora = useAhora();
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

      <Nivel niveles={niveles} historial={datos.historial} ahora={ahora} />

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
