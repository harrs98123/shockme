import { api, request } from '@/api/client';

export interface Story {
  id: number;
  user_id: number;
  movie_id?: number | null;
  movie_title?: string | null;
  movie_poster?: string | null;
  movie_backdrop?: string | null;
  media_type: string;
  caption?: string | null;
  story_type: string;
  rating?: number | null;
  created_at: string;
  reactions_count: number;
  user_reaction?: string | null;
}

export interface UserStoryGroup {
  user_id: number;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  stories: Story[];
  latest_created_at: string;
}

export interface StoryCreatePayload {
  movie_id?: number | null;
  movie_title?: string | null;
  movie_poster?: string | null;
  movie_backdrop?: string | null;
  media_type?: string;
  caption?: string | null;
  story_type?: string;
  rating?: number | null;
}

export const storiesApi = {
  getFeed: () =>
    request<UserStoryGroup[]>(() => api.get('/stories/feed')),

  getMy: () =>
    request<Story[]>(() => api.get('/stories/my')),

  create: (data: StoryCreatePayload) =>
    request<Story>(() => api.post('/stories/', data)),

  delete: (storyId: number) =>
    request<any>(() => api.delete(`/stories/${storyId}`)),

  react: (storyId: number, reactionType: string) =>
    request<{ message: string; reaction?: string | null }>(() =>
      api.post(`/stories/${storyId}/react`, { reaction_type: reactionType })
    ),
};
