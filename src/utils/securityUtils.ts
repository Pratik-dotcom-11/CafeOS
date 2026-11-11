/**
 * Security and Safe Redirect Validation Utilities for CaféOS
 */

/**
 * Validates that a redirect URL is safe to navigate to,
 * preventing Open Redirect vulnerabilities and protocol injection.
 *
 * @param url The candidate redirect path
 * @param defaultFallback The safe fallback route to use if validation fails
 * @param allowedPrefix Optional prefix constraint (e.g., '/customer' or '/dashboard')
 * @returns A guaranteed safe relative path
 */
export function validateSafeRedirect(
  url: string | null | undefined,
  defaultFallback: string = '/',
  allowedPrefix?: string
): string {
  if (!url || typeof url !== 'string') {
    return defaultFallback;
  }

  const trimmed = url.trim();

  // Must begin with a single slash and must NOT begin with double slash (protocol-relative)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return defaultFallback;
  }

  // Reject URL protocols (e.g., http:, https:, javascript:, data:, vbscript:)
  if (/^(?:[a-z]+:|\/\/)/i.test(trimmed)) {
    return defaultFallback;
  }

  // Reject CRLF injection or control characters
  if (/[\r\n\0]/.test(trimmed)) {
    return defaultFallback;
  }

  // If a specific prefix is required, enforce it
  if (allowedPrefix && !trimmed.startsWith(allowedPrefix)) {
    return defaultFallback;
  }

  return trimmed;
}

/**
 * Checks whether the current user is a verified restaurant staff member
 * based on active workspace memberships.
 */
export function hasRestaurantMembership(workspaces: any[]): boolean {
  return Array.isArray(workspaces) && workspaces.length > 0 && workspaces.some((w) => w.is_active !== false);
}

