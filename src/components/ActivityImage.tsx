import { useEffect, useState } from 'react';
import { activityImageUrl, activityKeyword } from '../utils/activityImages';

/**
 * Key-term image for an itinerary activity line.
 *
 * Resolution chain (all free, no API key):
 *  1. Wikimedia Commons search — real photos of the actual place, CORS-enabled.
 *  2. LoremFlickr keyword photo as an <img> fallback (no CORS needed for <img>).
 *  3. If both fail, the image quietly hides instead of showing a broken icon.
 *
 * Results are cached per keyword so re-renders never refetch.
 */

const cache = new Map<string, Promise<string | null>>();

async function resolveCommonsImage(keyword: string, hint: string): Promise<string | null> {
  const q = [keyword, hint].filter(Boolean).join(' ').trim();
  if (!q) return null;
  try {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
      '&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=192&format=json&origin=*' +
      `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${q}`)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const first = Object.values(pages)[0] as { imageinfo?: { thumburl?: string; url?: string }[] } | undefined;
    const thumb = first?.imageinfo?.[0]?.thumburl || first?.imageinfo?.[0]?.url;
    return typeof thumb === 'string' ? thumb : null;
  } catch {
    return null;
  }
}

function resolveImage(keyword: string, hint: string): Promise<string | null> {
  const key = `${keyword}|${hint}`;
  if (!cache.has(key)) cache.set(key, resolveCommonsImage(keyword, hint));
  return cache.get(key)!;
}

interface ActivityImageProps {
  text: string;
  destination?: string;
  className?: string;
}

export default function ActivityImage({ text, destination = '', className = '' }: ActivityImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setSrc(null);
    setFailed(false);
    const kw = activityKeyword(text, destination);
    // City name only as search hint — keeps Commons queries on-topic
    const hint = destination.split(',')[0].trim().split(/\s+/).slice(0, 2).join(' ');
    resolveImage(kw, hint === kw ? '' : hint).then((u) => {
      if (!alive) return;
      setSrc(u || activityImageUrl(text, destination));
    });
    return () => {
      alive = false;
    };
  }, [text, destination]);

  if (failed || !src) return null;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`w-9 h-9 rounded-lg object-cover shrink-0 mr-2 mt-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}
    />
  );
}
