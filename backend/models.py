from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Security: account lockout tracking
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete")
    watchlist = relationship("Watchlist", back_populates="user", cascade="all, delete")
    watched = relationship("Watched", back_populates="user", cascade="all, delete")
    ratings = relationship("Rating", back_populates="user", cascade="all, delete")
    comments = relationship("Comment", back_populates="user", cascade="all, delete")
    debates = relationship("Debate", back_populates="user", cascade="all, delete")
    owned_groups = relationship("Group", back_populates="creator", cascade="all, delete")
    group_memberships = relationship("GroupMember", back_populates="user", cascade="all, delete")
    group_posts = relationship("GroupPost", back_populates="user", cascade="all, delete")
    group_comments = relationship("GroupComment", back_populates="user", cascade="all, delete")
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete")
    predictions = relationship("UserPrediction", back_populates="user", cascade="all, delete")
    interests = relationship("MovieInterest", back_populates="user", cascade="all, delete")



class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    media_type = Column(String, default="movie")
    title = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    release_year = Column(String, nullable=True)
    vote_average = Column(Float, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="favorites")


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    media_type = Column(String, default="movie")
    title = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    release_year = Column(String, nullable=True)
    vote_average = Column(Float, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="watchlist")


class Watched(Base):
    __tablename__ = "watched"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    media_type = Column(String, default="movie")
    title = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    release_year = Column(String, nullable=True)
    vote_average = Column(Float, nullable=True)
    watched_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="watched")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    media_type = Column(String, default="movie")
    rating = Column(Float, nullable=False)  # 1-5
    genre_ids = Column(String, nullable=True)  # comma-separated for recommendations
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="ratings")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    media_type = Column(String, default="movie")
    content = Column(Text, nullable=False)
    contains_spoiler = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="comments")
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete")


class CommentLike(Base):
    __tablename__ = "comment_likes"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_like = Column(Boolean, nullable=False)  # True = like, False = dislike

    comment = relationship("Comment", back_populates="likes")


