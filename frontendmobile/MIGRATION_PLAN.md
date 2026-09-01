# plotmint — Next.js → React Native (Expo) Migration Plan

**Source of truth:** `frontend/` (Next.js 16 web app) and `backend/` (FastAPI).
**Target:** `frontendmobile/` (Expo SDK 57 / React Native 0.86 / Expo Router 57).

Both `frontend/` and `backend/` are treated as **read-only**. Every change happens in `frontendmobile/`.

---

## 1. Existing architecture (analysis)

### 1.1 Scale

| Area | Count | LOC |
|---|---|---|
| Next.js routes (`page.tsx`) | 43 | ~16,250 |
| Shared components | 64 | ~17,480 |
| `lib/` (api, auth, types, utils, toast, seo, data) | 9 files | ~1,845 |
| **Total frontend TS/TSX** | — | **~35,600** |
| Backend routers | 26 modules | ~170 endpoints |

### 1.2 Web stack

| Concern | Web implementation |
|---|---|
| Framework | Next.js 16.2 App Router, React 19.2, React Compiler on |
| Rendering | 8 server components (data-fetching pages), 94 `'use client'` files |
| Styling | Tailwind v4 (`@theme inline`) + `globals.css` design tokens + **1,559 inline `style={{}}` objects** + 2,465 `className`s |
| Animation | `framer-motion` in **63 files**, `animejs` (HeroSection, HomeAnimeDecor), CSS keyframes |
| Icons | `lucide-react` (near-universal), plus SVG files in `public/` |
| Fonts | `next/font/google` — Poppins (headings), Inter (body) |
| HTTP | `axios` singleton `lib/api.ts` + ~60 raw `fetch()` calls scattered in components |
| Server state | None. Ad-hoc `useState` + `useEffect` per screen |
| Client state | `AuthProvider` React Context only. No Redux/Zustand |
| Auth storage | `localStorage` (`cinematch_token`, `cinematch_user`) + a `cinematch_token` cookie for `proxy.ts` |
| Route guard | `proxy.ts` exists but `PROTECTED = []` and `matcher: []` → **no middleware guard is active**; guards are per-screen `useEffect` redirects |
| Toasts | Custom framework-agnostic `ToastManager` pub/sub class + web renderer |
| Captcha | Cloudflare Turnstile (`@marsidev/react-turnstile`) — required by `/auth/login` and `/auth/register` |
| Avatars | `@dicebear/core` + `@dicebear/collection` (deterministic SVG) |
| Uploads | `next-cloudinary` upload widget (avatars, collection banners) |
| Markdown | `react-markdown` (AI explanation, alternate endings) |
| Confetti | `canvas-confetti` (finder, avatar customizer, Moctale meter) |

### 1.3 Design tokens (from `app/globals.css` — port verbatim)

```
bg           #0F0F0F     surface      #1A1A1A     surface-2    #242424
primary      #E50914     primary-hov  #ff1a24     primary-glow rgba(229,9,20,.3)
text         #FFFFFF     text-muted   #9CA3AF     text-dim     #6B7280
border       rgba(255,255,255,0.1)    radius 10px / radius-lg 20px
gold (ratings) #FFC107 / #fbbf24      destructive #ef4444
ambient page glow: radial-gradient(circle at -10% -10%, #3b2355, #150E1B 45%, #0F0F0F 80%)
```

Fonts: **Poppins** 400–900 (headings/buttons), **Inter** 300–600 (body).
The app is **dark-only** — there is no light theme to port.

---

## 2. Complete route list & mobile mapping

