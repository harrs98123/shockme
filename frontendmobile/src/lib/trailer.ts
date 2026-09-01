import { Linking } from 'react-native';
import { moviesApi } from '@/api/movies';
import type { Video } from '@/types';
import showToast from '@/lib/toast';

interface OpenTrailerParams {
  title: string;
  mediaId?: number | string;
  mediaType?: 'movie' | 'tv';
  trailerKey?: string | null;
  trailerUrl?: string | null;
}

/**
 * Directly fetches and opens the official YouTube trailer for a movie or TV show.
 * No modals or popups — launches directly in YouTube / browser.
 */
export async function openTrailerInYouTube({
  title,
  mediaId,
  mediaType = 'movie',
  trailerKey,
  trailerUrl,
}: OpenTrailerParams) {
  try {
    // 1. Direct YouTube key provided
    if (trailerKey) {
      const url = `https://www.youtube.com/watch?v=${trailerKey}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    }

    // 2. Custom override URL provided
    if (trailerUrl) {
      const canOpen = await Linking.canOpenURL(trailerUrl);
      if (canOpen) {
        await Linking.openURL(trailerUrl);
        return;
      }
    }

    // 3. Fetch details & custom info from API if mediaId is present
    if (mediaId) {
      showToast.info('Opening YouTube trailer…');
      const [detailData, customData] = await Promise.all([
        moviesApi.detail(mediaId, mediaType).catch(() => null),
        moviesApi.customInfo(mediaId).catch(() => null),
      ]);

      if (customData?.trailer_url) {
        await Linking.openURL(customData.trailer_url);
        return;
      }

      const vList: Video[] = detailData?.videos?.results || [];
      const best =
        vList.find(
          (v) =>
            v.type === 'Trailer' &&
            v.site === 'YouTube' &&
            (v.name.toLowerCase().includes('official') ||
              v.name.toLowerCase().includes('main') ||
              v.name.toLowerCase().includes('trailer'))
        ) ||
        vList.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
        vList.find(
          (v) =>
            (v.type === 'Trailer' ||
              v.type === 'Teaser' ||
              v.type === 'Clip' ||
              v.type === 'Featurette') &&
            v.site === 'YouTube'
        ) ||
        vList.find((v) => v.site === 'YouTube' && !!v.key);

      if (best?.key) {
        const url = `https://www.youtube.com/watch?v=${best.key}`;
        await Linking.openURL(url);
        return;
      }
    }

    // 4. Smart fallback: Directly open YouTube official trailer search
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      title + ' official trailer'
    )}`;
    await Linking.openURL(searchUrl);
  } catch {
    const fallbackSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      title + ' official trailer'
    )}`;
    Linking.openURL(fallbackSearchUrl).catch(() => {
      showToast.error('Unable to launch YouTube');
    });
  }
}
