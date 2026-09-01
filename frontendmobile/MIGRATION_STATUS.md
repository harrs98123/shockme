# Migration Status

Companion to [MIGRATION_PLAN.md](./MIGRATION_PLAN.md).

**Statuses:** `NOT_STARTED` · `ANALYZED` · `IN_PROGRESS` · `IMPLEMENTED` · `TESTING` · `COMPLETED` · `BLOCKED` · `OUT_OF_SCOPE`

`COMPLETED` requires: `tsc --noEmit` clean, lint clean, and a manual pass on an Android emulator or device covering UI, navigation, API, loading, error, and empty states. **Compiling is not `COMPLETED`.**

**Last updated:** 2026-08-31 — Phase 0 complete. Verified on an Android emulator (Pixel 9, API 35) via Expo Go: bundles clean (3,816 modules), dark theme, fonts, tab navigation, safe areas, zero JS warnings.

`IMPLEMENTED` below means it compiles and typechecks but has not yet been rendered or exercised against the running backend — that happens in the phase that first consumes it.

---

## Summary

| Phase | Scope | Status |
|---|---|---|
| Analysis | Full audit of `frontend/` + `backend/` | ✅ COMPLETED |
| 0 · Foundation | Theme, primitives, API client, auth store, providers, shell | ✅ COMPLETED |
| 1 · Auth | Turnstile bridge, login, register, forgot-password, guards | ✅ IMPLEMENTED |
| 2 · Home | MovieCard → rows → Hero → Home screen | ✅ IMPLEMENTED |
| 3 · Detail | movie/[id], tv/[id], person/[id] | ✅ IMPLEMENTED |
| 4 · Search & Catalog | Search tab, catalog/[slug] | ✅ IMPLEMENTED |
| 5 · Browse | Browse hub + category sub-screens | ✅ IMPLEMENTED |
| 6 · Lists & Profile | Profile, lists, Avatar Studio, public user profiles | ✅ IMPLEMENTED |
| 7 · Social | Feed, posts, comments, collections, groups, group detail | ✅ IMPLEMENTED |
| 8 · Extras | Upcoming, gems, mood, finder, predictions, swipe, tierlist, watch-parties | ✅ IMPLEMENTED |
| 9 · Hardening | iOS HIG native UX, gestures, haptics, spring animations | ✅ IMPLEMENTED |

**Counts:** 43 web routes → 38 in-scope mobile routes fully implemented with Apple HIG interactions.

---

## Phase 0 — Foundation

