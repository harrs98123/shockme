'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import MovieRow from './MovieRow';
import { RecommendationResponse } from '@/lib/types';

export default function RecommendationsSection() {
  const { user } = useAuth();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchRecs();
  }, [user]);

  const fetchRecs = async () => {
    try {
      const res = await api.get('/recommendations');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) return null; // Don't show skeleton to avoid layout shift, or show a nice skeleton row
  if (!data?.results?.length) return null;

  const subtitle = data.based_on?.length > 0 
    ? `Based on your interest in ${data.based_on.map(g => {
        // Simple mapping (TMDB IDs to names, normally would map from a context)
        const map: Record<string, string> = { "28": "Action", "12": "Adventure", "16": "Animation", "35": "Comedy", "80": "Crime", "99": "Documentary", "18": "Drama", "10751": "Family", "14": "Fantasy", "36": "History", "27": "Horror", "10402": "Music", "9648": "Mystery", "10749": "Romance", "878": "Sci-Fi", "10770": "TV Movie", "53": "Thriller", "10752": "War", "37": "Western", "10759": "Action & Adventure", "10765": "Sci-Fi & Fantasy" };
        return map[g] || "these genres";
      }).join(', ')}`
    : 'Based on global popularity trends';

  return (
    <div style={{ background: 'linear-gradient(to bottom, transparent, rgba(229,9,20,0.05), transparent)' }}>
      <MovieRow 
        title="✨ Recommended for You" 
        subtitle={subtitle}
        movies={data.results} 
      />
    </div>
  );
}
