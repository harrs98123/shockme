// All shared TypeScript types for CineMatch

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  is_admin?: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Media {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string;        // Movie
  name?: string;         // TV Show
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;  // Movie
  first_air_date?: string; // TV Show
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres?: Genre[];
  runtime?: number;
  episode_run_time?: number[]; // TV Show
  tagline?: string;
  credits?: Credits;
  similar?: { results: Media[] };
  videos?: { results: Video[] };
  images?: Images;
  reason?: string;
  'watch/providers'?: {
    results: Record<string, any>;
  };
  production_countries?: { name: string; iso_3166_1: string }[];
  origin_country?: string[];
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  original_language?: string;
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[] };
}

export type Movie = Media;

export interface Genre {
  id: number;
  name: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

export interface Video {
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface ImageInfo {
  aspect_ratio: number;
  file_path: string;
  height: number;
  width: number;
  vote_average: number;
  vote_count: number;
}

export interface Images {
  backdrops: ImageInfo[];
  posters: ImageInfo[];
  logos: ImageInfo[];
}

export interface FavoriteItem {
  id: number;
  movie_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: string | null;
  vote_average: number | null;
  added_at: string;
}

export interface WatchlistItem extends FavoriteItem { }
export interface WatchedItem extends FavoriteItem {
  watched_at: string;
}

export interface MoviePayload {
  movie_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: string | null;
  vote_average: number | null;
}

export interface RatingInfo {
  average: number;
  count: number;
  user_rating: number | null;
}

export interface LikeInfo {
  likes: number;
  dislikes: number;
  user_vote: boolean | null;
}

export interface Comment {
  id: number;
  user_id: number;
  movie_id: number;
  content: string;
  contains_spoiler: boolean;
  created_at: string;
  updated_at: string | null;
  author_name: string;
  like_info: LikeInfo;
}

// ─── Verdict Battles ────────────────────────────────────────────────
export interface BattleArgument {
  id: number;
  battle_id: number;
  user_id: number;
  author_name: string;
  side: 'a' | 'b';
  content: string;
  created_at: string;
}

export interface VerdictBattle {
  id: number;
  movie_id: number;
  media_type: string;
  creator_id: number;
  creator_name: string;
  title: string;
  side_a_label: string;
  side_b_label: string;
  description: string | null;
  ends_at: string;
  status: 'active' | 'completed';
  created_at: string;
  side_a_votes: number;
  side_b_votes: number;
  user_vote: 'a' | 'b' | null;
  argument_count: number;
  arguments: BattleArgument[];
}

// ─── User Badges ────────────────────────────────────────────────────
export interface UserBadge {
  id: number;
  user_id: number;
  badge_type: string;
  badge_name: string;
  movie_id: number | null;
  earned_at: string;
}

// ─── Hidden Gems ────────────────────────────────────────────────────
export interface HiddenGem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string | null;
  overview: string | null;
  genre_ids: number[];
  gem_score: number;
  rarity: 'common' | 'rare' | 'legendary';
  is_admin_curated?: boolean;
}

// ─── Prediction Leagues ─────────────────────────────────────────────
export interface NomineeItem {
  movie_id: number;
  title: string;
  poster_path: string | null;
}

export interface PredictionCategory {
  id: number;
  season_id: number;
  name: string;
  nominees: NomineeItem[];
  winner_movie_id: number | null;
  user_prediction_id: number | null;
  total_predictions: number;
}

export interface PredictionSeason {
  id: number;
  name: string;
  ceremony: string;
  status: 'open' | 'locked' | 'completed';
  created_at: string;
  category_count: number;
  categories: PredictionCategory[];
}

export interface LeaderboardEntry {
  user_id: number;
  user_name: string;
  correct_count: number;
  total_predictions: number;
  score: number;
}

// ─── Universe Map ───────────────────────────────────────────────────
export interface UniverseNode {
  id: number;
  name: string;
  type: 'actor' | 'director';
  profile_path: string | null;
  character?: string;
}

export interface UniverseEdge {
  from: number;
  to: number;
  movies: string[];
}

export interface UniverseCenter {
  id: number;
  name: string;
  type: 'actor' | 'director';
  profile_path: string | null;
  biography: string;
  known_for_department: string;
  birthday?: string | null;
  place_of_birth?: string | null;
}

export interface UniverseMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  popularity?: number;
  media_type?: string;
  character?: string;
  genre_ids?: number[];
}

export interface UniverseStats {
  total_films: number;
  total_collaborators: number;
  graph_connections: number;
  works_analyzed: number;
}

export interface PersonRole {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  character?: string;
  media_type: 'movie' | 'tv';
  vote_average: number;
  popularity: number;
  job: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  external_ids: {
    imdb_id?: string;
    instagram_id?: string;
    twitter_id?: string;
    tiktok_id?: string;
    youtube_id?: string;
  };
  images: { file_path: string }[];
  filmography: PersonRole[];
}

export interface UniverseData {
  center: UniverseCenter | null;
  nodes: UniverseNode[];
  edges: UniverseEdge[];
  movies: UniverseMovie[];
  stats?: UniverseStats;
  error?: string;
}

export interface Debate {
  id: number;
  movie_id: number;
  user_id: number;
  stance: 'agree' | 'disagree';
  content: string;
  parent_id: number | null;
  created_at: string;
  author_name: string;
  upvotes: number;
  downvotes: number;
  user_vote: 'up' | 'down' | null;
  reply_count: number;
}

export interface TMDBResponse {
  results: Media[];
  page: number;
  total_pages: number;
  total_results: number;
}

export interface RecommendationResponse {
  based_on: string[];
  results: Media[];
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  creator_id: number;
  created_at: string;
  member_count: number;
  is_member: boolean;
  is_creator: boolean;
}

export interface GroupPost {
  id: number;
  group_id: number;
  group_name?: string;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
  comments: GroupComment[];
}

export interface GroupComment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
}
export interface UserReview {
  id: number;
  movie_id: number;
  media_type: string;
  label: 'skip' | 'timepass' | 'goforit' | 'perfection';
  review_text: string | null;
  created_at: string;
  title: string | null;
  poster_path: string | null;
}

export interface Collection {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  is_rank_list: boolean;
  item_count: number;
  cover_poster: string | null;
  created_at: string;
}

// ─── Admin ─────────────────────────────────────────────────────────────
export interface Franchise {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon_emoji: string;
  movie_ids: number[];
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_franchises: number;
  total_gems: number;
  total_must_watch: number;
  recent_users: User[];
}

export interface GemOverride {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number | null;
  vote_count: number | null;
  release_date: string | null;
  overview: string | null;
  gem_score: number;
  rarity: string;
  added_at: string;
}

export interface InterestInfo {
  count: number;
  user_interested: boolean;
}


export interface MovieInterest {
  id: number;
  user_id: number;
  movie_id: number;
  media_type: string;
  title: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  created_at: string;
}

export interface MustWatch {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number | null;
  release_date: string | null;
  overview: string | null;
  added_at: string;
}