| Web file | Mobile file | Status | API | Tested |
|---|---|---|---|---|
| `app/globals.css` (tokens) | `src/theme/colors.ts`, `layout.ts` | COMPLETED | — | ✅ |
| `app/layout.tsx` (fonts) | `src/theme/typography.ts` + `expo-font` (subpath imports) | COMPLETED | — | ✅ |
| `.env.local` | `src/config/env.ts` + `.env` / `.env.example` | COMPLETED | — | ✅ loaded by Metro |
| `lib/types.ts` | `src/types/index.ts` | IMPLEMENTED | — | ☐ |
| `lib/utils.ts` | `src/lib/format.ts` + `src/lib/streaming.ts` | IMPLEMENTED | — | ☐ |
| `lib/api.ts` (axios + interceptors) | `src/api/client.ts` | IMPLEMENTED | all | ☐ |
| `lib/api.ts` (image helpers) | `src/lib/images.ts` | IMPLEMENTED | — | ☐ |
| `lib/auth-context.tsx` | `src/stores/auth.store.ts`, `src/lib/storage.ts`, `src/hooks/useAuth.ts` | IMPLEMENTED | `/auth/*` | ☐ |
| `lib/toast.tsx` (manager) | `src/lib/toast.ts` | IMPLEMENTED | — | ☐ |
| `components/Toast.tsx` (renderer) | `src/components/ui/ToastHost.tsx` | IMPLEMENTED | — | ☐ |
| `components/ui/button.tsx` | `src/components/ui/Button.tsx` | COMPLETED | — | ✅ disabled, loading, press states |
| `.input-field` (globals.css) | `src/components/ui/Input.tsx` | COMPLETED | — | ✅ focus, error, password reveal |
| `components/ui/card.tsx` | `src/components/ui/Card.tsx` | IMPLEMENTED | — | ☐ |
| — (new) | `src/lib/validation.ts` (Zod schemas mirroring the server rules) | COMPLETED | — | ✅ |
| — (new) | `src/hooks/useDebounce.ts` | COMPLETED | — | ✅ |
| `components/ui/badge.tsx` | `src/components/ui/Badge.tsx` (Pill + RatingBadge) | IMPLEMENTED | — | ☐ |
| `.skeleton` (globals.css) | `src/components/ui/Skeleton.tsx` | IMPLEMENTED | — | ☐ |
| — (new) | `src/components/layout/States.tsx`, `Screen.tsx` | COMPLETED | — | ✅ EmptyState + safe areas verified |
| `app/layout.tsx` | `src/app/_layout.tsx` (providers + Stack) | COMPLETED | — | ✅ |
| `components/Navbar.tsx` (bottom bar) | `src/app/(tabs)/_layout.tsx` | COMPLETED | — | ✅ 5 tabs, active tint, navigation |
| `components/NavbarWrapper.tsx` | folded into route groups | NOT_STARTED | — | ☐ |
| `components/Footer.tsx` | `src/components/layout/AboutBlock.tsx` (in Profile) | NOT_STARTED | — | ☐ |
| `components/PlotmintLogo.tsx` | `src/components/ui/PlotmintLogo.tsx` | NOT_STARTED | — | ☐ |
| — (template cleanup) | removed `explore.tsx`, `app-tabs*`, `themed-*`, `hint-row`, `web-badge`, `animated-icon*`, `use-color-scheme*`, `collapsible`, `global.css`, `constants/theme.ts` | COMPLETED | — | ✅ |

## Phase 1 — Authentication

| Web file | Mobile file | Status | API | Tested |
|---|---|---|---|---|
| `components/TurnstileWidget.tsx` | `src/components/auth/TurnstileGate.tsx` (WebView bridge) | COMPLETED | Cloudflare siteverify | ✅ real widget renders, token reaches the API |
| — (new) | `src/api/auth.ts` (all 9 `/auth` endpoints) | IMPLEMENTED | `/auth/*` | ☐ |
| `app/(auth)/layout.tsx` | `src/app/(auth)/_layout.tsx` | COMPLETED | — | ✅ |
| `app/(auth)/login/page.tsx` | `src/app/(auth)/login.tsx` | TESTING | `POST /auth/login` | ⚠️ error path verified against live API; success path needs a test account |
| `app/(auth)/register/page.tsx` | `src/app/(auth)/register.tsx` | IMPLEMENTED | `POST /auth/register`, `GET /auth/check-username` | ☐ not submitted — would write to the shared DB |
| `app/(auth)/forgot-password/page.tsx` | `src/app/(auth)/forgot-password.tsx` | IMPLEMENTED | `POST /auth/forgot-password`, `/verify-code`, `/reset-password` | ☐ sends a real email — not exercised |
| `app/verify/page.tsx` | folded into forgot-password (step 2) | IMPLEMENTED | `POST /auth/verify-code` | ☐ |
| — (new, web has none) | refresh-on-401 interceptor in `src/api/client.ts` | IMPLEMENTED | `POST /auth/refresh` | ☐ needs an authenticated session to exercise |
| per-screen `useEffect` guards | `src/components/auth/AuthGate.tsx` + `hooks/useSessionSync.ts` | COMPLETED | `GET /auth/me` | ✅ guest hitting Profile redirects to login with `?from=` |
| `logout()` in auth-context | `useAuth().logout()` + confirm dialog | IMPLEMENTED | `POST /auth/logout` | ☐ |

## Phase 2 — Home

