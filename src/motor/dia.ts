// El día de estudio empieza a las 04:00 de la hora local: quien estudia a la
// una de la madrugada sigue en «hoy». Las fechas se guardan como AAAA-MM-DD.

export const HORA_DE_CORTE = 4;

export function diaDe(fecha: Date): string {
  const d = new Date(fecha.getTime());
  d.setHours(d.getHours() - HORA_DE_CORTE);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Días naturales entre dos fechas AAAA-MM-DD (b menos a). */
export function diasEntre(a: string, b: string): number {
  const [ay = 0, am = 1, ad = 1] = a.split('-').map(Number);
  const [by = 0, bm = 1, bd = 1] = b.split('-').map(Number);
  const ta = Date.UTC(ay, am - 1, ad);
  const tb = Date.UTC(by, bm - 1, bd);
  return Math.round((tb - ta) / 86_400_000);
}
