from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
import re


# ─── Auth ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str
    turnstile_token: str

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Name must be between 2 and 100 characters")
        return v

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 30:
            raise ValueError("Username must be between 3 and 30 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username may only contain letters, digits, and underscores")
        return v


class UserLogin(BaseModel):
    login_id: str
    password: str
    turnstile_token: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_admin: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_valid(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 2 or len(v) > 100:
                raise ValueError("Name must be between 2 and 100 characters")
        return v

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 3 or len(v) > 30:
                raise ValueError("Username must be between 3 and 30 characters")
            if not re.match(r"^[a-zA-Z0-9_]+$", v):
                raise ValueError("Username may only contain letters, digits, and underscores")
        return v

    @field_validator("bio")
    @classmethod
    def bio_valid(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Bio must not exceed 500 characters")
        return v


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    user: UserOut


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class UsernameCheckResponse(BaseModel):
    available: bool
    suggestions: List[str]


# ─── Movie (TMDB shape, for type hints) ─────────────────────────────────────

class MovieBase(BaseModel):
    movie_id: int
    media_type: str = "movie"
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    release_year: Optional[str] = None
    vote_average: Optional[float] = None


# ─── Favorites ───────────────────────────────────────────────────────────────

class FavoriteCreate(MovieBase):
    pass


class FavoriteOut(MovieBase):
    id: int
    user_id: int
    added_at: datetime

    model_config = {"from_attributes": True}


# ─── Watchlist ───────────────────────────────────────────────────────────────

class WatchlistCreate(MovieBase):
    pass


class WatchlistOut(MovieBase):
    id: int
    user_id: int
    added_at: datetime

    model_config = {"from_attributes": True}


# ─── Watched ─────────────────────────────────────────────────────────────────

class WatchedCreate(MovieBase):
    pass


class WatchedOut(MovieBase):
    id: int
    user_id: int
    watched_at: datetime

    model_config = {"from_attributes": True}


# ─── Ratings ─────────────────────────────────────────────────────────────────

class RatingCreate(BaseModel):
    movie_id: int
    media_type: str = "movie"
    rating: float  # 1.0 – 5.0
    genre_ids: Optional[str] = None  # comma-separated


class RatingOut(BaseModel):
    average: float
    count: int
    user_rating: Optional[float] = None


# ─── Comments ────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    movie_id: int
    media_type: str = "movie"
    content: str
    contains_spoiler: bool = False


class CommentUpdate(BaseModel):
    content: str


class LikeInfo(BaseModel):
    likes: int
    dislikes: int
    user_vote: Optional[bool] = None  # True=like, False=dislike, None=no vote


class CommentOut(BaseModel):
    id: int
    user_id: int
    movie_id: int
    media_type: str = "movie"
    content: str
    contains_spoiler: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_name: str
    like_info: LikeInfo

    model_config = {"from_attributes": True}


# ─── Debates ─────────────────────────────────────────────────────────────────

class DebateCreate(BaseModel):
    movie_id: int
    media_type: str = "movie"
    stance: str  # "agree" or "disagree"
    content: str
    parent_id: Optional[int] = None


class DebateVoteCreate(BaseModel):
    vote: str  # "up" or "down"


class DebateOut(BaseModel):
    id: int
    movie_id: int
    media_type: str = "movie"
    user_id: int
    stance: str
    content: str
    parent_id: Optional[int] = None
    created_at: datetime
    author_name: str
    upvotes: int
    downvotes: int
    user_vote: Optional[str] = None
    reply_count: int

    model_config = {"from_attributes": True}


# ─── Movie recommendation ─────────────────────────────────────────────────────

class MovieRecommendation(BaseModel):
    id: int
    media_type: str = "movie"
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: float
    release_date: Optional[str] = None
    genre_ids: List[int] = []
    reason: Optional[str] = None  # AI's explanation


class MoodRecommendationRequest(BaseModel):
    mood: str
    think: Optional[bool] = False
    deepSearch: Optional[bool] = False


class MoodRecommendationResponse(BaseModel):
    results: List[MovieRecommendation]
    reasoning: Optional[str] = None  # AI's internal reasoning (optional to show)


# ─── Groups ──────────────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class GroupMemberOut(BaseModel):
    user_id: int
    joined_at: datetime
    user_name: str

    model_config = {"from_attributes": True}


class GroupCommentCreate(BaseModel):
    content: str


class GroupCommentOut(BaseModel):
    id: int
    post_id: int
    user_id: int
    user_name: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GroupPostCreate(BaseModel):
    content: str


class GroupPostOut(BaseModel):
    id: int
    group_id: int
    group_name: Optional[str] = None
    user_id: int
    user_name: str
    content: str
    created_at: datetime
    comments: List[GroupCommentOut] = []

    model_config = {"from_attributes": True}


class GroupOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    creator_id: int
    created_at: datetime
    member_count: int
    is_member: bool = False
    is_creator: bool = False

    model_config = {"from_attributes": True}
class UserReviewOut(BaseModel):
    id: int
    movie_id: int
    media_type: str
    label: str
    review_text: Optional[str]
    created_at: datetime
    # Movie metadata for display
    title: Optional[str] = None
    poster_path: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Verdict Battles ─────────────────────────────────────────────────────────

class VerdictBattleCreate(BaseModel):
    movie_id: int
    media_type: str = "movie"
    title: str
    side_a_label: str
    side_b_label: str
    description: Optional[str] = None
    duration_days: int = 7


class BattleArgumentCreate(BaseModel):
    side: str  # "a" or "b"
    content: str


class BattleVoteCreate(BaseModel):
    side: str  # "a" or "b"


class BattleArgumentOut(BaseModel):
    id: int
    battle_id: int
    user_id: int
    author_name: str
    side: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class VerdictBattleOut(BaseModel):
    id: int
    movie_id: int
    media_type: str = "movie"
    creator_id: int
    creator_name: str
    title: str
    side_a_label: str
    side_b_label: str
    description: Optional[str] = None
    ends_at: datetime
    status: str
    created_at: datetime
    side_a_votes: int = 0
    side_b_votes: int = 0
    user_vote: Optional[str] = None
    argument_count: int = 0
    arguments: List[BattleArgumentOut] = []

    model_config = {"from_attributes": True}


# ─── User Badges ─────────────────────────────────────────────────────────────

class UserBadgeOut(BaseModel):
    id: int
    user_id: int
    badge_type: str
    badge_name: str
    movie_id: Optional[int] = None
    earned_at: datetime

    model_config = {"from_attributes": True}


# ─── Hidden Gems ─────────────────────────────────────────────────────────────

class HiddenGemOut(BaseModel):
    id: int
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: float
    vote_count: int
    release_date: Optional[str] = None
    overview: Optional[str] = None
    genre_ids: List[int] = []
    gem_score: float  # computed
    rarity: str  # common | rare | legendary
    is_admin_curated: bool = False


# ─── Prediction Leagues ──────────────────────────────────────────────────────

class NomineeItem(BaseModel):
    movie_id: int
    title: str
    poster_path: Optional[str] = None


class PredictionCategoryOut(BaseModel):
    id: int
    season_id: int
    name: str
    nominees: List[NomineeItem] = []
    winner_movie_id: Optional[int] = None
    user_prediction_id: Optional[int] = None  # what the user picked
    total_predictions: int = 0

    model_config = {"from_attributes": True}


class PredictionSeasonOut(BaseModel):
    id: int
    name: str
    ceremony: str
    status: str
    created_at: datetime
    category_count: int = 0
    categories: List[PredictionCategoryOut] = []

    model_config = {"from_attributes": True}


class PredictionSeasonCreate(BaseModel):
    name: str
    ceremony: str
    categories: List[dict]  # [{"name": "Best Picture", "nominees": [{"movie_id": 1, "title": "...", "poster_path": "..."}]}]


class UserPredictionCreate(BaseModel):
    category_id: int
    predicted_movie_id: int


class LeaderboardEntry(BaseModel):
    user_id: int
    user_name: str
    correct_count: int
    total_predictions: int
    score: float  # percentage


# ─── Admin ───────────────────────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    total_franchises: int
    total_gems: int
    total_must_watch: int = 0
    recent_users: List["UserOut"] = []


class FranchiseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#8B5CF6"
    icon_emoji: str = "🎬"


class FranchiseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon_emoji: Optional[str] = None


class FranchiseOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    color: str
    icon_emoji: str
    movie_ids: List[int] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class GemOverrideCreate(BaseModel):
    movie_id: int
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    release_date: Optional[str] = None
    overview: Optional[str] = None
    gem_score: float = 9.0
    rarity: str = "legendary"
    trailer_url: Optional[str] = None


class GemOverrideOut(BaseModel):
    id: int
    movie_id: int
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    release_date: Optional[str] = None
    overview: Optional[str] = None
    gem_score: float
    rarity: str
    trailer_url: Optional[str] = None
    added_at: datetime

    model_config = {"from_attributes": True}


# ─── Must Watch ───────────────────────────────────────────────────────────────────

class MustWatchCreate(BaseModel):
    movie_id: int
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: Optional[float] = None
    release_date: Optional[str] = None
    overview: Optional[str] = None
    trailer_url: Optional[str] = None


class MustWatchOut(BaseModel):
    id: int
    movie_id: int
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: Optional[float] = None
    release_date: Optional[str] = None
    overview: Optional[str] = None
    trailer_url: Optional[str] = None
    added_at: datetime

    model_config = {"from_attributes": True}


# ─── Movie Interest ─────────────────────────────────────────────────────────────

class MovieInterestCreate(BaseModel):
    movie_id: int
    media_type: str = "movie"
    title: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    release_date: Optional[str] = None


class MovieInterestOut(BaseModel):
    id: int
    user_id: int
    movie_id: int
    media_type: str
    title: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    release_date: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InterestInfo(BaseModel):
    count: int
    user_interested: bool

