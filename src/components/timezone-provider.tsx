'use client';

import { useEffect } from 'react';

const TZ_COOKIE_NAME = 'tz';

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length);
  }
  return null;
}

/**
 * Detects the browser timezone and writes it to the `tz` cookie so server
 * components (e.g. the reminders widget) can compute local-day boundaries.
 * Renders nothing. IANA timezone names only use cookie-safe characters, so the
 * value is written unencoded.
 */
export function TimezoneProvider() {
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone || timeZone === readCookie(TZ_COOKIE_NAME)) return;
    document.cookie = `${TZ_COOKIE_NAME}=${timeZone}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return null;
}
