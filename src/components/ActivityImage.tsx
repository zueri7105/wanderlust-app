import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { activityImageUrl, activityKeyword } from '../utils/activityImages';

/**
 * Key-term image for an itinerary activity line — tappable.
 *
 * Resolution chain (all free, no API key):
 *  1. Wikimedia Commons search — real photos of the actual place, CORS-enabled.
 *  2. LoremFlickr keyword photo as an <img> fallback (no CORS needed for <img>).
 *  3. If both fail, the image quietly hides instead of showing a broken icon.
 *
 * Tapping the thumbnail opens a popup with a larger photo and a brief intro
 * about the place (Wikipedia summary when available; otherwise the activity
 * line itself is shown for context).
 * Results are cached per keyword so re-renders never refetch.
 */

const imgCache = new Map<string, Promise<string | null>>();
const introCache = new Map<string, Promise<string | null>>();

async function resolveCommonsImage(keyword: string, hint: string, width: number): Promise<string | null> {
  const q = [keyword, hint].filter(Boolean).join(' ').trim();
  if (!q) return null;
  try {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
      `&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json&origin=*` +
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

function resolveImage(keyword: string, hint: string, width: number): Promise<string | null> {
  const key = `${width}|${keyword}|${hint}`;
  if (!imgCache.has(key)) imgCache.set(key, resolveCommonsImage(keyword, hint, width));
  return imgCache.get(key)!;
}

/** Brief intro about the place from Wikipedia's summary API (free, CORS-enabled). */
async function resolveIntro(keyword: string): Promise<string | null> {
  const title = keyword.trim().replace(/\s+/g, '_');
  if (!title) return null;
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const extract = typeof data?.extract === 'string' ? data.extract : '';
    if (!extract || extract.length < 40) return null;
    // Keep the popup light: first two sentences are plenty
    const sentences = extract.match(/[^.!?]+[.!?]+/g) || [extract];
    return sentences.slice(0, 2).join(' ').trim();
  } catch {
    return null;
  }
}

function getIntro(keyword: string): Promise<string | null> {
  if (!introCache.has(keyword)) introCache.set(keyword, resolveIntro(keyword));
  return introCache.get(keyword)!;
}

interface ActivityImageProps {
  text: string;
  destination?: string;
  className?: string;
}

export default function ActivityImage({ text, destination = '', className = '' }: ActivityImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [bigSrc, setBigSrc] = useState<string | null>(null);
  const [intro, setIntro] = useState<string | null>(null);
  const [introLoading, setIntroLoading] = useState(false);

  const kw = activityKeyword(text, destination);
  // City name only as search hint — keeps Commons queries on-topic
  const hint = destination.split(',')[0].trim().split(/\s+/).slice(0, 2).join(' ');
  const cleanHint = hint === kw ? '' : hint;

  useEffect(() => {
    let alive = true;
    setSrc(null);
    setFailed(false);
    resolveImage(kw, cleanHint, 192).then((u) => {
      if (!alive) return;
      setSrc(u || activityImageUrl(text, destination));
    });
    return () => {
      alive = false;
    };
  }, [text, destination, kw, cleanHint]);

  const openPopup = () => {
    setOpen(true);
    setBigSrc(null);
    setIntro(null);
    setIntroLoading(true);
    resolveImage(kw, cleanHint, 640).then((u) =>
      setBigSrc(u || activityImageUrl(text, destination, 'card'))
    );
    getIntro(kw).then((s) => {
      setIntro(s);
      setIntroLoading(false);
    });
  };

  if (failed || !src) return null;
  return (
    <>
      <button
        type="button"
        onClick={openPopup}
        className={`shrink-0 mr-2.5 mt-0.5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs cursor-zoom-in hover:ring-2 hover:ring-rose-300 dark:hover:ring-rose-700 transition-all ${className}`}
        title={`${kw} — tap for photo & intro`}
      >
        <img
          src={src}
          alt={kw}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 object-cover block"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[95] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-52 bg-slate-100 dark:bg-slate-800">
              {bigSrc && (
                <img
                  src={bigSrc}
                  alt={kw}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <h4 className="font-display font-bold text-base text-slate-950 dark:text-slate-50">{kw}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {introLoading ? '…' : intro || `From your plan: “${text}”`}
              </p>
              {intro && (
                <p className="mt-2 text-[10px] text-slate-400">Photo & intro: Wikimedia / Wikipedia</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