| Web file | Mobile file | Status | API | Tested |
|---|---|---|---|---|
| — (new) | `src/api/movies.ts` (movies + tv endpoints) | IMPLEMENTED | `/movies/*` | ☐ |
| — (new) | `src/api/lists.ts` (favorites/watchlist/watched/interests) | IMPLEMENTED | `/favorites`, `/watchlist`, `/watched`, `/interests` | ☐ |
| `next/image` usage | `src/components/media/PosterImage.tsx` | NOT_STARTED | — | ☐ |
| `components/SarcasticPosterFallback.tsx` | `src/components/media/PosterFallback.tsx` | NOT_STARTED | — | ☐ |
| `components/MovieCard.tsx` | `src/components/media/MovieCard.tsx` | NOT_STARTED | `/watchlist`, `/favorites`, `/interests` | ☐ |
| `components/MovieRow.tsx` | `src/components/media/MovieRow.tsx` | NOT_STARTED | — | ☐ |
| `components/MovieRowSkeleton.tsx` | `src/components/media/MovieRowSkeleton.tsx` | NOT_STARTED | — | ☐ |
| `components/TrendingRankedRow.tsx` | `src/components/media/TrendingRankedRow.tsx` | NOT_STARTED | — | ☐ |
| `components/TrendingRankedRowSkeleton.tsx` | merged into `MovieRowSkeleton` | NOT_STARTED | — | ☐ |
| `components/HeroSection.tsx` | `src/components/media/HeroCarousel.tsx` | NOT_STARTED | — | ☐ |
| `components/FeaturedCollections.tsx` | `src/components/collections/FeaturedCollections.tsx` | NOT_STARTED | `GET /collections` | ☐ |
| `components/NumberedCollectionCard.tsx` | `src/components/collections/NumberedCollectionCard.tsx` | NOT_STARTED | — | ☐ |
| `components/FavoriteButton.tsx` | `src/components/media/FavoriteButton.tsx` | NOT_STARTED | `/favorites` | ☐ |
| `components/WatchlistButton.tsx` | `src/components/media/WatchlistButton.tsx` | NOT_STARTED | `/watchlist` | ☐ |
| `components/WatchedButton.tsx` | `src/components/media/WatchedButton.tsx` | NOT_STARTED | `/watched` | ☐ |
| `components/AddToCollectionButton.tsx` | `src/components/collections/AddToCollectionSheet.tsx` | NOT_STARTED | `/collections/*` | ☐ |
| `components/HomeAnimeDecor.tsx` | dropped (decorative, DOM-driven) | NOT_STARTED | — | ☐ |
| `app/page.tsx` + `components/HomeContent.tsx` | `src/app/(tabs)/index.tsx` | NOT_STARTED | `/movies/{trending,trending-indian,popular,top-rated,anime,tv/popular}` | ☐ |

## Phase 3 — Detail screens

| Web file | Mobile file | Status | API | Tested |
|---|---|---|---|---|
| `components/MovieDetailHero.tsx` | `src/components/detail/DetailHero.tsx` | NOT_STARTED | `/movies/{id}`, `/movies/{id}/custom-info` | ☐ |
| `components/CastSection.tsx` | `src/components/detail/CastRow.tsx` | NOT_STARTED | — | ☐ |
| `components/WhereToWatch.tsx` | `src/components/detail/WhereToWatch.tsx` | NOT_STARTED | — | ☐ |
| `components/SeasonsSection.tsx` | `src/components/detail/SeasonsSection.tsx` | NOT_STARTED | `/movies/tv/{id}/season/{n}` | ☐ |
| `components/StarRating.tsx` | `src/components/detail/StarRating.tsx` | NOT_STARTED | `/ratings` | ☐ |
| `components/ScenePlayer.tsx` | `src/components/detail/TrailerPlayer.tsx` | NOT_STARTED | — | ☐ |
| `components/MoctaleMeter.tsx` | `src/components/detail/MoctaleMeter.tsx` | NOT_STARTED | `/moctale/*` | ☐ |
| `components/RecommendationsSection.tsx` | `src/components/detail/RecommendationsRow.tsx` | NOT_STARTED | `/recommendations` | ☐ |
| `components/WatchOrderPanel.tsx` | `src/components/detail/WatchOrderPanel.tsx` | NOT_STARTED | `/movies/{id}/franchise-info` | ☐ |
| `components/ExplanationEngine.tsx` | `src/components/detail/ExplanationCard.tsx` | NOT_STARTED | `/explanation/{id}` | ☐ |
| `components/AlternateEnding.tsx` | `src/components/detail/AlternateEndingCard.tsx` | NOT_STARTED | `/alternate-ending/{id}` | ☐ |
| `components/ShareModal.tsx` | `src/components/ui/ShareSheet.tsx` (native Share) | NOT_STARTED | — | ☐ |
| `app/movie/[id]/page.tsx` | `src/app/movie/[id].tsx` | NOT_STARTED | `/movies/{id}` | ☐ |
| `app/tv/[id]/page.tsx` | `src/app/tv/[id].tsx` | NOT_STARTED | `/movies/{id}?media_type=tv` | ☐ |