class Debate(Base):
    __tablename__ = "debates"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, nullable=False)
    media_type = Column(String, default="movie")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stance = Column(String, nullable=False)  # "agree" or "disagree"
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("debates.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="debates")
    votes = relationship("DebateVote", back_populates="debate", cascade="all, delete")
    replies = relationship("Debate", backref="parent", remote_side=[id])


class DebateVote(Base):
    __tablename__ = "debate_votes"

    id = Column(Integer, primary_key=True, index=True)
    debate_id = Column(Integer, ForeignKey("debates.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote = Column(String, nullable=False)  # "up" or "down"

    debate = relationship("Debate", back_populates="votes")


# ─── Moctale Meter ───────────────────────────────────────────────────────────

class MoctaleRating(Base):
    """User rating + optional review for a movie using Skip/Timepass/GoForIt/Perfection labels."""
    __tablename__ = "moctale_ratings"
    __table_args__ = (UniqueConstraint('user_id', 'movie_id', name='_moctale_user_movie_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False, index=True)
    media_type = Column(String, default="movie")
    title = Column(String, nullable=True)
    poster_path = Column(String, nullable=True)
    label = Column(String, nullable=False)  # skip | timepass | goforit | perfection
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    likes = relationship("MoctaleReviewLike", back_populates="review", cascade="all, delete-orphan")
    comments = relationship("MoctaleReviewComment", back_populates="review", cascade="all, delete-orphan", order_by="MoctaleReviewComment.created_at.asc()")

class MoctaleReviewLike(Base):
    __tablename__ = "moctale_review_likes"
    __table_args__ = (UniqueConstraint('review_id', 'user_id', name='_moctale_review_user_like_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("moctale_ratings.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("MoctaleRating", back_populates="likes")
    user = relationship("User")

class MoctaleReviewComment(Base):
    __tablename__ = "moctale_review_comments"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("moctale_ratings.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("moctale_review_comments.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    review = relationship("MoctaleRating", back_populates="comments")
    user = relationship("User")
    parent = relationship("MoctaleReviewComment", remote_side="[MoctaleReviewComment.id]", back_populates="replies")
    replies = relationship("MoctaleReviewComment", back_populates="parent", cascade="all, delete-orphan")
    likes = relationship("MoctaleReviewCommentLike", back_populates="comment", cascade="all, delete-orphan")

class MoctaleReviewCommentLike(Base):
    __tablename__ = "moctale_review_comment_likes"
    __table_args__ = (UniqueConstraint('comment_id', 'user_id', name='_moctale_comment_user_like_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("moctale_review_comments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    comment = relationship("MoctaleReviewComment", back_populates="likes")
    user = relationship("User")


# ─── Collections ─────────────────────────────────────────────────────────────

class Collection(Base):
    """A named collection of movies created by a user."""
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True)
    is_rank_list = Column(Boolean, default=False)  # Special flag for tier ranking pool
    banner_path = Column(String, nullable=True)  # Custom banner backdrop path
    banner_movie_id = Column(Integer, nullable=True) # Linked movie ID if any
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    items = relationship("CollectionItem", back_populates="collection", cascade="all, delete")


class CollectionItem(Base):
    """A movie entry in a collection."""
    __tablename__ = "collection_items"
    __table_args__ = (UniqueConstraint('collection_id', 'movie_id', name='_collection_movie_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    media_type = Column(String, default="movie")
    title = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    release_year = Column(String, nullable=True)
    vote_average = Column(Float, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    collection = relationship("Collection", back_populates="items")


# ─── Tier List ───────────────────────────────────────────────────────────────

class TierList(Base):
    """A user's saved tier list state (tiers + movie assignments as JSON)."""
    __tablename__ = "tier_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False, default="My Movie Ranking")
    tiers_json = Column(Text, nullable=False, default='[]')  # serialized tier state
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")


# ─── Groups ──────────────────────────────────────────────────────────────────

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="owned_groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete")
    posts = relationship("GroupPost", back_populates="group", cascade="all, delete")


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (UniqueConstraint('group_id', 'user_id', name='_group_user_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="group_memberships")


class GroupPost(Base):
    __tablename__ = "group_posts"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("Group", back_populates="posts")
    user = relationship("User", back_populates="group_posts")
    comments = relationship("GroupComment", back_populates="post", cascade="all, delete")


class GroupComment(Base):
    __tablename__ = "group_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("group_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("GroupPost", back_populates="comments")
    user = relationship("User", back_populates="group_comments")


# ─── Verdict Battles ─────────────────────────────────────────────────────────

class VerdictBattle(Base):
    __tablename__ = "verdict_battles"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, nullable=False, index=True)
    media_type = Column(String, default="movie")
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    side_a_label = Column(String, nullable=False)
    side_b_label = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="active")  # active | completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User")
    arguments = relationship("BattleArgument", back_populates="battle", cascade="all, delete")
    votes = relationship("BattleVote", back_populates="battle", cascade="all, delete")


class BattleArgument(Base):
    __tablename__ = "battle_arguments"

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("verdict_battles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    side = Column(String, nullable=False)  # "a" or "b"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    battle = relationship("VerdictBattle", back_populates="arguments")
    user = relationship("User")


class BattleVote(Base):
    __tablename__ = "battle_votes"
    __table_args__ = (UniqueConstraint('battle_id', 'user_id', name='_battle_user_vote_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("verdict_battles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    side = Column(String, nullable=False)  # "a" or "b"

    battle = relationship("VerdictBattle", back_populates="votes")
    user = relationship("User")


# ─── User Badges ─────────────────────────────────────────────────────────────

class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_type = Column(String, nullable=False)  # gem_hunter | predictor | etc.
    badge_name = Column(String, nullable=False)
    movie_id = Column(Integer, nullable=True)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="badges")


# ─── Prediction Leagues ──────────────────────────────────────────────────────

class PredictionSeason(Base):
    __tablename__ = "prediction_seasons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "Oscars 2026"
    ceremony = Column(String, nullable=False)  # oscar | bafta | cannes | golden_globe
    status = Column(String, default="open")  # open | locked | completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    categories = relationship("PredictionCategory", back_populates="season", cascade="all, delete")


class PredictionCategory(Base):
    __tablename__ = "prediction_categories"

    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("prediction_seasons.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g. "Best Picture"
    nominees_json = Column(Text, nullable=False, default='[]')  # JSON array
    winner_movie_id = Column(Integer, nullable=True)  # null until announced

    season = relationship("PredictionSeason", back_populates="categories")
    predictions = relationship("UserPrediction", back_populates="category", cascade="all, delete")


class UserPrediction(Base):
    __tablename__ = "user_predictions"
    __table_args__ = (UniqueConstraint('user_id', 'category_id', name='_user_category_pred_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("prediction_categories.id"), nullable=False)
    predicted_movie_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="predictions")
    category = relationship("PredictionCategory", back_populates="predictions")


# ─── Admin: Franchises ───────────────────────────────────────────────────────

class Franchise(Base):
    """Admin-managed franchise (e.g. MCU, DCEU, Star Wars)."""
    __tablename__ = "franchises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String, default="#8B5CF6")  # hex color for UI
    icon_emoji = Column(String, default="🎬")
    movie_ids = Column(JSON, default=list)  # list of TMDB movie IDs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ─── Admin: Gem Overrides ────────────────────────────────────────────────────

class GemOverride(Base):
    """Admin-curated hidden gem movies (shown first on /gems page)."""
    __tablename__ = "gem_overrides"
    __table_args__ = (UniqueConstraint('movie_id', name='_gem_override_movie_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, nullable=False, index=True)
    title = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    vote_average = Column(Float, nullable=True)
    vote_count = Column(Integer, nullable=True)
    release_date = Column(String, nullable=True)
    overview = Column(Text, nullable=True)
    gem_score = Column(Float, default=9.0)
    rarity = Column(String, default="legendary")  # common | rare | legendary
    trailer_url = Column(String, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())


class MovieInterest(Base):
    __tablename__ = "movie_interests"
    __table_args__ = (UniqueConstraint('user_id', 'movie_id', name='_movie_interest_user_movie_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False, index=True)
    media_type = Column(String, default="movie")
    title = Column(String, nullable=True)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    release_date = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="interests")


# ─── Admin: Must Watch ───────────────────────────────────────────────────────

class MustWatch(Base):
    """Admin-curated 'Must Watch' movies (for the dedicated /must-watch page)."""
    __tablename__ = "must_watch"
    __table_args__ = (UniqueConstraint('movie_id', name='_must_watch_movie_id_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, nullable=False, index=True)
    title = Column(String, nullable=False)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    vote_average = Column(Float, nullable=True)
    release_date = Column(String, nullable=True)
    overview = Column(Text, nullable=True)
    trailer_url = Column(String, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())


class PasswordReset(Base):
    """Temporary storage for password reset verification codes."""
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RefreshToken(Base):
    """Hashed refresh tokens stored in DB for rotation and revocation."""
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)  # SHA-256 hash
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

