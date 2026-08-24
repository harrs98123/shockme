// Shared between the catalog server page (metadata) and its client component.
export const CATALOG_TYPE_MAP: Record<string, { title: string; description: string; endpoint: string }> = {
  trending: { title: 'Trending Now', description: 'The movies and shows everyone is watching right now.', endpoint: '/movies/trending' },
  'trending-indian': { title: 'Trending in India', description: 'The most popular Indian movies and shows trending right now.', endpoint: '/movies/trending-indian' },
  popular: { title: 'Popular Movies', description: 'The most popular movies on plotmint right now.', endpoint: '/movies/popular' },
  'top-rated': { title: 'Top Rated Features', description: 'The highest-rated movies of all time, ranked by audience score.', endpoint: '/movies/top-rated' },
  anime: { title: 'Japanese Anime', description: 'Discover the best Japanese anime movies and series.', endpoint: '/movies/anime' },
  series: { title: 'Popular TV Series', description: 'The most popular TV series to binge right now.', endpoint: '/movies/tv/popular' },
  upcoming: { title: 'Upcoming Movies', description: 'Upcoming movie releases you should have on your radar.', endpoint: '/movies/discover?sort_by=primary_release_date.desc' },
  'now-playing': { title: 'Now Playing', description: 'Movies currently playing and trending in theaters.', endpoint: '/movies/discover?sort_by=popularity.desc' },
};