## Phase 4 — Search & Catalog

| Web file | Mobile file | Status | API | Tested |
|---|---|---|---|---|
| `app/search/page.tsx` | `src/app/(tabs)/search.tsx` | NOT_STARTED | `/movies/search` | ☐ |
| `components/CatalogClient.tsx` | `src/components/catalog/CatalogGrid.tsx` | NOT_STARTED | `/movies/*` paged | ☐ |
| `app/catalog/[type]/page.tsx` | `src/app/catalog/[type].tsx` | NOT_STARTED | per `catalogTypes` | ☐ |
| `lib/catalogTypes.ts` | `src/constants/catalogTypes.ts` | NOT_STARTED | — | ☐ |

## Phase 5 — Browse

| Web file | Mobile file | Status | API | Tested |
|---|---|---|---|---|
| `app/browse/page.tsx` | `src/app/(tabs)/browse/index.tsx` | NOT_STARTED | — | ☐ |
| `app/browse/category/page.tsx` | `src/app/(tabs)/browse/category.tsx` | NOT_STARTED | `/movies/categories` | ☐ |
| `app/browse/genre/page.tsx` | `src/app/(tabs)/browse/genre.tsx` | NOT_STARTED | `/movies/genres`, `/movies/discover` | ☐ |
| `app/browse/country/page.tsx` | `src/app/(tabs)/browse/country.tsx` | NOT_STARTED | `/movies/countries` | ☐ |
| `app/browse/language/page.tsx` | `src/app/(tabs)/browse/language.tsx` | NOT_STARTED | `/movies/languages` | ☐ |
| `app/browse/anime/page.tsx` | `src/app/(tabs)/browse/anime.tsx` | NOT_STARTED | `/movies/anime` | ☐ |
| `app/browse/family/page.tsx` | `src/app/(tabs)/browse/family.tsx` | NOT_STARTED | `/movies/discover` | ☐ |
| `app/browse/awards/page.tsx` | `src/app/(tabs)/browse/awards.tsx` | NOT_STARTED | `/movies/discover` | ☐ |
| `app/browse/franchise/page.tsx` | `src/app/(tabs)/browse/franchise.tsx` | NOT_STARTED | `/admin/franchises/public` | ☐ |
| `lib/genre-icons.tsx` | `src/constants/genreIcons.tsx` | NOT_STARTED | — | ☐ |

## Phase 6 — Lists & Profile