`frontendmobile/` uses `src/app/` as the Expo Router root (already configured via the template's `tsconfig` paths and layout).

### 2.1 Tab shell

The web `Navbar` already ships a 4-item mobile bottom bar: **Home / Search / Browse / Menu**. We keep that shape but promote `Feed` (a primary social surface) into the bar and move `Menu` into a header avatar plus a modal sheet.

**Proposed tabs:** `Home` · `Search` · `Browse` · `Feed` · `Profile`

### 2.2 Full mapping

| # | Web route | Mobile route | Nav pattern | Auth | Priority |
|---|---|---|---|---|---|
| 1 | `/` | `(tabs)/index.tsx` | Tab | public | **P0** |
| 2 | `/search` | `(tabs)/search.tsx` | Tab | public | **P0** |
| 3 | `/browse` | `(tabs)/browse/index.tsx` | Tab + stack | public | P1 |
| 4 | `/feed` | `(tabs)/feed.tsx` | Tab | required | P2 |
| 5 | `/profile` | `(tabs)/profile.tsx` | Tab | required | P1 |
| 6 | `/movie/[id]` | `movie/[id].tsx` | Stack push | public | **P0** |
| 7 | `/tv/[id]` | `tv/[id].tsx` | Stack push | public | **P0** |
| 8 | `/person/[id]` | `person/[id].tsx` | Stack push | public | P2 |
| 9 | `/catalog/[type]` | `catalog/[type].tsx` | Stack push | public | **P0** |
| 10 | `/(auth)/login` | `(auth)/login.tsx` | Auth stack | guest | **P0** |
| 11 | `/(auth)/register` | `(auth)/register.tsx` | Auth stack | guest | **P0** |
| 12 | `/(auth)/forgot-password` | `(auth)/forgot-password.tsx` | Auth stack | guest | P1 |
| 13 | `/verify` | folded into the forgot-password flow | — | guest | P1 |
| 14 | `/browse/category` | `(tabs)/browse/category.tsx` | Stack | public | P1 |
| 15 | `/browse/genre` | `(tabs)/browse/genre.tsx` | Stack | public | P1 |
| 16 | `/browse/country` | `(tabs)/browse/country.tsx` | Stack | public | P1 |
| 17 | `/browse/language` | `(tabs)/browse/language.tsx` | Stack | public | P1 |
| 18 | `/browse/anime` | `(tabs)/browse/anime.tsx` | Stack | public | P1 |
| 19 | `/browse/family` | `(tabs)/browse/family.tsx` | Stack | public | P2 |
| 20 | `/browse/awards` | `(tabs)/browse/awards.tsx` | Stack | public | P2 |
| 21 | `/browse/franchise` | `(tabs)/browse/franchise.tsx` | Stack | public | P2 |
| 22 | `/upcoming` | `upcoming.tsx` | Stack (from menu) | public | P1 |
| 23 | `/must-watch` | `must-watch.tsx` | Stack | public | P1 |
| 24 | `/gems` | `gems.tsx` | Stack | public | P2 |
| 25 | `/mood` | `mood.tsx` | Stack | public | P2 |
| 26 | `/finder` | `finder.tsx` | Stack, full-screen | public | P2 |
| 27 | `/swipe` | `swipe.tsx` | Stack, full-screen gesture | required | P3 |
| 28 | `/tierlist` | `tierlist.tsx` | Stack, drag & drop | required | P3 |
| 29 | `/collections` | `collections/index.tsx` | Stack | mixed | P2 |
| 30 | `/collections/[id]` | `collections/[id].tsx` | Stack | mixed | P2 |
| 31 | `/groups` | `groups/index.tsx` | Stack | required | P3 |
| 32 | `/groups/[id]` | `groups/[id].tsx` | Stack | required | P3 |
| 33 | `/predictions` | `predictions.tsx` | Stack | required | P3 |
| 34 | `/universe` | `universe.tsx` | Stack | public | P3 |
| 35 | `/watch-parties` | `watch-parties.tsx` | Stack | required | P3 |
| 36 | `/user/[id]` | `user/[id].tsx` | Stack | public | P2 |
| 37 | `/profile/[id]` | redirect → `user/[id]` | — | public | P2 |
| 38 | `/gallery` | `gallery.tsx` or **drop** | Stack | public | P4 |
| 39–43 | `/admin/*` (6 routes) | **Out of scope for v1** — see §7 | — | admin | P4 |

**Deep links:** `app.json` `scheme` becomes `plotmint`. Every stack route above is deep-linkable by construction under Expo Router. `/search?q=` maps to `useLocalSearchParams().q`; `/mood?concept=` likewise.

---

## 3. Component hierarchy

### 3.1 Layout / chrome

```
RootLayout (src/app/_layout.tsx)
├── SafeAreaProvider + StatusBar (light, translucent)
├── QueryClientProvider (TanStack Query)
├── AuthProvider              ← replaces lib/auth-context.tsx
├── ToastHost                 ← RN renderer over the reused ToastManager
└── Stack
    ├── (auth)/…              hides the tab bar (web: NavbarWrapper hideChrome)
    ├── (tabs)/…              Home · Search · Browse · Feed · Profile
    └── stack + modal routes
```

Web `Navbar.tsx` (1,404 LOC) and `Footer.tsx` (319 LOC) collapse into: the bottom tab bar, per-screen `Stack.Screen` headers, and a `MenuSheet` modal. `Footer` becomes a small About/Legal block inside Profile — footers are not a mobile pattern.

### 3.2 Component migration buckets

**A — Directly reusable (logic only, zero UI):**
`lib/types.ts` · `lib/utils.ts` (`getEnglishTitle`, transliteration, `isNonLatin`; drop `cn`) · `lib/catalogTypes.ts` · `lib/finderData.ts` (457 LOC of pure data) · `lib/toast.tsx` **ToastManager class only** · `lib/api.ts` URL helpers (`posterUrl`, `backdropUrl`, `releaseYear`) · `components/ScenePlayer.tsx` `extractYouTubeId` and the curated-clip map · `components/Avatar/dicebear.ts` (needs an SVG renderer) · the genre-id→name map currently duplicated inside `MovieCard`.

**B — Logic reusable, UI must be rewritten (the bulk):**
`MovieCard` · `MovieRow` · `TrendingRankedRow` · `HeroSection` · `MovieDetailHero` · `SeasonsSection` · `CastSection` · `MoctaleMeter` · `CommentSection` / `CommentThread` · `DebateSection` · `VerdictBattle` · `FeedPostCard` · `PostComposer` · `PollCard` · `CommunityPosts` · `CollectionDetailClient` · `CatalogClient` · `PersonProfileClient` · `StarRating` · `WhereToWatch` · `WatchOrderPanel` · `ExplanationEngine` · `AlternateEnding` · `RecommendationsSection` · `FeaturedCollections` · all `*Button` (Favorite / Watchlist / Watched / AddToCollection) · all skeletons.

**C — Mobile-specific rewrite (no web analogue worth keeping):**
Bottom tab bar · header + back · `MenuSheet` · pull-to-refresh · `FlatList`/`FlashList` virtualization for every row and grid · keyboard-aware forms · haptics on card actions · native share sheet.

**D — Web-only, must be replaced or dropped:**

| Web-only | Replacement |
|---|---|
| `localStorage` token/user | `expo-secure-store` (tokens) + `AsyncStorage` (non-sensitive cache) |
| `document.cookie` (proxy guard) | Not needed — no server middleware on mobile |
| `sessionStorage` (`app/page.tsx`) | TanStack Query cache |
| `window.location.href` redirects | `router.replace()` |
| `window.innerWidth` breakpoints (13 files) | `useWindowDimensions()` |
| `window.open` / `<a target="_blank">` | `expo-linking` `openURL` / `expo-web-browser` |
| `navigator.share` / copy-link (`ShareModal`) | RN `Share` API + `expo-clipboard` |
| `next/image` | `expo-image` (placeholder, transition, disk cache built in) |
| `next/link` | `expo-router` `Link` / `router.push` |
| `next/font/google` | `expo-font` + `@expo-google-fonts/poppins`, `/inter` |
| SVGs in `public/*.svg` | `react-native-svg` + `react-native-svg-transformer`, or PNG exports |
| `lucide-react` | `lucide-react-native` (same icon names → mechanical port) |
| `framer-motion` (63 files) | `react-native-reanimated` v4 (already installed) + `LayoutAnimation` |
| `animejs` (Hero, AnimeDecor) | Reanimated timeline |
| `canvas-confetti` | `react-native-confetti-cannon`, only if the 3 screens survive triage |
| `react-markdown` | `react-native-markdown-display` |
| `next-cloudinary` upload widget | `expo-image-picker` → direct unsigned POST to the Cloudinary REST API |
| `@marsidev/react-turnstile` | Turnstile inside a `react-native-webview` bridge (see §5) |
| `@dicebear/*` (SVG string output) | Keep `@dicebear/core`, render the string via `react-native-svg` `SvgXml` |
| YouTube `<iframe>` (`ScenePlayer`, trailers) | `expo-video` for MP4; WebView-embedded player for YouTube |
| `/telemetry/stream-viewer` iframe | **Drop from mobile v1** — server-rendered HTML page, no native equivalent |
| SEO: `generateMetadata`, `sitemap.ts`, `robots.ts`, JSON-LD, `lib/seo.ts` | **N/A on mobile — delete, do not port** |
| `app/api/mod/route.ts` (Next route handler) | Server-only; holds `MOD_API_KEY`, must never ship in the app bundle |
| Hover states (`mc-root.hovered` expand-on-hover card) | Press → navigate; long-press → quick-action sheet |

---

## 4. API dependency map

Base URL from `EXPO_PUBLIC_API_URL` (default `http://localhost:8000`; Android emulator uses `http://10.0.2.2:8000`).

Planned `src/api/` layout — one module per backend router:

| Module | Backend prefix | Key endpoints |
|---|---|---|
| `client.ts` | — | axios instance, auth interceptor, 401 → refresh → retry, error normalizer |
| `auth.ts` | `/auth` | `check-username`, `register`, `login`, `refresh`, `logout`, `me`, `PATCH`/`PUT profile`, `forgot-password`, `verify-code`, `reset-password` |
| `movies.ts` | `/movies` | `trending`, `popular`, `trending-indian`, `top-rated`, `search`, `discover`, `genres`, `anime`, `upcoming`, `languages`, `countries`, `categories`, `{id}`, `{id}/custom-info`, `{id}/franchise-info`, `person/{id}`, `universe/{person_id}`, `universe/search/{query}` |
| `tv.ts` | `/movies/tv` | `trending`, `popular`, `top-rated`, `discover`, `{tv_id}/season/{n}` |
| `lists.ts` | `/favorites` `/watchlist` `/watched` | `GET ""`, `POST ""`, `DELETE /{movie_id}`, `GET /ids` (×3, identical shape) |
| `ratings.ts` | `/ratings` | `POST ""`, `GET /{movie_id}` |
| `moctale.ts` | `/moctale` | `POST /{movie_id}`, `GET /my`, `DELETE /{movie_id}`, `GET /{movie_id}`, review likes + comments |
| `comments.ts` | `/comments` | list, create, update, delete, like |
| `debates.ts` | `/debates` | list, `{id}/replies`, create, vote |
| `battles.ts` | `/battles` | list, `featured`, `{id}`, create, `{id}/arguments`, `{id}/vote` |
| `collections.ts` | `/collections` | create, list, `my`, `rank-pool` (+add/remove), `{id}`, `{id}/add`, `{id}/remove/{movie_id}`, `{id}/banner`, delete |
| `social.ts` | (root) | `POST /posts/`, react, poll vote, comment, `posts/movie/{id}`, `{id}/comments`, `feed/following`, `feed/for-you` |
| `profile.ts` | `/user` | `feed/following`, `suggestions`, `{id}/follow`, `{id}/followers`, `{id}/following`, `{id}/public`, `by-username/{u}/public` |
| `groups.ts` | `/groups` | CRUD, members, join, posts, comments, `my/posts` |
| `recommendations.ts` | `/recommendations`, `/recommendations/mood` | personalized feed, mood POST |
| `ai.ts` | `/explanation`, `/alternate-ending` | `{movie_id}` |
| `gems.ts` | `/hidden-gems` | list, `badges` |
| `predictions.ts` | `/predictions` | `seasons`, `seasons/{id}`, `predict`, `leaderboard/{id}` |
| `tierlist.ts` | `/tierlist` | `all`, `""`, `save`, `{id}` |
| `interests.ts` | `/interests` | `toggle`, `{movie_id}`, `user/all` |
| `watchParties.ts` | `/watch-parties` | create, `{id}/join`, `{id}`, list |
| `curated.ts` | `/admin/*/public` | `must-watch/public`, `gems/public`, `franchises/public` (public read-only) |

**Contract rules to preserve:**

- `Authorization: Bearer <access_token>`, `Content-Type: application/json`.
- Page params are `?page=`, 1-indexed. TMDB list responses are `{ results, page, total_pages }`.
- `/favorites`, `/watchlist`, `/watched` `POST` returns **400 on duplicate**, and the web treats 400 as success — mobile must do the same.
- `DELETE` returns 204.
- `/movies/{id}` already returns `credits`, `videos`, `similar`, `recommendations`, `images`, `watch/providers`, `keywords`, `release_dates`, `content_ratings` via `append_to_response` — one request per detail screen, no fan-out needed.

The OpenAPI schema is served at `GET /openapi.json` in non-production and should be used to verify request/response shapes before each feature slice.

---

## 5. Authentication architecture

**Backend (unchanged):** JWT access token plus a rotating refresh token. `POST /auth/login` and `/auth/register` return `{ access_token, refresh_token, token_type, user }`. `POST /auth/refresh` takes `{ refresh_token }` and **rotates** (revokes the old, issues a new pair). `POST /auth/logout` blacklists the access token and revokes every refresh token for the user. Refresh tokens expire after 7 days. Login is rate-limited to 10/min, register to 5/min. Repeated failed logins trigger account lockout.

**Gap in the web app worth fixing on mobile:** the web client **discards `refresh_token`** and never calls `/auth/refresh`, so sessions simply die when the access token expires. Mobile will use the full refresh flow. No backend change is required — the endpoint already exists.

**Mobile design:**

| Item | Storage |
|---|---|
| `access_token` | `expo-secure-store` |
| `refresh_token` | `expo-secure-store` |
| `user` object | `AsyncStorage` (non-sensitive, for instant cold-start paint), re-validated via `GET /auth/me` |

Flow:

1. **Session restore** — on boot, read SecureStore, hydrate the user from AsyncStorage, then call `GET /auth/me` in the background to validate. `authStatus: 'loading' | 'authenticated' | 'guest'` gates the router.
2. **Login / register** — the Turnstile token is mandatory at the backend. Mobile obtains it via a `react-native-webview` hosting the Turnstile widget on the existing site origin and posting the token back over `postMessage`. The site key comes from `EXPO_PUBLIC_TURNSTILE_SITE_KEY`. *(No backend change: `validate_turnstile` already accepts real Cloudflare tokens and has a documented dev bypass when the test secret key is configured.)*
3. **Authenticated requests** — an axios request interceptor injects the bearer token.
4. **401 handling** — a response interceptor performs a single-flight `/auth/refresh`, retries the original request, and on refresh failure purges SecureStore and calls `router.replace('/(auth)/login')`. Requests queued during a refresh are replayed.
5. **Protected routes** — an `<AuthGate>` in the relevant `_layout.tsx` redirects guests to `(auth)/login?from=<path>`, mirroring the web's `?from=` behaviour.
6. **Logout** — `POST /auth/logout`, clear SecureStore and AsyncStorage, reset the Query cache, `router.replace('/')`.

---

## 6. State management map

| State | Web today | Mobile |
|---|---|---|
| All API / server data | per-screen `useState` + `useEffect` | **TanStack Query** — keys `['movies','trending']`, `['movie', id]`, `['feed','for-you']`, … |
| Auth session (user, token, status) | React Context | **Zustand** store + SecureStore persistence (readable by the axios interceptor outside React) |
| List membership (fav / watchlist / watched ids) | duplicated `useState` across ~8 screens | **TanStack Query** `['lists','ids']` with optimistic mutations — one source of truth |
| Toasts | `ToastManager` singleton | reuse the class verbatim, new RN renderer |
| Theme | CSS variables | static `theme.ts` constants (dark-only, no state) |
| Form state | raw `useState` | **React Hook Form + Zod** for login, register, forgot-password, profile edit, post composer, collection create |
| Ephemeral UI (modals, tabs, filters) | `useState` | `useState` — unchanged |

**Deliberately not global:** movie data, feed, collections. They belong in the Query cache, not in Zustand.

---

## 7. Explicitly out of scope for v1

| Area | Reason |
|---|---|
| `/admin/*` (6 routes, ~2,900 LOC) | Desktop-first data-admin tables (franchise editor, dashboards). No mobile use case. The public read endpoints (`/admin/must-watch/public`, `/admin/gems/public`, `/admin/franchises/public`) **are** consumed by mobile. |
| SEO surface (`sitemap.ts`, `robots.ts`, `lib/seo.ts`, JSON-LD, `generateMetadata`) | Meaningless in a native app. |
| `/telemetry/stream-viewer` iframe, `TelemetryAnalyzer`, `SecurityVerification` | Server-rendered HTML plus a browser-fingerprint surface with no native equivalent. |
| `DomeGallery` / `/gallery` | A 3D CSS-transform showcase; would need a full WebGL rewrite for no functional gain. Re-evaluate after P3. |

Anything here that turns out to be required gets promoted with an explicit note in `MIGRATION_STATUS.md`.

---

## 8. Dependencies

### Already installed (Expo SDK 57 — keep)

`expo-router` · `expo-image` · `expo-font` · `expo-linking` · `expo-splash-screen` · `expo-status-bar` · `expo-system-ui` · `expo-web-browser` · `expo-constants` · `react-native-reanimated` 4.5 · `react-native-gesture-handler` · `react-native-safe-area-context` · `react-native-screens` · `react-native-worklets`

### To add (justified, staged — nothing installed before its phase)

| Package | Phase | Why |
|---|---|---|
| `axios` | P0 | Mirrors the web client exactly; interceptors for auth + refresh |
| `@tanstack/react-query` | P0 | Server state, caching, retry, pull-to-refresh |
| `zustand` | P0 | Auth store readable outside React (needed by the axios interceptor) |
| `expo-secure-store` | P0 | Token storage — required by the brief |
| `@react-native-async-storage/async-storage` | P0 | Non-sensitive cache (user object, query persistence) |
| `lucide-react-native` + `react-native-svg` | P0 | 1:1 icon parity with `lucide-react` |
| `@expo-google-fonts/poppins`, `@expo-google-fonts/inter` | P0 | Exact typography parity |
| `react-hook-form`, `zod`, `@hookform/resolvers` | P0 (auth forms) | The register form has username-availability and password-strength rules |
| `react-native-webview` | P0 (auth) | Turnstile bridge; later, YouTube embeds |
| `@shopify/flash-list` | P1 | Large poster grids and rows — measurably better than `FlatList` here |
| `expo-haptics` | P1 | Card actions, swipe deck |
| `expo-clipboard` | P2 | `ShareModal` copy-link |
| `expo-image-picker` | P2 | Avatar and collection-banner upload to Cloudinary |
| `react-native-markdown-display` | P2 | AI explanation, alternate endings |
| `expo-video` | P2 | Trailers |
| `@dicebear/core`, `@dicebear/collection` | P2 | Avatar parity (renders through `react-native-svg`) |
| `react-native-confetti-cannon` | P3 | Only if the finder / Moctale celebrations survive triage |
| `react-native-draggable-flatlist` | P3 | Tier-list drag & drop |

### Styling decision — StyleSheet design system, not NativeWind

The web app is **not** a clean Tailwind codebase: 1,559 inline `style={{}}` objects against 2,465 `className`s, with heavy hover, `backdrop-filter`, and CSS-keyframe usage that has no NativeWind equivalent. Porting via class strings would mean rewriting them anyway, and NativeWind v4 on RN 0.86 / React 19.2 (SDK 57) is not a combination I can verify as stable here.

Plan: `src/theme/` exposing `colors`, `spacing`, `radius`, `typography`, `shadows` (mirroring the CSS tokens verbatim) plus primitives (`Text`, `Button`, `Card`, `Input`, `Badge`, `Pill`) — the same tokens, expressed as `StyleSheet.create`.

If you would rather have NativeWind, say so and I will validate it against SDK 57 before Phase 2 — it changes the primitive layer only, not the architecture.

---

## 9. Target structure

```
frontendmobile/
├── src/
│   ├── app/                     # Expo Router root
│   │   ├── _layout.tsx          # providers + root Stack
│   │   ├── (auth)/              # login, register, forgot-password
│   │   ├── (tabs)/              # index, search, browse/, feed, profile
│   │   ├── movie/[id].tsx   tv/[id].tsx   person/[id].tsx
│   │   ├── catalog/[type].tsx   collections/   groups/   user/[id].tsx
│   │   └── +not-found.tsx
│   ├── api/                     # client.ts + one module per backend router
│   ├── components/
│   │   ├── ui/                  # Text, Button, Input, Card, Badge, Pill, Skeleton, Sheet
│   │   ├── media/               # MovieCard, MovieRow, PosterImage, RatingBadge
│   │   ├── social/              # FeedPostCard, PollCard, CommentThread
│   │   └── layout/              # ScreenHeader, EmptyState, ErrorState, LoadingState
│   ├── hooks/                   # useAuth, useMovies, useLists, useDebounce
│   ├── stores/                  # auth.store.ts
│   ├── lib/                     # toast (ported manager), storage, format
│   ├── types/                   # ported from frontend/lib/types.ts
│   ├── constants/               # genres, catalogTypes, finderData
│   ├── theme/                   # colors, spacing, typography, shadows
│   └── config/                  # env.ts
├── assets/
├── app.json · eas.json · package.json · tsconfig.json
└── MIGRATION_PLAN.md · MIGRATION_STATUS.md
```

The template's `src/components/{animated-icon,app-tabs,hint-row,themed-text,themed-view,web-badge,external-link}.tsx`, `src/app/explore.tsx`, and `src/hooks/use-color-scheme*.ts` are Expo starter scaffolding and get removed as their replacements land.

---

## 10. Migration order

| Phase | Contents | Gate |
|---|---|---|
| **0 · Foundation** | env config, theme tokens, fonts, UI primitives, `api/client.ts`, auth store + SecureStore, Query provider, toast host, root layout + tab shell, Loading/Error/Empty states | `tsc --noEmit` clean; app boots on Android with an empty themed shell |
| **1 · Auth** | Turnstile WebView bridge → login → register → forgot-password → session restore → refresh-on-401 → `<AuthGate>` | Real login against local FastAPI; token survives an app restart; 401 refreshes |
| **2 · Home** | `PosterImage` → `MovieCard` → `MovieRow` → `HeroSection` → `TrendingRankedRow` → `FeaturedCollections` → Home screen | All 6 rows render from the live backend; pull-to-refresh; optimistic fav/watchlist toggles |
| **3 · Detail** | `movie/[id]`, `tv/[id]` — hero, cast, seasons, where-to-watch, trailer, rating, Moctale meter | Deep link `plotmint://movie/550` opens the screen |
| **4 · Search & Catalog** | Search tab (debounced), `catalog/[type]` infinite scroll | Paging plus empty and error states verified |
| **5 · Browse** | Browse hub and category / genre / country / language / anime / family / awards / franchise | — |
| **6 · Lists & Profile** | Profile tab, favorites / watchlist / watched, `user/[id]`, followers and following, profile edit | — |
| **7 · Social** | Feed, post composer, polls, comments, debates, verdict battles, collections, groups | — |
| **8 · Extras** | Upcoming, must-watch, gems, mood, finder, predictions, universe, swipe, tierlist, watch-parties | — |
| **9 · Hardening** | Perf pass (FlashList windowing, image sizing, memo), a11y, offline and error polish, EAS build config | Physical-device pass |

Dependency rule: no screen starts before its components exist, and no component starts before its API module and types exist.

---

## 11. Testing strategy

Per component and screen, in order:

1. `npx tsc --noEmit` — must be clean. No `any` to silence errors, no `eslint-disable`.
2. `npx expo lint`.
3. `npx expo start` → Android emulator, then a physical Android device for anything touching gestures, the keyboard, or the camera roll.
4. Manual checklist per screen: **UI · navigation · back gesture · touch targets · API success · loading · error (airplane mode) · empty (no results) · unauthorized (logged out) · forms and keyboard avoidance · scroll performance · image load and failure · safe areas (notch + Android nav bar)**.
5. Side-by-side against the web screen at `localhost:3000` for information parity and business-rule parity.
6. Only then mark `COMPLETED` in `MIGRATION_STATUS.md`. `IMPLEMENTED` means "compiles and renders" — it is **not** `COMPLETED`.

**Backend for local testing:** run `backend/run.py`. The Android emulator reaches the host at `10.0.2.2`; a physical device needs the LAN IP in `EXPO_PUBLIC_API_URL`. FastAPI `CORS_ORIGINS` does not affect native requests (CORS is a browser mechanism), so **no backend change is needed** for the emulator or a device.

---

## 12. Known risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Turnstile is mandatory for login and register** | Blocks all auth | WebView bridge (§5). Verified: the backend needs no change. |
| framer-motion in 63 files | Largest single cost | Build a small set of Reanimated presets (fadeInUp, scale-press, slide-in) and reuse them; do not port animations one by one |
| Hover-driven `MovieCard` expand panel | Core home UX has no touch analogue | Press → detail; long-press → quick-action sheet |
| Cloudinary unsigned upload from native | Avatar and banner upload | Direct REST POST using the existing unsigned preset — no backend change |
| Very large screens (`admin/dashboard` 1,121 LOC, `user/[id]` 1,035) | Scope | `user/[id]` is split into sub-components; admin is deferred (§7) |
| `MOD_API_KEY` lives in `frontend/.env.local` | Must never ship in the app | Only `EXPO_PUBLIC_*` values reach mobile; `MOD_API_KEY` stays server-side |

---

## 13. Backend change requests

**None so far.** Every mobile requirement is served by an existing endpoint. If one arises, work stops and the request is raised with: why it is required, which endpoint is affected, the exact change needed, and the impact on `frontend/`.

---

## 14. Local development setup (added during Phase 1)

The dev `backend/.env` points `DATABASE_URL` at a **remote** Supabase Postgres, so exercising any
write path from the app touches shared data. For safe testing, run a throwaway backend against
SQLite instead. `backend/` itself is never modified.

```bash
# 1. Copy the backend source (no caches, no db files) somewhere scratch
tar --exclude='__pycache__' --exclude='*.db*' -cf - -C backend . | (mkdir -p /tmp/backend-local && tar -xf - -C /tmp/backend-local)

# 2. Copy .env and override just the database
#    database.py calls load_dotenv(override=True), so OS env vars will NOT win —
#    the file has to change, which is why we work on a copy.
sed 's|^DATABASE_URL=.*|DATABASE_URL=sqlite:///./cinematch_local.db|' backend/.env > /tmp/backend-local/.env

# 3. Run it on a spare port. PYTHONIOENCODING matters on Windows — see
#    MIGRATION_STATUS.md "Backend findings" #2.
cd /tmp/backend-local && PYTHONIOENCODING=utf-8 python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

Then point the app at it:

```
# frontendmobile/.env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8001
```

`EXPO_PUBLIC_*` values are inlined at bundle time, so **Metro must be restarted** after editing
`.env` — a fast refresh will not pick the change up.

Notes:
- A fresh SQLite DB is empty, but movie data comes from TMDB at request time, so Home, Search,
  Browse and the detail screens all work. Collections, gems and must-watch will be empty until the
  `backend/seed_*.py` scripts are run against it.
- `/auth/refresh` needs the SQLite timezone fix (Backend findings #1) to work locally.
- `/auth/logout` needs `REDIS_URL` to point at a running Redis (Backend findings #3).
