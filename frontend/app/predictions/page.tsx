'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { PredictionSeason, PredictionCategory, LeaderboardEntry } from '@/lib/types';
import { posterUrl } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PredictionsPage() {
  const { user } = useAuth();
  const [seasons, setSeasons] = useState<PredictionSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<PredictionSeason | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [predicting, setPredicting] = useState<number | null>(null);

  // Create season form
  const [newSeason, setNewSeason] = useState({ name: '', ceremony: 'oscar' });
  const [newCategories, setNewCategories] = useState([{ name: '', nominees: '' }]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      const res = await fetch(`${API_BASE}/predictions/seasons`);
      if (res.ok) {
        const data = await res.json();
        setSeasons(data);
        if (data.length > 0) loadSeason(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSeason = async (seasonId: number) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/predictions/seasons/${seasonId}`);
      setSelectedSeason(res.data);
      // Load leaderboard
      const lbRes = await fetch(`${API_BASE}/predictions/leaderboard/${seasonId}`);
      if (lbRes.ok) setLeaderboard(await lbRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const makePrediction = async (categoryId: number, movieId: number) => {
    if (!user) { window.location.href = '/login'; return; }
    setPredicting(categoryId);
    try {
      await api.post('/predictions/predict', {
        category_id: categoryId,
        predicted_movie_id: movieId
      });
      // Update local state
      if (selectedSeason) {
        setSelectedSeason({
          ...selectedSeason,
          categories: selectedSeason.categories.map(c =>
            c.id === categoryId ? { ...c, user_prediction_id: movieId } : c
          )
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPredicting(null);
    }
  };

  const createSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    try {
      const categories = newCategories.filter(c => c.name.trim()).map(c => ({
        name: c.name,
        nominees: c.nominees.split('\n').filter(n => n.trim()).map((line, idx) => {
          const parts = line.split('|');
          return {
            movie_id: parseInt(parts[0]?.trim()) || idx + 1,
            title: parts[1]?.trim() || line.trim(),
            poster_path: parts[2]?.trim() || null
          };
        })
      }));

      await api.post('/predictions/seasons', {
        name: newSeason.name,
        ceremony: newSeason.ceremony,
        categories
      });
      setShowCreate(false);
      setNewSeason({ name: '', ceremony: 'oscar' });
      setNewCategories([{ name: '', nominees: '' }]);
      fetchSeasons();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const ceremonies: Record<string, { icon: string; color: string }> = {
    oscar: { icon: '🏆', color: '#f59e0b' },
    bafta: { icon: '🎭', color: '#8b5cf6' },
    cannes: { icon: '🌴', color: '#10b981' },
    golden_globe: { icon: '🌍', color: '#3b82f6' }
  };

  const topBadges = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ minHeight: '100vh', paddingTop: 100 }}>
      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: '60px 24px 48px',
        background: 'radial-gradient(ellipse at center top, rgba(245,158,11,0.12) 0%, transparent 60%)'
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
        <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 12, lineHeight: 1.1 }}>
          Prediction <span style={{ color: '#f59e0b' }}>Leagues</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Predict Oscar, BAFTA & Cannes winners before the ceremonies. Compete with film lovers and climb the leaderboard.
        </p>
        {user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary"
            style={{ marginTop: 24, background: '#f59e0b' }}
          >
            {showCreate ? '✕ Cancel' : '+ Create Prediction Season'}
          </button>
        )}
      </div>

      <div className="container" style={{ paddingBottom: 64 }}>
        {/* Create Season Form */}
        {showCreate && (
          <form onSubmit={createSeason} style={{
            marginBottom: 48, padding: 32, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(0,0,0,0.2))',
            border: '1px solid rgba(245,158,11,0.2)'
          }}>
            <h2 style={{ fontSize: 22, marginBottom: 20 }}>Create Prediction Season</h2>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input
                className="input-field"
                placeholder="Season name (e.g. Oscars 2026)"
                value={newSeason.name}
                onChange={e => setNewSeason({ ...newSeason, name: e.target.value })}
                style={{ flex: 1 }}
                required
              />
              <select
                className="input-field"
                value={newSeason.ceremony}
                onChange={e => setNewSeason({ ...newSeason, ceremony: e.target.value })}
                style={{ width: 180 }}
              >
                <option value="oscar">🏆 Oscars</option>
                <option value="bafta">🎭 BAFTA</option>
                <option value="cannes">🌴 Cannes</option>
                <option value="golden_globe">🌍 Golden Globe</option>
              </select>
            </div>

            <h3 style={{ fontSize: 16, marginBottom: 12, color: 'var(--text-muted)' }}>Categories</h3>
            {newCategories.map((cat, idx) => (
              <div key={idx} style={{ marginBottom: 16, padding: 16, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <input
                  className="input-field"
                  placeholder={`Category name (e.g. Best Picture)`}
                  value={cat.name}
                  onChange={e => {
                    const updated = [...newCategories];
                    updated[idx].name = e.target.value;
                    setNewCategories(updated);
                  }}
                  style={{ marginBottom: 8 }}
                />
                <textarea
                  className="input-field"
                  placeholder={`Nominees (one per line): movie_id|Title|poster_path\ne.g. 123|Oppenheimer|/xyz.jpg`}
                  value={cat.nominees}
                  onChange={e => {
                    const updated = [...newCategories];
                    updated[idx].nominees = e.target.value;
                    setNewCategories(updated);
                  }}
                  style={{ minHeight: 80, resize: 'vertical' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setNewCategories([...newCategories, { name: '', nominees: '' }])}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                + Add Category
              </button>
              <button type="submit" className="btn-primary" disabled={creating} style={{ flex: 1, background: '#f59e0b' }}>
                {creating ? 'Creating...' : 'Create Season'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ display: 'flex', gap: 16 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, flex: 1 }} />)}
          </div>
        ) : seasons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>No Prediction Seasons Yet</h2>
            <p style={{ color: 'var(--text-muted)' }}>Be the first to create a prediction season and start competing!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {/* Season Selector */}
            <div style={{ flex: '0 0 280px' }}>
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>🎬 Seasons</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {seasons.map(season => {
                  const cer = ceremonies[season.ceremony] || ceremonies.oscar;
                  const isSelected = selectedSeason?.id === season.id;
                  return (
                    <button
                      key={season.id}
                      onClick={() => loadSeason(season.id)}
                      style={{
                        padding: '16px 18px', borderRadius: 14, textAlign: 'left',
                        background: isSelected ? `${cer.color}15` : 'var(--surface)',
                        border: `2px solid ${isSelected ? cer.color : 'var(--border)'}`,
                        cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 12
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{cer.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{season.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                          {season.category_count} categories • {season.status.toUpperCase()}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <h2 style={{ fontSize: 18, marginBottom: 16 }}>🏅 Leaderboard</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {leaderboard.map((entry, idx) => (
                      <div key={entry.user_id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 12,
                        background: idx < 3 ? 'rgba(245,158,11,0.06)' : 'var(--surface)',
                        border: `1px solid ${idx < 3 ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: idx < 3 ? 20 : 14, fontWeight: 700, width: 28 }}>
                            {idx < 3 ? topBadges[idx] : `${idx + 1}.`}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{entry.user_name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {entry.correct_count}/{entry.total_predictions}
                          </span>
                          <span style={{
                            padding: '4px 10px', borderRadius: 8,
                            background: entry.score >= 70 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            color: entry.score >= 70 ? '#10b981' : '#f59e0b',
                            fontWeight: 800, fontSize: 13
                          }}>
                            {entry.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Categories & Predictions */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
                </div>
              ) : selectedSeason ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 24 }}>
                      {ceremonies[selectedSeason.ceremony]?.icon} {selectedSeason.name}
                    </h2>
                    <span style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                      background: selectedSeason.status === 'open' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: selectedSeason.status === 'open' ? '#10b981' : '#ef4444',
                      textTransform: 'uppercase'
                    }}>
                      {selectedSeason.status === 'open' ? '🟢 Open for Predictions' : selectedSeason.status === 'locked' ? '🔒 Locked' : '🏁 Completed'}
                    </span>
                  </div>

                  {selectedSeason.categories.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
                      No categories yet.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      {selectedSeason.categories.map(cat => (
                        <div key={cat.id} style={{
                          background: 'var(--surface)', borderRadius: 16, padding: 24,
                          border: '1px solid var(--border)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{cat.name}</h3>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                              {cat.total_predictions} predictions
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {cat.nominees.map(nominee => {
                              const isUserPick = cat.user_prediction_id === nominee.movie_id;
                              const isWinner = cat.winner_movie_id === nominee.movie_id;
                              const isCorrect = isUserPick && isWinner;

                              return (
                                <button
                                  key={nominee.movie_id}
                                  onClick={() => selectedSeason.status === 'open' && makePrediction(cat.id, nominee.movie_id)}
                                  disabled={selectedSeason.status !== 'open' || predicting === cat.id}
                                  style={{
                                    width: 110, textAlign: 'center',
                                    background: isCorrect ? 'rgba(16,185,129,0.15)' : isUserPick ? 'rgba(245,158,11,0.12)' : isWinner ? 'rgba(16,185,129,0.08)' : 'var(--bg)',
                                    border: `2px solid ${isCorrect ? '#10b981' : isUserPick ? '#f59e0b' : isWinner ? '#10b981' : 'var(--border)'}`,
                                    borderRadius: 12, padding: 10, cursor: selectedSeason.status === 'open' ? 'pointer' : 'default',
                                    transition: 'all 0.2s', position: 'relative',
                                    opacity: predicting === cat.id ? 0.5 : 1
                                  }}
                                >
                                  {isUserPick && (
                                    <div style={{
                                      position: 'absolute', top: -8, right: -8,
                                      width: 22, height: 22, borderRadius: '50%',
                                      background: isCorrect ? '#10b981' : '#f59e0b',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 11, fontWeight: 800, color: 'white', zIndex: 2
                                    }}>
                                      {isCorrect ? '✓' : '🎯'}
                                    </div>
                                  )}
                                  {isWinner && !isUserPick && (
                                    <div style={{
                                      position: 'absolute', top: -8, left: -8,
                                      fontSize: 16, zIndex: 2
                                    }}>🏆</div>
                                  )}
                                  <img
                                    src={posterUrl(nominee.poster_path, 'w154')}
                                    alt={nominee.title}
                                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                                  />
                                  <p style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2, color: 'var(--text)' }}>
                                    {nominee.title}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
