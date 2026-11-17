export const storagePrefix = 'ideapilot:';
export function readStored(key, fallback) {
  try { const data = localStorage.getItem(storagePrefix + key); return data ? JSON.parse(data) : fallback; } catch { return fallback; }
}
export function writeStored(key, value) {
  try { localStorage.setItem(storagePrefix + key, JSON.stringify(value)); return true; } catch { return false; }
}
export function isPublicUrl(value) {
  if (!value?.trim()) return true;
  try { return ['https:', 'http:'].includes(new URL(value.trim()).protocol); } catch { return false; }
}
export function validateReferences(profile) {
  if (!isPublicUrl(profile.channelUrl) || !isPublicUrl(profile.contentUrl)) return 'Use a complete http:// or https:// URL for your references.';
  if ((profile.competitors || '').split(/[\n,]/).some(url => !isPublicUrl(url))) return 'Each competitor reference must be a complete http:// or https:// URL.';
  return '';
}
