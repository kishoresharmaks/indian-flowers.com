/**
 * Sanitizes image URLs to prevent Mixed Content warnings and ensure relative serving.
 * Converts absolute URLs referencing /uploads/, /wp-content/, or /images/ to relative paths.
 * Automatically upgrades any remaining http:// URLs to https://.
 */
export function sanitizeImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return trimmed;

  if (trimmed.includes('/uploads/')) {
    return '/uploads/' + trimmed.split('/uploads/')[1];
  }
  if (trimmed.includes('/wp-content/')) {
    return '/wp-content/' + trimmed.split('/wp-content/')[1];
  }
  if (trimmed.includes('/images/')) {
    return '/images/' + trimmed.split('/images/')[1];
  }

  if (trimmed.startsWith('http://')) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }

  return trimmed;
}
