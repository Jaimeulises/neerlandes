// Ajustes: el tamaño de la ronda, lo nuevo por ronda, la voz, qué ejercicios
// salen y la copia de seguridad. Borrar el progreso pide confirmación en la
// propia pantalla.

import { useRef, useState, type ReactElement } from 'react';
import { VERSION_APP } from '../../estado/app';
import { NOMBRES_FORMA, NUEVOS_POR_RONDA, TAMANOS_RONDA, type Ajustes as DatosAjustes, type Forma } from '../../estado/ajustes';
import { exportarCopia, leerCopia, MENSAJE_DE_ENTREGA } from '../../estado/copia';
import type { Voz } from '../../estado/voz';
import { CopiaIlegible, HISTORIAL_VACIO, PROGRESO_VACIO, TODAS_LAS_FORMAS, type Datos } from '../../motor';
import { Boton } from '../componentes/Boton';

interface Props {
  readonly ajustes: DatosAjustes;
  readonly voz: Voz;
  readonly hayVozEnElDispositivo: boolean;
  readonly datos: Datos;
  readonly onCambiar: (ajustes: DatosAjustes) => void;
  readonly onReemplazar: (datos: Datos) => Promise<void>;
}

const ORDEN_FORMAS: readonly Forma[] = ['traducir', 'completar', 'ordenar', 'decir', 'dictado', 'opcion'];

