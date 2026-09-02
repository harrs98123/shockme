import { api, request } from '@/api/client';

export interface SocialAuthor {
  id: number;
  name: string;
  avatar_url?: string | null;
  avatar?: string | null;
  username?: string | null;
  is_following?: boolean;
}

export interface PostComment {
  id: number;
  content: string;
  contains_spoiler: boolean;
  media_url?: string | null;
  created_at: string;
  parent_id?: number | null;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
  author: {
    id: number;
    name: string;
    username?: string | null;
    avatar_url?: string | null;
  };
}

export interface SocialPost {
  id: number;
  user_id: number;
  post_type: 'review' | 'watching' | 'recommendation' | 'poll' | 'meme' | 'scene' | 'watchlist' | string;
  content?: string | null;
  movie_id?: number | null;
  movie_title?: string | null;
  movie?: any;
  payload?: any;
  is_spoiler: boolean;
  comments_count: number;
  created_at: string;
  author: SocialAuthor;
  // The backend has no separate "likes" counter — total engagement is
  // always derived from this array (see FeedPostCard), same as web.
  reactions: { id: number; reaction_type: string; user_id: number; author_name: string }[];
  user_reaction?: string | null;
}

export interface PostCreatePayload {
  post_type: string;
  content: string;
  movie_id?: number | null;
  payload?: any;
  is_spoiler?: boolean;
}

export const socialApi = {
  getFeed: (tab: 'following' | 'discover' = 'discover', limit = 20, offset = 0) =>
    request<SocialPost[]>(() =>
      api.get(tab === 'following' ? '/posts/feed/following' : '/posts/feed/for-you', {
        params: { limit, offset },
      })
    ),

  createPost: (data: PostCreatePayload) =>
    request<SocialPost>(() => api.post('/posts/', data)),

  // Returns the full updated post (reactions included) so callers can sync
  // their optimistic UI to the server's authoritative state.
  react: (postId: number, reactionType: string) =>
    request<SocialPost>(() =>
      api.post(`/posts/${postId}/react`, { reaction_type: reactionType })
    ),

  votePoll: (postId: number, optionIndex: number) =>
    request<any>(() =>
      api.post(`/posts/${postId}/poll/vote`, { option_index: optionIndex })
    ),

  getComments: (postId: number) =>
    request<PostComment[]>(() => api.get(`/posts/${postId}/comments`)),

  addComment: (postId: number, content: string, isSpoiler = false, parentId?: number | null) =>
    request<PostComment>(() =>
      api.post(`/posts/${postId}/comment`, {
        content,
        contains_spoiler: isSpoiler,
        parent_id: parentId ?? null,
      })
    ),

  // Returns the full updated comment (vote counts included) so callers can
  // sync optimistic UI to the server's authoritative state.
  voteComment: (commentId: number, vote: 'up' | 'down') =>
    request<PostComment>(() =>
      api.post(`/posts/comments/${commentId}/vote`, { vote })
    ),

  getSuggestions: (limit = 8) =>
    request<any[]>(() => api.get('/user/suggestions', { params: { limit } })),
};

