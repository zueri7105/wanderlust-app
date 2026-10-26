/**
 * Free, no-key images for itinerary activities.
 *
 * Picks the most image-worthy key term out of an activity line ("sunrise at
 * Fushimi Inari, then matcha in Uji" → "Fushimi Inari") and turns it into an
 * LoremFlickr URL — a free service that serves keyword-matched photos, so no
 * API key or backend is needed. When nothing useful can be extracted, the
 * destination keyword keeps the image on-topic.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'at', 'in', 'on', 'of', 'for', 'to', 'and', 'or', 'with',
  'by', 'from', 'into', 'over', 'then', 'than', 'after', 'before', 'during',
  'via', 'near', 'along', 'around', 'through', 'up', 'down', 'out', 'off',
  'go', 'get', 'see', 'visit', 'explore', 'walk', 'hike', 'tour', 'trip',
  'check', 'rest', 'relax', 'enjoy', 'try', 'take', 'meet', 'join', 'watch',
  'morning', 'afternoon', 'evening', 'night', 'day', 'sunrise', 'sunset',
  'dinner', 'lunch', 'breakfast', 'meal', 'coffee', 'drinks', 'free', 'time',
  'solo', 'group', 'guided', 'self', 'private', 'public', 'local', 'old',
  'new', 'city', 'town', 'area', 'back', 'there', 'here', 'our', 'your'
]);

/** Extract the most photo-worthy key term (capitalised place names win). */
export function activityKeyword(activityText: string, destinationHint = ''): string {
  const text = (activityText || '').trim();
  if (!text) return destinationHint || 'travel';
  // Proper-noun phrases first: capitalised multi-word chunks ("Fushimi Inari Shrine")
  const proper = text.match(/(?:[A-Z][a-zA-ZÀ-ɏ'-]+(?:\s+(?:of|de|del|la|le|the|di|da|von|van|al|el)\s+|\s+)?){1,4}[A-Z][a-zA-ZÀ-ɏ'-]+/g);
  const candidates = (proper || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && !/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Day|Check|Arrival|Departure)/.test(s));
  if (candidates.length > 0) {
    // prefer the longest (most specific) proper phrase, capped at 3 words
    candidates.sort((a, b) => b.length - a.length);
    return candidates[0].split(/\s+/).slice(0, 3).join(' ');
  }
  // Fallback: longest non-stop words
  const words = text
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
    .sort((a, b) => b.length - a.length)
    .slice(0, 2);
  if (words.length > 0) return words.join(' ');
  return destinationHint || 'travel';
}

/**
 * Image URL for an activity line. LoremFlickr serves free keyword-matched
 * photos; `lock` (a stable hash) keeps the same picture across re-renders.
 */
export function activityImageUrl(
  activityText: string,
  destinationHint: string,
  size: 'thumb' | 'card' = 'thumb'
): string {
  const kw = activityKeyword(activityText, destinationHint);
  const [w, h] = size === 'thumb' ? [96, 96] : [640, 400];
  let hash = 0;
  for (let i = 0; i < activityText.length; i++) hash = (hash * 31 + activityText.charCodeAt(i)) >>> 0;
  const keywords = encodeURIComponent(
    kw.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim().split(/\s+/).slice(0, 3).join(',')
  );
  return `https://loremflickr.com/${w}/${h}/${keywords}?lock=${hash % 997}`;
}
