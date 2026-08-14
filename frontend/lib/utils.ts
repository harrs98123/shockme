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
  if (name.includes('apple tv')) return `https://tv.apple.com/search?term=${query}`;
  if (name.includes('youtube')) return `https://www.youtube.com/results?search_query=${query}`;
  
  return fallbackUrl || `https://www.google.com/search?q=watch+${query}+on+${encodeURIComponent(providerName)}`;
}

// Detects non-Latin scripts (Devanagari, Tamil, Telugu, Malayalam, Kannada, CJK, Arabic, Cyrillic, Thai, etc.)
const NON_LATIN_REGEX = /[\u0600-\u06FF\u0750-\u077F\u0900-\u0DFF\u0E00-\u0E7F\u1100-\u11FF\u3040-\u30FF\u3130-\u318F\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0370-\u03FF]/;

export function isNonLatin(str?: string | null): boolean {
  if (!str) return false;
  return NON_LATIN_REGEX.test(str);
}

// Transliterates Devanagari & Tamil text to English Latin characters
export function transliterateToLatin(text: string): string {
  if (!text) return '';

  const devanagariMap: Record<string, string> = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
    'ष': 'sh', 'स': 's', 'ह': 'h', 'ड़': 'd', 'ढ़': 'dh',
    'ज़': 'z', 'फ़': 'f', 'क़': 'q', 'ख़': 'kh', 'ग़': 'gh',
    'अ': 'A', 'आ': 'Aa', 'इ': 'I', 'ई': 'Ee', 'उ': 'U',
    'ऊ': 'Oo', 'ऋ': 'Ri', 'ए': 'E', 'ऐ': 'Ai', 'ओ': 'O',
    'औ': 'Au', 'अं': 'An', 'अः': 'Ah',
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
    'ं': 'n', 'ँ': 'n', '्': '', 'ः': 'h', 'ॅ': 'e', 'ॉ': 'o',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };

  const tamilMap: Record<string, string> = {
    'க': 'k', 'ங': 'ng', 'ச': 's', 'ஞ': 'ny', 'ட': 't',
    'ண': 'n', 'த': 'th', 'ந': 'n', 'ப': 'p', 'ம': 'm',
    'ய': 'y', 'ர': 'r', 'ல': 'l', 'வ': 'v', 'ழ': 'zh',
    'ள': 'l', 'ற': 'r', 'ன': 'n', 'ஜ': 'j', 'ஷ': 'sh',
    'ஸ': 's', 'ஹ': 'h', 'க்ஷ': 'ksh',
    'அ': 'A', 'ஆ': 'Aa', 'இ': 'I', 'ஈ': 'Ee', 'உ': 'U',
    'ஊ': 'Oo', 'எ': 'E', 'ஏ': 'Ae', 'ஐ': 'Ai', 'ஒ': 'O',
    'ஓ': 'Oa', 'ஔ': 'Au',
    'ா': 'aa', 'ி': 'i', 'ீ': 'ee', 'ு': 'u', 'ூ': 'oo',
    'ெ': 'e', 'ே': 'ae', 'ை': 'ai', 'ொ': 'o', 'ோ': 'oa',
    'ௌ': 'au', '்': '',
  };

  // Known titles / words direct dictionary mapping for flawless English titles
  const wordMap: Record<string, string> = {
    'डीसी': 'DC',
    'द': 'The',
    'ब्लडी': 'Bloody',
    'खूनी': 'Bloody',
    'वैलेंटाइन': 'Valentine',
    'जन': 'Jan',
    'नायकन': 'Nayagan',
    'नायक': 'Nayak',
    'लियो': 'Leo',
    'पुष्पा': 'Pushpa',
    'कल्कि': 'Kalki',
    'स्त्री': 'Stree',
    'जवान': 'Jawan',
    'पठान': 'Pathaan',
  };

  let processed = text;
  for (const [w, r] of Object.entries(wordMap)) {
    processed = processed.replaceAll(w, r);
  }

  let result = '';
  for (let i = 0; i < processed.length; i++) {
    const char = processed[i];
    const nextChar = processed[i + 1] || '';

    if (devanagariMap[char] !== undefined) {
      const isConsonant = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहड़ढ़ज़फ़क़ख़ग़'.includes(char);
      const isNextMatraOrVirama = 'ािीुूृेैोौ्ँंॅॉ'.includes(nextChar);
      result += devanagariMap[char];
      if (isConsonant && !isNextMatraOrVirama && nextChar !== ' ') {
        result += 'a';
      }
    } else if (tamilMap[char] !== undefined) {
      const isConsonant = 'கஙசஞடணதநபமயரலவழளறனஜஷஸஹ'.includes(char);
      const isNextPulliOrMatra = 'ாிீுூெேைொோௌ்'.includes(nextChar);
      result += tamilMap[char];
      if (isConsonant && !isNextPulliOrMatra && nextChar !== ' ') {
        result += 'a';
      }
    } else {
      result += char;
    }
  }

  // Capitalize words cleanly
  return result
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function getEnglishTitle(media?: {
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  english_title?: string;
} | null): string {
  if (!media) return 'Untitled';

  const candidates = [
    media.english_title,
    media.title,
    media.name,
    media.original_title,
    media.original_name,
  ].filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

  if (candidates.length === 0) return 'Untitled';

  // 1. Prefer candidate that contains purely Latin / English characters
  const latinCandidate = candidates.find(t => !NON_LATIN_REGEX.test(t));
  if (latinCandidate) {
    return latinCandidate;
  }

  // 2. Transliterate to Latin English script
  const transliterated = transliterateToLatin(candidates[0]);
  if (transliterated && !NON_LATIN_REGEX.test(transliterated)) {
    return transliterated;
  }

  // 3. Fallback
  return candidates[0];
}
