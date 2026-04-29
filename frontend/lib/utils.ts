import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStreamingDirectLink(providerName: string, title: string, fallbackUrl?: string): string {
  const query = encodeURIComponent(title);
  const name = providerName.toLowerCase();

  if (name.includes('netflix')) return `https://www.netflix.com/search?q=${query}`;
  if (name.includes('prime video') || name.includes('amazon')) return `https://www.primevideo.com/search/?phrase=${query}`;
  if (name.includes('hotstar') || name.includes('disney+')) return `https://www.hotstar.com/in/search?q=${query}`;
  if (name.includes('jiocinema')) return `https://www.jiocinema.com/search/${query}`;
  if (name.includes('zee5')) return `https://www.zee5.com/search?q=${query}`;
  if (name.includes('sonyliv')) return `https://www.sonyliv.com/search?q=${query}`;
  if (name.includes('crunchyroll')) return `https://www.crunchyroll.com/search?q=${query}`;
  if (name.includes('apple tv')) return `https://tv.apple.com/search?term=${query}`;
  if (name.includes('youtube')) return `https://www.youtube.com/results?search_query=${query}`;
  
  return fallbackUrl || `https://www.google.com/search?q=watch+${query}+on+${encodeURIComponent(providerName)}`;
}
