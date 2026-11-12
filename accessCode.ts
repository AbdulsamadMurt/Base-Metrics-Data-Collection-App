/**
 * Helper to generate unique personal one-time activation codes for each registrant.
 * e.g., FAC-8421 for Facilitators, SUP-3914 for Supervisors, ADM-7712 for Admins.
 */
export function generateUserAccessCode(role: string): string {
  let prefix = 'FAC';
  if (role === 'supervisor') prefix = 'SUP';
  else if (role === 'b1_task') prefix = 'B1';
  else if (role === 'admin') prefix = 'ADM';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

/**
 * Normalizes an access code for comparison (trims whitespace, converts to uppercase, ignores hyphens/spaces if needed).
 */
export function normalizeCode(code?: string | null): string {
  if (!code) return '';
  return code.trim().toUpperCase().replace(/[\s-]/g, '');
}