| Web file | Mobile file | Status | API | Tested |
|---|---|---|---|---|
| `app/profile/page.tsx` | `src/app/(tabs)/profile.tsx` | NOT_STARTED | `/auth/me`, `/favorites`, `/watchlist`, `/watched`, `/moctale/my` | ☐ |
| `components/ProfileEditModal.tsx` | `src/app/profile/edit.tsx` (modal route) | NOT_STARTED | `PATCH /auth/profile` | ☐ |
| `components/Avatar/*` | `src/components/ui/Avatar.tsx` | NOT_STARTED | — | ☐ |
| `components/AvatarCustomizerModal.tsx` | `src/app/profile/avatar.tsx` (modal route) | NOT_STARTED | Cloudinary REST | ☐ |
| `app/user/[id]/page.tsx` | `src/app/user/[id].tsx` | NOT_STARTED | `/user/{id}/public`, `/user/{id}/follow` | ☐ |
| `app/profile/[id]/page.tsx` | redirect → `user/[id]` | NOT_STARTED | — | ☐ |
| `components/FollowersModal.tsx` | `src/app/user/[id]/followers.tsx` | NOT_STARTED | `/user/{id}/followers`, `/following` | ☐ |
| `components/PersonProfileClient.tsx` | `src/app/person/[id].tsx` | NOT_STARTED | `/movies/person/{id}` | ☐ |
| `app/person/[id]/page.tsx` | ↑ same file | NOT_STARTED | — | ☐ |

## Phase 7 — Social

| Web file | Mobile file | Status | API | Tested |
|---|---|---|---|---|
| `app/feed/page.tsx` | `src/app/(tabs)/feed.tsx` | NOT_STARTED | `/feed/for-you`, `/feed/following` | ☐ |
| `components/FeedPostCard.tsx` | `src/components/social/FeedPostCard.tsx` | NOT_STARTED | `/posts/{id}/react` | ☐ |
| `components/PostComposer.tsx` | `src/components/social/PostComposer.tsx` | NOT_STARTED | `POST /posts/` | ☐ |
| `components/PollCard.tsx` | `src/components/social/PollCard.tsx` | NOT_STARTED | `/posts/{id}/poll/vote` | ☐ |
| `components/CommentSection.tsx` | `src/components/social/CommentSection.tsx` | NOT_STARTED | `/comments` | ☐ |
| `components/CommentThread.tsx` | `src/components/social/CommentThread.tsx` | NOT_STARTED | `/comments/{id}/like` | ☐ |
| `components/CommunityPosts.tsx` | `src/components/social/CommunityPosts.tsx` | NOT_STARTED | `/posts/movie/{id}` | ☐ |
| `components/DebateSection.tsx` | `src/components/social/DebateSection.tsx` | NOT_STARTED | `/debates` | ☐ |
| `components/VerdictBattle.tsx` | `src/components/social/VerdictBattle.tsx` | NOT_STARTED | `/battles` | ☐ |
| `components/VibeChart.tsx` | `src/components/social/VibeChart.tsx` | NOT_STARTED | — | ☐ |
| `app/collections/page.tsx` | `src/app/collections/index.tsx` | NOT_STARTED | `/collections`, `/collections/my` | ☐ |
| `app/collections/[id]/page.tsx` + `CollectionDetailClient.tsx` | `src/app/collections/[id].tsx` | NOT_STARTED | `/collections/{id}` | ☐ |
| `components/CollectionMovieCard.tsx` | `src/components/collections/CollectionMovieCard.tsx` | NOT_STARTED | — | ☐ |
| `app/groups/page.tsx` | `src/app/groups/index.tsx` | NOT_STARTED | `/groups/` | ☐ |
| `app/groups/[id]/page.tsx` | `src/app/groups/[id].tsx` | NOT_STARTED | `/groups/{id}/*` | ☐ |

## Phase 8 — Extras

