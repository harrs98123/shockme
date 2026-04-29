'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { VerdictBattle, BattleArgument } from '@/lib/types';

interface Props {
  movieId: number;
  mediaType?: 'movie' | 'tv';
}

export default function VerdictBattleSection({ movieId, mediaType = 'movie' }: Props) {
  const { user } = useAuth();
  const [battles, setBattles] = useState<VerdictBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBattle, setExpandedBattle] = useState<number | null>(null);
  const [expandedBattleData, setExpandedBattleData] = useState<VerdictBattle | null>(null);

  // Create battle form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', side_a_label: '', side_b_label: '', description: ''
  });
  const [creating, setCreating] = useState(false);

  // Argument form
  const [argContent, setArgContent] = useState('');
  const [argSide, setArgSide] = useState<'a' | 'b' | null>(null);
  const [submittingArg, setSubmittingArg] = useState(false);

  useEffect(() => {
    fetchBattles();
  }, [movieId, mediaType]);

  const fetchBattles = async () => {
    try {
      const res = await api.get(`/battles?movie_id=${movieId}&media_type=${mediaType}`);
      setBattles(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login'; return; }
    setCreating(true);
    try {
      const res = await api.post('/battles', {
        movie_id: movieId,
        media_type: mediaType,
        ...createForm,
        duration_days: 7
      });
      setBattles([res.data, ...battles]);
      setShowCreate(false);
      setCreateForm({ title: '', side_a_label: '', side_b_label: '', description: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const expandBattle = async (battleId: number) => {
    if (expandedBattle === battleId) {
      setExpandedBattle(null);
      setExpandedBattleData(null);
      return;
    }
    try {
      const res = await api.get(`/battles/${battleId}`);
      setExpandedBattleData(res.data);
      setExpandedBattle(battleId);
    } catch (e) {
      console.error(e);
    }
  };

  const voteBattle = async (battleId: number, side: 'a' | 'b') => {
    if (!user) { window.location.href = '/login'; return; }
    try {
      const res = await api.post(`/battles/${battleId}/vote`, { side });
      // Update battles list
      setBattles(prev => prev.map(b => b.id === battleId ? { ...b, ...res.data } : b));
      if (expandedBattleData?.id === battleId) {
        setExpandedBattleData({ ...expandedBattleData, ...res.data });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitArgument = async (battleId: number) => {
    if (!user) { window.location.href = '/login'; return; }
    if (!argSide || !argContent.trim()) return;
    setSubmittingArg(true);
    try {
      const res = await api.post(`/battles/${battleId}/arguments`, {
        side: argSide,
        content: argContent
      });
      if (expandedBattleData) {
        setExpandedBattleData({
          ...expandedBattleData,
          arguments: [...expandedBattleData.arguments, res.data],
          argument_count: expandedBattleData.argument_count + 1
        });
      }
      setArgContent('');
      setArgSide(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingArg(false);
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getVotePercent = (a: number, b: number) => {
    const total = a + b;
    if (total === 0) return { a: 50, b: 50 };
    return { a: Math.round((a / total) * 100), b: Math.round((b / total) * 100) };
  };

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 16, padding: 32,
      border: '1px solid rgba(139, 92, 246, 0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ fontSize: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          ⚔️ Verdict Battles
        </h2>
        {user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: showCreate ? 'var(--surface-2)' : 'rgba(139, 92, 246, 0.15)',
              border: `1px solid ${showCreate ? 'var(--border)' : 'rgba(139, 92, 246, 0.3)'}`,
              color: showCreate ? 'var(--text-muted)' : '#8b5cf6',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {showCreate ? '✕ Cancel' : '+ New Battle'}
          </button>
        )}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Pick a side, make your case, and let the community decide.
      </p>

      {/* Create Battle Form */}
      {showCreate && (
        <form onSubmit={createBattle} style={{
          marginBottom: 28, padding: 24, borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,0,0,0.2))',
          border: '1px solid rgba(139,92,246,0.15)'
        }}>
          <input
            className="input-field"
            placeholder="Battle title (e.g. 'Is this the best sequel ever made?')"
            value={createForm.title}
            onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
            style={{ marginBottom: 12 }}
            required
          />
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                Side A
              </label>
              <input
                className="input-field"
                placeholder="e.g. Absolutely Yes"
                value={createForm.side_a_label}
                onChange={e => setCreateForm({ ...createForm, side_a_label: e.target.value })}
                style={{ borderColor: 'rgba(16,185,129,0.3)' }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                Side B
              </label>
              <input
                className="input-field"
                placeholder="e.g. No way, overrated"
                value={createForm.side_b_label}
                onChange={e => setCreateForm({ ...createForm, side_b_label: e.target.value })}
                style={{ borderColor: 'rgba(239,68,68,0.3)' }}
                required
              />
            </div>
          </div>
          <textarea
            className="input-field"
            placeholder="Optional description..."
            value={createForm.description}
            onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
            style={{ minHeight: 60, resize: 'vertical', marginBottom: 12 }}
          />
          <button className="btn-primary" disabled={creating} style={{ width: '100%' }}>
            {creating ? 'Creating...' : '⚔️ Launch Battle'}
          </button>
        </form>
      )}

      {/* Battles List */}
      {loading ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : battles.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', padding: '20px 0' }}>
          No battles yet. Start one!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {battles.map((battle) => {
            const pct = getVotePercent(battle.side_a_votes, battle.side_b_votes);
            const isExpanded = expandedBattle === battle.id;
            const timeLeft = getTimeRemaining(battle.ends_at);
            const isEnded = timeLeft === 'Ended';

            return (
              <div key={battle.id} style={{
                background: 'var(--bg)', borderRadius: 14, overflow: 'hidden',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}>
                {/* Battle Header */}
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6' }}>{battle.creator_name}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 99,
                        background: isEnded ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: isEnded ? '#ef4444' : '#10b981',
                        fontWeight: 700
                      }}>
                        {isEnded ? '🏁 Ended' : `⏱ ${timeLeft}`}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {battle.argument_count} arguments
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, lineHeight: 1.3 }}>
                    {battle.title}
                  </h3>

                  {/* Vote Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>
                        {battle.side_a_label} ({pct.a}%)
                      </span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>
                        {battle.side_b_label} ({pct.b}%)
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{
                        width: `${pct.a}%`,
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                        borderRadius: '99px 0 0 99px',
                        transition: 'width 0.5s ease'
                      }} />
                      <div style={{
                        width: `${pct.b}%`,
                        background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                        borderRadius: '0 99px 99px 0',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>

                  {/* Vote Buttons */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => voteBattle(battle.id, 'a')}
                      disabled={isEnded}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 10, cursor: isEnded ? 'not-allowed' : 'pointer',
                        background: battle.user_vote === 'a' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.03)',
                        border: `2px solid ${battle.user_vote === 'a' ? '#10b981' : 'transparent'}`,
                        color: battle.user_vote === 'a' ? '#10b981' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                        opacity: isEnded ? 0.5 : 1
                      }}
                    >
                      ✅ {battle.side_a_label} ({battle.side_a_votes})
                    </button>
                    <button
                      onClick={() => voteBattle(battle.id, 'b')}
                      disabled={isEnded}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 10, cursor: isEnded ? 'not-allowed' : 'pointer',
                        background: battle.user_vote === 'b' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.03)',
                        border: `2px solid ${battle.user_vote === 'b' ? '#ef4444' : 'transparent'}`,
                        color: battle.user_vote === 'b' ? '#ef4444' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                        opacity: isEnded ? 0.5 : 1
                      }}
                    >
                      ❌ {battle.side_b_label} ({battle.side_b_votes})
                    </button>
                  </div>

                  <button
                    onClick={() => expandBattle(battle.id)}
                    style={{
                      marginTop: 12, width: '100%', padding: '8px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#8b5cf6', fontSize: 12, fontWeight: 700,
                      transition: 'color 0.2s'
                    }}
                  >
                    {isExpanded ? '▲ Collapse' : `▼ View ${battle.argument_count} Arguments`}
                  </button>
                </div>

                {/* Expanded Arguments */}
                {isExpanded && expandedBattleData && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: 20, background: 'rgba(0,0,0,0.15)' }}>
                    {expandedBattleData.arguments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                        {expandedBattleData.arguments.map((arg: BattleArgument) => (
                          <div key={arg.id} style={{
                            padding: 14, borderRadius: 10,
                            borderLeft: `4px solid ${arg.side === 'a' ? '#10b981' : '#ef4444'}`,
                            background: 'rgba(255,255,255,0.03)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                                {arg.author_name}
                              </span>
                              <span style={{
                                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                                background: arg.side === 'a' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                color: arg.side === 'a' ? '#10b981' : '#ef4444',
                                fontWeight: 700, textTransform: 'uppercase'
                              }}>
                                {arg.side === 'a' ? expandedBattleData.side_a_label : expandedBattleData.side_b_label}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              {arg.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '12px 0', marginBottom: 16 }}>
                        No arguments yet. Be the first to make your case!
                      </p>
                    )}

                    {/* Add Argument */}
                    {user && !isEnded && (
                      <div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                          <button
                            onClick={() => setArgSide('a')}
                            style={{
                              flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: argSide === 'a' ? 'rgba(16,185,129,0.2)' : 'transparent',
                              border: `1px solid ${argSide === 'a' ? '#10b981' : 'var(--border)'}`,
                              color: argSide === 'a' ? '#10b981' : 'var(--text-dim)',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ {expandedBattleData.side_a_label}
                          </button>
                          <button
                            onClick={() => setArgSide('b')}
                            style={{
                              flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: argSide === 'b' ? 'rgba(239,68,68,0.2)' : 'transparent',
                              border: `1px solid ${argSide === 'b' ? '#ef4444' : 'var(--border)'}`,
                              color: argSide === 'b' ? '#ef4444' : 'var(--text-dim)',
                              cursor: 'pointer'
                            }}
                          >
                            ❌ {expandedBattleData.side_b_label}
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            className="input-field"
                            placeholder={argSide ? "Make your argument..." : "Pick a side first"}
                            value={argContent}
                            onChange={e => setArgContent(e.target.value)}
                            disabled={!argSide}
                            onKeyDown={e => e.key === 'Enter' && submitArgument(battle.id)}
                            style={{ flex: 1 }}
                          />
                          <button
                            onClick={() => submitArgument(battle.id)}
                            disabled={!argSide || !argContent.trim() || submittingArg}
                            className="btn-primary"
                            style={{ padding: '10px 20px', fontSize: 12 }}
                          >
                            {submittingArg ? '...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
