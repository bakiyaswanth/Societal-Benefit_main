import DOMPurify from 'dompurify';

/**
 * Sanitizes raw user input to prevent XSS and injection attacks.
 * All user-provided text is passed through DOMPurify before being
 * sent to any API or rendered in the DOM.
 * 
 * @param {string} input - Raw user input string
 * @returns {string} Sanitized input string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Validates that the API key has a plausible format.
 * Google API keys typically start with 'AIza' and are ~39 chars.
 * This is a client-side guard, not a replacement for server validation.
 * 
 * @param {string} key - The API key to validate
 * @returns {{ valid: boolean, message: string }}
 */
export const validateApiKey = (key) => {
  if (!key || typeof key !== 'string') {
    return { valid: false, message: 'API key is required.' };
  }

  const trimmed = key.trim();

  if (trimmed.length < 20) {
    return { valid: false, message: 'API key appears too short. Please check your key.' };
  }

  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    return { valid: false, message: 'API key contains invalid characters.' };
  }

  return { valid: true, message: '' };
};
