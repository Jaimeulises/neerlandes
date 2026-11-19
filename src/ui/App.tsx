// La app: carga el progreso, enseña Hoy, Progreso o Ajustes, y abre las
// rondas a pantalla completa.

import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { almacenDelDispositivo } from '../almacen/indexeddb';
import { formasActivas, guardarAjustes, leerAjustes, type Ajustes as DatosAjustes } from '../estado/ajustes';
import { useDatos } from '../estado/useDatos';
import { useVoz } from '../estado/voz';
import { HISTORIAL_VACIO, PROGRESO_VACIO, type Almacen, type Pista } from '../motor';
import { PISTAS } from '../neerlandes/paquete';
import { Boton } from './componentes/Boton';
import { Ajustes } from './pantallas/Ajustes';
import { Hoy } from './pantallas/Hoy';
import { Progreso } from './pantallas/Progreso';
import { Ronda } from './pantallas/Ronda';

type Pestana = 'hoy' | 'progreso' | 'ajustes';

const PESTANAS: readonly { id: Pestana; nombre: string }[] = [
  { id: 'hoy', nombre: 'Hoy' },
  { id: 'progreso', nombre: 'Progreso' },
  { id: 'ajustes', nombre: 'Ajustes' },
];

interface Props {
  /** Para las pruebas: un almacén en memoria. */
  readonly almacen?: Almacen;
}

export function App({ almacen }: Props): ReactElement {
  const [elAlmacen] = useState<Almacen>(() => almacen ?? almacenDelDispositivo());
  const datos = useDatos(elAlmacen);
  const [ajustes, setAjustes] = useState<DatosAjustes>(leerAjustes);
  const [pestana, setPestana] = useState<Pestana>('hoy');
  const [ronda, setRonda] = useState<readonly Pista[] | null>(null);
  const vozDelDispositivo = useVoz(true, ajustes.vozLenta);
  const voz = useVoz(ajustes.voz, ajustes.vozLenta);
  const formas = useMemo(() => formasActivas(ajustes, vozDelDispositivo.disponible), [ajustes, vozDelDispositivo.disponible]);

  const cambiarAjustes = useCallback((nuevos: DatosAjustes) => {
    setAjustes(nuevos);
    guardarAjustes(nuevos);
  }, []);

  if (datos.estado === 'cargando') {
    return (
      <main className="app">
        <p className="texto-2">Cargando…</p>
      </main>
    );
  }

  if (datos.estado === 'danado' || datos.estado === 'inaccesible') {
    return (
      <main className="app columna">
        <h1>No se puede leer tu progreso</h1>
        <p className="texto-2">{datos.error ?? 'Error desconocido.'}</p>
        <Boton ancho onClick={datos.reintentar}>
          Reintentar
        </Boton>
        <Boton
          ancho
          variante="secundario"
          onClick={() => {
            void datos.reemplazar({ progreso: PROGRESO_VACIO, historial: HISTORIAL_VACIO });
          }}
        >
          Empezar de cero (lo guardado se aparta, no se borra)
        </Boton>
      </main>
    );
  }

  if (ronda) {
    return (
      <main className="app app--ronda">
        <Ronda
          pistas={ronda}
          progreso={datos.datos.progreso}
          ajustes={ajustes}
          formas={formas}
          voz={voz}
          onRespuesta={datos.responder}
          onSalir={() => {
            setRonda(null);
          }}
        />
      </main>
    );
  }

  return (
    <>
      <main className="app">
        {datos.guardado === 'fallo' ? <p className="aviso">No se ha podido guardar el último avance. Se reintentará solo.</p> : null}
        {pestana === 'hoy' ? <Hoy pistas={PISTAS} datos={datos.datos} onEmpezar={setRonda} /> : null}
        {pestana === 'progreso' ? <Progreso pistas={PISTAS} datos={datos.datos} /> : null}
        {pestana === 'ajustes' ? (
          <Ajustes
            ajustes={ajustes}
            voz={voz}
            hayVozEnElDispositivo={vozDelDispositivo.disponible}
            datos={datos.datos}
            onCambiar={cambiarAjustes}
            onReemplazar={datos.reemplazar}
          />
        ) : null}
      </main>
      <nav className="barra" aria-label="Secciones">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="barra__boton"
            aria-current={pestana === p.id ? 'page' : undefined}
            onClick={() => {
              setPestana(p.id);
            }}
          >
            {p.nombre}
          </button>
        ))}
      </nav>
    </>
  );
}
