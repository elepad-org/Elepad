import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Default timezone for the app (Argentina)
 */
export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Get user's timezone or default
 */
export function getUserTimezone(userTimezone?: string | null): string {
  return userTimezone || DEFAULT_TIMEZONE;
}

/**
 * Convert UTC date to user's local timezone
 */
export function toUserLocalTime(
  utcDate: Date | string,
  timezone?: string | null
): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return toZonedTime(date, getUserTimezone(timezone));
}

/**
 * Convert user's local time to UTC for saving to database
 */
export function toUTC(
  localDate: Date | string,
  timezone?: string | null
): Date {
  const date = typeof localDate === 'string' ? new Date(localDate) : localDate;
  return fromZonedTime(date, getUserTimezone(timezone));
}

/**
 * Format date in user's timezone
 */
export function formatInUserTimezone(
  utcDate: Date | string,
  formatString: string = 'dd/MM/yyyy HH:mm',
  timezone?: string | null
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const userTz = getUserTimezone(timezone);
  const localDate = toUserLocalTime(date, userTz);
  
  return format(localDate, formatString, {
    timeZone: userTz,
    locale: es,
  });
}

/**
 * Get relative time (e.g., "hace 2 horas") in user's timezone
 */
export function getRelativeTime(
  utcDate: Date | string,
  timezone?: string | null
): string {
  const localDate = toUserLocalTime(utcDate, timezone);
  
  return formatDistanceToNow(localDate, {
    addSuffix: true,
    locale: es,
  });
}

/**
 * Check if a date is today in user's timezone
 */
export function isToday(
  utcDate: Date | string,
  timezone?: string | null
): boolean {
  const localDate = toUserLocalTime(utcDate, timezone);
  const today = toUserLocalTime(new Date(), timezone);
  
  return (
    localDate.getDate() === today.getDate() &&
    localDate.getMonth() === today.getMonth() &&
    localDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Get start of day in user's timezone as UTC
 */
export function getStartOfDayUTC(
  date: Date = new Date(),
  timezone?: string | null
): Date {
  const localDate = toUserLocalTime(date, timezone);
  localDate.setHours(0, 0, 0, 0);
  return toUTC(localDate, timezone);
}

/**
 * Get end of day in user's timezone as UTC
 */
export function getEndOfDayUTC(
  date: Date = new Date(),
  timezone?: string | null
): Date {
  const localDate = toUserLocalTime(date, timezone);
  localDate.setHours(23, 59, 59, 999);
  return toUTC(localDate, timezone);
}
