/**
 * Input Sanitization Utility
 * Preventing XSS and other injection attacks
 */

export const sanitizeString = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = sanitizeString(result[key]) as any;
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = sanitizeObject(result[key] as any);
    }
  }
  return result;
};
