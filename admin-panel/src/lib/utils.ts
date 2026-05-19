import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind de forma segura, resolviendo conflictos.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea una fecha en formato legible en español.
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Formatea una fecha con hora.
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Formatea un monto en pesos mexicanos.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

/**
 * Capitaliza la primera letra de cada palabra de un texto.
 * "juan alvares pedraza" → "Juan Alvares Pedraza"
 */
export function capitalizeName(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\b\w/g, c => c.toUpperCase());
}
