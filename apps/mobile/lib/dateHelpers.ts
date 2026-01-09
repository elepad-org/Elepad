/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en la zona horaria local del dispositivo.
 * NO usar .toISOString() ya que devuelve UTC y puede estar en un día diferente.
 */
export function getTodayLocal(): string {
  return new Date().toLocaleDateString("en-CA"); // formato YYYY-MM-DD en hora local
}

/**
 * Convierte una fecha Date a string YYYY-MM-DD en la zona horaria local.
 */
export function toLocalDateString(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

/**
 * Convierte una fecha UTC del backend (YYYY-MM-DD) a fecha local del dispositivo.
 * El backend devuelve fechas en UTC, pero necesitamos interpretarlas en hora local.
 * Ejemplo: Backend devuelve "2026-01-09" (UTC 01:00), pero en Argentina (UTC-3) 
 * son las 22:00 del "2026-01-08".
 */
export function utcDateToLocal(utcDateString: string): string {
  // Parsear como UTC agregando 'T00:00:00Z'
  const utcDate = new Date(utcDateString + 'T00:00:00Z');
  // Convertir a fecha local
  return toLocalDateString(utcDate);
}

/**
 * Verifica si dos fechas son el mismo día en la zona horaria local.
 */
export function isSameLocalDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? date1 : toLocalDateString(new Date(date1));
  const d2 = typeof date2 === 'string' ? date2 : toLocalDateString(new Date(date2));
  return d1 === d2;
}
