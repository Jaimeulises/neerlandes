// Ajustes: el tamaño de la ronda, lo nuevo por ronda, la voz, qué ejercicios
// salen y la copia de seguridad. Restaurar una copia y borrar el progreso piden
// confirmación en la propia pantalla: los dos sustituyen todo lo de ahora.

import { useRef, useState, type ReactElement } from 'react';
import { VERSION_APP } from '../../estado/app';
import { NOMBRES_FORMA, NOMBRES_TIEMPO_DECIR, NUEVOS_POR_RONDA, TAMANOS_RONDA, TIEMPOS_DECIR, type Ajustes as DatosAjustes, type Forma } from '../../estado/ajustes';
import { exportarCopia, leerCopia, MENSAJE_DE_ENTREGA, type CopiaLeida } from '../../estado/copia';
import type { Voz } from '../../estado/voz';
import { CopiaIlegible, HISTORIAL_VACIO, PROGRESO_VACIO, TODAS_LAS_FORMAS, type Datos } from '../../motor';
import { FRASE_DE_PRUEBA } from '../../neerlandes/audio';
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

/** «3 cosas vistas y 12 respuestas», para comparar una copia con lo que hay en el dispositivo. */
function resumen(d: Datos): string {
  const vistas = d.progreso.size;
  const respuestas = d.historial.length;
  return `${String(vistas)} ${vistas === 1 ? 'cosa vista' : 'cosas vistas'} y ${String(respuestas)} ${respuestas === 1 ? 'respuesta' : 'respuestas'}`;
}

function Segmentos<T extends string | number>({
  valores,
  actual,
  etiqueta,
  nombre,
  ancho = false,
  onElegir,
}: {
  valores: readonly T[];
  actual: T;
  etiqueta: string;
  nombre?: (v: T) => string;
  ancho?: boolean;
  onElegir: (v: T) => void;
}): ReactElement {
  return (
    <div className={ancho ? 'segmentos segmentos--ancho' : 'segmentos'} role="group" aria-label={etiqueta}>
      {valores.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === actual}
          onClick={() => {
            onElegir(v);
          }}
        >
          {nombre ? nombre(v) : v}
        </button>
      ))}
    </div>
  );
}

export function Ajustes({ ajustes, voz, hayVozEnElDispositivo, datos, onCambiar, onReemplazar }: Props): ReactElement {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [porRestaurar, setPorRestaurar] = useState<CopiaLeida | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  // Sin voz no hay dictado: no cuenta como forma elegida y no puede quedarse sola.
  const sale = (f: Forma): boolean => f !== 'dictado' || voz.disponible;
  const elegidas = ajustes.formas.filter(sale);

  const cambiarForma = (forma: Forma, activa: boolean): void => {
    const formas = activa ? [...new Set([...ajustes.formas, forma])] : ajustes.formas.filter((f) => f !== forma);
    if (!formas.some(sale)) return;
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
    // Otro archivo retira la confirmación del anterior: si este no vale, no debe quedar a mano un
    // «Restaurar» que restauraría el otro.
    setPorRestaurar(null);
    setMensaje(null);
    try {
      // Se lee y se enseña antes de restaurar: elegir el archivo equivocado no debe borrar nada.
      setPorRestaurar(leerCopia(await elegido.text()));
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
        <label className="ajuste">
          <span>Abrir todos los grupos</span>
          <input
            type="checkbox"
            className="interruptor"
            checked={ajustes.gruposAbiertos}
            aria-describedby="explica-grupos"
            onChange={(e) => {
              onCambiar({ ...ajustes, gruposAbiertos: e.target.checked });
            }}
          />
        </label>
        <p id="explica-grupos" className="texto-2 pequeno">
          Para quien ya conoce lo básico. Cada ronda abre como mucho un grupo nuevo de cada parte (orden, verbos y vocabulario) sin esperar a ver entero el anterior; en orden y en verbos, empezando por su regla. Lo nuevo de orden y de verbos se escribe en vez de ordenarse con fichas o elegirse, salvo que su regla esté floja.
        </p>
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
                  voz.decir(FRASE_DE_PRUEBA);
                }}
              >
                Probar
              </Boton>
            </div>
          </>
        ) : (
          <p className="texto-2 pequeno" style={{ marginTop: 8 }}>
            Este dispositivo no tiene voz neerlandesa propia (las de internet no se usan, para no enviar nada fuera). En iPhone se añade en Ajustes, Accesibilidad, Contenido leído, Voces, Neerlandés. Sin voz no hay dictado.
          </p>
        )}
      </section>

      <section className="tarjeta">
        <h2>Ejercicios en los repasos</h2>
        <p className="texto-2 pequeno" style={{ marginTop: 8 }}>
          Lo nuevo suele empezar con fichas en las frases y los separables y eligiendo o completando la forma en los verbos; con “Abrir todos los grupos”, se escribe, salvo que su regla esté floja. Las palabras empiezan siempre por “¿Qué significa?”, también con ese ajuste: no salen de ninguna regla, y una palabra hay que reconocerla antes de escribirla. Aquí eliges qué más sale en los repasos. Si ninguna de las elegidas sirve para un ejercicio, sale el de siempre: fichas en las frases y los separables, completar en los verbos y escribir la palabra en el vocabulario.
        </p>
        {ORDEN_FORMAS.map((forma) => (
          <label key={forma} className="ajuste">
            <span>
              {NOMBRES_FORMA[forma]}
              {sale(forma) ? '' : ' (necesita la voz)'}
            </span>
            <input
              type="checkbox"
              className="interruptor"
              checked={elegidas.includes(forma)}
              disabled={!sale(forma) || (elegidas.length === 1 && elegidas.includes(forma))}
              onChange={(e) => {
                cambiarForma(forma, e.target.checked);
              }}
            />
          </label>
        ))}
        <div className="ajuste ajuste--apilado">
          <span>Tiempo para decir la frase</span>
          <Segmentos
            valores={TIEMPOS_DECIR}
            actual={ajustes.tiempoDecir}
            etiqueta="Tiempo para decir la frase"
            nombre={(t) => NOMBRES_TIEMPO_DECIR[t]}
            ancho
            onElegir={(t) => {
              onCambiar({ ...ajustes, tiempoDecir: t });
            }}
          />
          <p className="texto-2 pequeno">
            Normal da el tiempo de leer el español y decir la frase, algo menos si la regla ya la dominas y más si está floja. Con calma, la mitad más. Sin cuenta atrás, la frase sale cuando la pidas.
          </p>
        </div>
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
        {porRestaurar ? (
          <>
            <p className="texto-2 pequeno">
              Copia {porRestaurar.creadaEl ? `del ${porRestaurar.creadaEl.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'sin fecha'}: {resumen(porRestaurar.datos)}. Ahora en
              este dispositivo: {resumen(datos)}. Si la restauras, lo de ahora se sustituye y no se puede recuperar.
            </p>
            <div className="fila">
              <Boton
                variante="secundario"
                onClick={() => {
                  setPorRestaurar(null);
                }}
              >
                Cancelar
              </Boton>
              <Boton
                variante="peligro"
                onClick={() => {
                  setPorRestaurar(null);
                  void onReemplazar(porRestaurar.datos).then(() => {
                    setMensaje('Copia restaurada.');
                  });
                }}
              >
                Restaurar
              </Boton>
            </div>
          </>
        ) : null}
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