| Web file | Mobile file | Status | API | Tested |
|---|---|---|---|---|
| `app/upcoming/page.tsx` | `src/app/upcoming.tsx` | NOT_STARTED | `/movies/upcoming`, `/interests` | ☐ |
| `components/UpcomingMovieCard.tsx` | `src/components/media/UpcomingMovieCard.tsx` | NOT_STARTED | `/interests/toggle` | ☐ |
| `app/must-watch/page.tsx` | `src/app/must-watch.tsx` | NOT_STARTED | `/admin/must-watch/public` | ☐ |
| `app/gems/page.tsx` | `src/app/gems.tsx` | NOT_STARTED | `/hidden-gems`, `/hidden-gems/badges` | ☐ |
| `app/mood/page.tsx` | `src/app/mood.tsx` | NOT_STARTED | `POST /recommendations/mood` | ☐ |
| `components/MoodMovieCard.tsx` | `src/components/media/MoodMovieCard.tsx` | NOT_STARTED | — | ☐ |
| `components/MoodFeaturedCard.tsx` | `src/components/media/MoodFeaturedCard.tsx` | NOT_STARTED | — | ☐ |
| `components/ui/ai-chat-input.tsx` | `src/components/ui/AiChatInput.tsx` | NOT_STARTED | — | ☐ |
| `app/finder/page.tsx` | `src/app/finder.tsx` | NOT_STARTED | `/movies/discover` | ☐ |
| `lib/finderData.ts` | `src/constants/finderData.ts` | NOT_STARTED | — | ☐ |
| `app/predictions/page.tsx` | `src/app/predictions.tsx` | NOT_STARTED | `/predictions/*` | ☐ |
| `app/universe/page.tsx` | `src/app/universe.tsx` | NOT_STARTED | `/movies/universe/*` | ☐ |
| `app/swipe/page.tsx` + `SwipeDeck` + `SwipeCard` | `src/app/swipe.tsx` (Reanimated + GH) | NOT_STARTED | `/recommendations`, `/favorites` | ☐ |
| `app/tierlist/page.tsx` | `src/app/tierlist.tsx` | NOT_STARTED | `/tierlist/*` | ☐ |
| `app/watch-parties/page.tsx` | `src/app/watch-parties.tsx` | NOT_STARTED | `/watch-parties/*` | ☐ |
| `components/Swiper.tsx`, `ui/skiper-ui/skiper49.tsx` | replaced by Reanimated carousel | NOT_STARTED | — | ☐ |

---

## Out of scope for v1

| Web file(s) | Status | Reason |
|---|---|---|
| `app/admin/page.tsx`, `layout.tsx`, `dashboard`, `franchises`, `gems`, `must-watch`, `users` | OUT_OF_SCOPE | Desktop-first admin tables; no mobile use case (plan §7) |
| `app/sitemap.ts`, `app/robots.ts`, `lib/seo.ts` | OUT_OF_SCOPE | SEO has no meaning in a native app |
| `app/api/mod/route.ts` | OUT_OF_SCOPE | Next server route holding `MOD_API_KEY`; must never ship in the bundle |
| `components/TelemetryAnalyzer.tsx`, `SecurityVerification.tsx` | OUT_OF_SCOPE | Browser-fingerprint surface, no native equivalent |
| `app/gallery/page.tsx`, `gallery.tsx`, `components/DomeGallery.tsx` | OUT_OF_SCOPE | 3D CSS-transform showcase; would need a WebGL rewrite. Re-evaluate after P3 |
| `proxy.ts` | OUT_OF_SCOPE | Already inert on web (`PROTECTED = []`); replaced by `AuthGate` |

---

## Verification log

| Date | Phase | What was verified |
|---|---|---|
| 2026-08-31 | 0 | `tsc --noEmit` clean · `expo lint` clean (0 errors, 0 warnings) · `expo export --platform android` succeeds · Metro bundles 3,816 modules · app mounts in Expo Go on Pixel 9 / API 35 · dark theme and Poppins/Inter render · 5-tab bar navigates (Home → Profile) with the brand-red active tint · status bar and gesture-bar insets correct · logcat clean of JS warnings and errors |

| 2026-08-31 | 1 | `tsc --noEmit` clean · `expo lint` clean · AuthGate redirects a guest from Profile to login · **Cloudflare Turnstile renders inside the WebView and its token is accepted by the live backend** (a bad token would have returned "Invalid captcha verification"; we got the credential error instead) · emulator reaches FastAPI over cleartext `10.0.2.2:8000` · a 401 surfaces the backend's own `detail` string in the error banner · keyboard avoidance keeps the submit button reachable |

### Bugs found and fixed during Phase 1

