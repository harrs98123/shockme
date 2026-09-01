import { api, request } from '@/api/client';
import type { HiddenGem, Media, MustWatch } from '@/types';

export const curatedApi = {
  /** Public curated Must Watch list */
  mustWatch: () => request<MustWatch[]>(() => api.get('/admin/must-watch/public')),

  /** Hidden Gems list */
  gems: () => request<HiddenGem[]>(() => api.get('/hidden-gems')),

  /** Mood / AI concept recommendation engine */
  mood: (concept: string, limit = 16) =>
    request<{ results?: Media[]; recommendations?: Media[] } | Media[]>(() =>
      api.post('/recommendations/mood', { concept, limit })
    ),
};
