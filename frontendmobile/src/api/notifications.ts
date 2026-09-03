import { api, request } from './client';

export interface NotificationActor {
  id: number;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  is_following: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow';
  created_at: string;
  actor: NotificationActor;
  post_id?: number | null;
  post_title?: string | null;
  post_snippet?: string | null;
  post_poster?: string | null;
  reaction_type?: string | null;
  content?: string | null;
  is_read: boolean;
  is_following_back: boolean;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unread_count: number;
}

export interface SuggestedUser {
  id: number;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  is_following: boolean;
  follows_you: boolean;
  followers_count: number;
}

export const notificationsApi = {
  get: (limit = 50, offset = 0) =>
    request<NotificationsResponse>(() =>
      api.get('/user/notifications', { params: { limit, offset } })
    ),

  markRead: () =>
    request<{ status: string }>(() => api.post('/user/notifications/mark-read')),

  getUnreadCount: () =>
    request<{ unread_count: number }>(() => api.get('/user/notifications/unread-count')),

  getSuggestions: (limit = 15) =>
    request<SuggestedUser[]>(() =>
      api.get('/user/suggestions', { params: { limit } })
    ),
};