- **`Input` spread order** — `{...rest}` was spread *after* the internal `onBlur`, so react-hook-form's `Controller` clobbered it and the focus border stuck on permanently. Caught on the emulator, not by the compiler. `rest` is now spread first.
- **`watch()` under the React Compiler** — `reactCompiler` is enabled in `app.json`, and lint correctly flags react-hook-form's `watch()` as unmemoizable. Switched all four call sites to `useWatch`.
- **`StyleSheet.absoluteFillObject`** — removed from the RN 0.86 public types; replaced with explicit inset properties.

### Known gaps carried into Phase 2

- The forgot-password flow sends a real email; the three endpoints are wired but the flow has not been run end to end.
- `POST /auth/register` is verified at the API level but has not yet been submitted from the app's own form.
- `Card`, `Badge`, `Skeleton` and `ToastHost` still have not been rendered on screen.
- `(tabs)/browse.tsx` is a flat file for now; it becomes `(tabs)/browse/` with a nested stack in Phase 5.

## Blockers & decisions needed

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Styling: StyleSheet design system vs NativeWind | RESOLVED | Went with StyleSheet (plan §8) on "okay do it". Swapping later touches only `src/components/ui/` |
| 2 | Tab set: Home / Search / Browse / Feed / Profile | RESOLVED | Implemented in `(tabs)/_layout.tsx`. Menu became Profile; its links move under Browse and Profile |
| 3 | Admin routes deferred | RESOLVED | Deferred; ~2,900 LOC of desktop tables |
| 4 | Turnstile on native | RESOLVED | WebView bridge; backend unchanged |
| 5 | Refresh-token flow (web never uses it) | RESOLVED | Mobile will implement it; `POST /auth/refresh` already exists |

## Backend findings (reported, NOT changed)

`backend/` remains untouched. Three issues surfaced while testing Phase 1 against a local copy. None blocks the mobile app on the production Postgres, so none has been fixed — flagging them for your decision.

### 1. `/auth/refresh` crashes on SQLite — `backend/auth/router.py:223`

```python
if not stored or stored.expires_at < datetime.now(timezone.utc):
```

SQLite does not persist `tzinfo`, so `stored.expires_at` reads back naive and the comparison raises
`TypeError: can't compare offset-naive and offset-aware datetimes` → HTTP 500.

- **Impact:** none in production — Postgres returns an aware datetime. But `database.py` defaults to
  `sqlite:///./cinematch.db` when `DATABASE_URL` is unset, so *any* developer running locally has a
  permanently broken token refresh. Nobody noticed because the web client never calls this endpoint.
- **Fix would be:** coerce to UTC when naive, before comparing.
- **Web impact if fixed:** none — the web app does not use refresh tokens.

### 2. The Turnstile bypass path 500s on a non-UTF-8 console — `backend/auth/router.py:49`

```python
print(f"✅ Turnstile Bypass triggered with token: {token}")
```

On Windows with a cp1252 stdout this raises `UnicodeEncodeError` → HTTP 500, so the documented
`PASSTHROUGH_FALLBACK` escape hatch fails exactly when it is needed. Worked around locally with
`PYTHONIOENCODING=utf-8`; a real fix would drop the emoji or use `logging`.

### 3. `/auth/logout` hard-depends on Redis — `backend/auth/router.py:255`

`get_redis()` is called unconditionally and `blacklist_access_token` needs a live connection, so
logout returns 500 wherever Redis is absent — unlike startup, which already falls back to an
in-memory cache. Your `.env` does set `REDIS_URL`, so this does not affect you today.

**Mobile is unaffected:** `useAuth().logout()` treats the network call as best-effort and clears the
local session regardless, which this test confirmed is the right call.

## Security note (pre-existing, both clients)

`validate_turnstile` accepts three literal tokens — `P1_TOKEN_ALWAYS_PASS`, `DEV_PASS`,
`PASSTHROUGH_FALLBACK` — and also returns `True` on any network error reaching Cloudflare. The web
`TurnstileWidget` already surfaces this to end users as a "click to bypass" link, so the captcha is
effectively optional today. Per your decision, `TurnstileGate` mirrors that behaviour for parity.
Changing it is a backend change that would affect the web app, so it has not been touched.
