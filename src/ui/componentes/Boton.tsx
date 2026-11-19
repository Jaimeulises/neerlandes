import type { ButtonHTMLAttributes, ReactElement } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variante?: 'principal' | 'secundario' | 'claro' | 'peligro' | 'texto';
  readonly ancho?: boolean;
}

export function Boton({ variante = 'principal', ancho = false, className, type = 'button', ...resto }: Props): ReactElement {
  const clases = ['boton', variante !== 'principal' ? `boton--${variante}` : '', ancho ? 'boton--ancho' : '', className ?? ''].filter(Boolean).join(' ');
  return <button type={type} className={clases} {...resto} />;
}