function Segmentos<T extends number>({ valores, actual, etiqueta, onElegir }: { valores: readonly T[]; actual: T; etiqueta: string; onElegir: (v: T) => void }): ReactElement {
  return (
    <div className="segmentos" role="group" aria-label={etiqueta}>
      {valores.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === actual}
          onClick={() => {
            onElegir(v);
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export function Ajustes({ ajustes, voz, hayVozEnElDispositivo, datos, onCambiar, onReemplazar }: Props): ReactElement {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  const cambiarForma = (forma: Forma, activa: boolean): void => {
    const formas = activa ? [...new Set([...ajustes.formas, forma])] : ajustes.formas.filter((f) => f !== forma);
    if (formas.length === 0) return;
    onCambiar({ ...ajustes, formas: ORDEN_FORMAS.filter((f) => formas.includes(f) && TODAS_LAS_FORMAS.has(f)) });
  };

  const exportar = async (): Promise<void> => {
    try {
      setMensaje(MENSAJE_DE_ENTREGA[await exportarCopia(datos, new Date())]);
    } catch {
      setMensaje('No se ha podido sacar la copia.');
    }
  };

  const importar = async (lista: FileList | null): Promise<void> => {
    const elegido = lista?.[0];
    if (!elegido) return;
    try {
      const copia = leerCopia(await elegido.text());
      await onReemplazar(copia);
      setMensaje('Copia restaurada.');
    } catch (e) {
      setMensaje(e instanceof CopiaIlegible ? `Esa copia no vale: ${e.message}.` : 'No se ha podido leer el archivo.');
    }
  };

  return (
    <div className="columna">
      <header className="cabecera">
        <h1>Ajustes</h1>
      </header>

      <section className="tarjeta">
        <div className="ajuste">
          <span>Ejercicios por ronda</span>
          <Segmentos
            valores={TAMANOS_RONDA}
            actual={ajustes.tamanoRonda as (typeof TAMANOS_RONDA)[number]}
            etiqueta="Ejercicios por ronda"
            onElegir={(v) => {
              onCambiar({ ...ajustes, tamanoRonda: v });
            }}
          />
        </div>
        <div className="ajuste">
          <span>Cosas nuevas por ronda</span>
          <Segmentos
            valores={NUEVOS_POR_RONDA}
            actual={ajustes.nuevosPorRonda as (typeof NUEVOS_POR_RONDA)[number]}
            etiqueta="Cosas nuevas por ronda"
            onElegir={(v) => {
              onCambiar({ ...ajustes, nuevosPorRonda: v });
            }}
          />
        </div>
      </section>

      <section className="tarjeta">
        <h2>Voz</h2>
        {hayVozEnElDispositivo ? (
          <>
            <label className="ajuste">
              <span>Leer en voz alta</span>
              <input
                type="checkbox"
                className="interruptor"
                checked={ajustes.voz}
                onChange={(e) => {
                  onCambiar({ ...ajustes, voz: e.target.checked });
                }}
              />
            </label>
            <label className="ajuste">
              <span>Más despacio</span>
              <input
                type="checkbox"
                className="interruptor"
                checked={ajustes.vozLenta}
                onChange={(e) => {
                  onCambiar({ ...ajustes, vozLenta: e.target.checked });
                }}
              />
            </label>
            <div className="ajuste">
              <span className="texto-3">{voz.nombre ?? ''}</span>
              <Boton
                variante="secundario"
                disabled={!voz.disponible}
                onClick={() => {
                  voz.decir('Goedemorgen! Hoe gaat het met je?');
                }}
              >
                Probar
              </Boton>
            </div>
          </>
        ) : (
          <p className="texto-2 pequeno" style={{ marginTop: 8 }}>
            Este dispositivo no tiene voz neerlandesa. En iPhone se añade en Ajustes, Accesibilidad, Contenido leído, Voces, Neerlandés. Sin voz no hay dictado.
          </p>
        )}
      </section>

      <section className="tarjeta">
        <h2>Ejercicios</h2>
        {ORDEN_FORMAS.map((forma) => (
          <label key={forma} className="ajuste">
            <span>{NOMBRES_FORMA[forma]}</span>
            <input
              type="checkbox"
              className="interruptor"
              checked={ajustes.formas.includes(forma)}
              disabled={ajustes.formas.length === 1 && ajustes.formas.includes(forma)}
              onChange={(e) => {
                cambiarForma(forma, e.target.checked);
              }}
            />
          </label>
        ))}
      </section>

      <section className="tarjeta columna" style={{ gap: 10 }}>
        <h2>Copia de seguridad</h2>
        <p className="texto-2 pequeno">El progreso solo vive en este dispositivo. Saca una copia de vez en cuando.</p>
        <p className="texto-2 pequeno">
          En el móvil, añádela a la pantalla de inicio (en Safari: Compartir, Añadir a pantalla de inicio). Así se abre como una app y el navegador no borra el progreso si pasas unos días sin abrirla.
        </p>
        <div className="fila fila--envuelve">
          <Boton variante="secundario" onClick={() => void exportar()}>
            Sacar copia
          </Boton>
          <Boton
            variante="secundario"
            onClick={() => {
              archivo.current?.click();
            }}
          >
            Restaurar copia
          </Boton>
          <input
            ref={archivo}
            type="file"
            accept="application/json,.json"
            className="oculto-visual"
            aria-label="Archivo de copia"
            onChange={(e) => {
              void importar(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
        {mensaje ? (
          <p className="texto-2 pequeno" aria-live="polite">
            {mensaje}
          </p>
        ) : null}
      </section>

      <section className="tarjeta columna" style={{ gap: 10 }}>
        <h2>Empezar de cero</h2>
        {confirmarBorrado ? (
          <>
            <p className="texto-2 pequeno">Se borra todo el progreso de este dispositivo. Si quieres guardarlo, saca antes una copia.</p>
            <div className="fila">
              <Boton
                variante="secundario"
                onClick={() => {
                  setConfirmarBorrado(false);
                }}
              >
                Cancelar
              </Boton>
              <Boton
                variante="peligro"
                onClick={() => {
                  setConfirmarBorrado(false);
                  void onReemplazar({ progreso: PROGRESO_VACIO, historial: HISTORIAL_VACIO }).then(() => {
                    setMensaje('Progreso borrado.');
                  });
                }}
              >
                Borrar todo
              </Boton>
            </div>
          </>
        ) : (
          <Boton
            variante="peligro"
            onClick={() => {
              setConfirmarBorrado(true);
            }}
          >
            Borrar el progreso
          </Boton>
        )}
      </section>

      <p className="texto-3">Stap {VERSION_APP}. Sin cuentas, sin anuncios y sin enviar nada fuera del dispositivo.</p>
    </div>
  );
}
