// Cuándo caduca la firma de la app en el iPhone. Con una cuenta de Apple
// gratuita, la instalación deja de abrirse a los siete días y hay que volver
// a instalarla desde el ordenador (`npm run iphone`, decisión 0005). Al
// instalar, el script deja la fecha en firma.json, dentro de la app; en el
// navegador ese archivo no existe y no se avisa de nada.

import { useEffect, useState } from 'react';

/** Lee la fecha de firma.json. null si no hay archivo o no se entiende. */
export async function leerCaducidadFirma(ruta = 'firma.json'): Promise<Date | null> {
  try {
    const respuesta = await fetch(ruta, { cache: 'no-store' });
    if (!respuesta.ok) return null;
    const { caduca } = (await respuesta.json()) as { caduca?: unknown };
    if (typeof caduca !== 'string') return null;
    const fecha = new Date(caduca);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  } catch {
    return null;
  }
}

export interface AvisoFirma {
  readonly texto: string;
  /** Si queda poco (dos días o menos) y conviene destacarlo. */
  readonly urgente: boolean;
}

const UN_DIA = 24 * 60 * 60 * 1000;

/** El aviso para la pantalla de inicio. */
export function avisoFirma(caduca: Date, ahora: Date): AvisoFirma {
  const cuando = caduca.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const queda = caduca.getTime() - ahora.getTime();
  if (queda <= 0) {
    return { texto: `La instalación caducó el ${cuando}. Conecta el iPhone al ordenador y vuelve a instalarla (npm run iphone).`, urgente: true };
  }
  const urgente = queda <= 2 * UN_DIA;
  return {
    texto: urgente
      ? `La instalación caduca el ${cuando}. Antes, conecta el iPhone al ordenador y vuelve a instalarla (npm run iphone): el progreso se conserva.`
      : `Esta instalación caduca el ${cuando}.`,
    urgente,
  };
}

export function useCaducidadFirma(): Date | null {
  const [caduca, setCaduca] = useState<Date | null>(null);
  useEffect(() => {
    let vivo = true;
    void leerCaducidadFirma().then((f) => {
      if (vivo) setCaduca(f);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return caduca;
}
