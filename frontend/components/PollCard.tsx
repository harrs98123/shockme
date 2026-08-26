'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, BarChart2, Loader2, Check } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import toast from '@/lib/toast';

interface PollPayload {
  options?: string[];
  votes?: number[];
  percentages?: number[];
  total_votes?: number;
  user_vote?: number | null;
  voters?: Record<string, number>;
}

interface PollCardProps {
  postId: number;
  payload?: PollPayload | null;
  onVoteSuccess?: (updatedPayload: PollPayload) => void;
  className?: string;
}

export default function PollCard({
  postId,
  payload,
  onVoteSuccess,
  className = '',
}: PollCardProps) {
  const { user } = useAuth();

  const options = useMemo(() => payload?.options || [], [payload?.options]);

  // Initial voted option from user_vote or voters map
  const initialUserVote = useMemo(() => {
    if (payload?.user_vote !== undefined && payload?.user_vote !== null) {
      return payload.user_vote;
    }
    if (user && payload?.voters && payload.voters[String(user.id)] !== undefined) {
      return payload.voters[String(user.id)];
    }
    return null;
  }, [payload?.user_vote, payload?.voters, user]);

  const [selectedOption, setSelectedOption] = useState<number | null>(initialUserVote);
  const [localVotes, setLocalVotes] = useState<number[]>(() => {
    return payload?.votes && payload.votes.length === options.length
      ? payload.votes
      : options.map(() => 0);
  });
  const [isVoting, setIsVoting] = useState(false);

  // Sync state if payload prop updates from external refetch
  useEffect(() => {
    if (initialUserVote !== null && initialUserVote !== undefined) {
      setSelectedOption(initialUserVote);
    }
    if (payload?.votes && payload.votes.length === options.length) {
      setLocalVotes(payload.votes);
    }
  }, [initialUserVote, payload?.votes, options.length]);

  const totalVotes = useMemo(() => {
    return localVotes.reduce((acc, v) => acc + (v || 0), 0);
  }, [localVotes]);

  const percentages = useMemo(() => {
    if (totalVotes === 0) return options.map(() => 0);
    return localVotes.map((v) => Math.round(((v || 0) / totalVotes) * 100));
  }, [localVotes, totalVotes, options]);

  const highestVoteIdx = useMemo(() => {
    if (totalVotes === 0) return -1;
    let max = -1;
    let maxIdx = -1;
    localVotes.forEach((v, idx) => {
      if ((v || 0) > max) {
        max = v || 0;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [localVotes]);

  const hasVoted = selectedOption !== null && selectedOption !== undefined;

  const handleVote = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please log in to vote in community polls.');
      return;
    }

    if (isVoting) return;

    // Optimistic UI update
    const previousSelected = selectedOption;
    const newVotes = [...localVotes];

    if (previousSelected !== null && previousSelected !== index && previousSelected !== undefined) {
      newVotes[previousSelected] = Math.max(0, newVotes[previousSelected] - 1);
    }
    if (previousSelected !== index) {
      newVotes[index] = (newVotes[index] || 0) + 1;
    }

    setSelectedOption(index);
    setLocalVotes(newVotes);
    setIsVoting(true);

    try {
      const res = await api.post(`/posts/${postId}/poll/vote`, {
        option_index: index,
      });

      if (res.data?.payload) {
        const updated = res.data.payload as PollPayload;
        if (updated.votes) setLocalVotes(updated.votes);
        if (updated.user_vote !== undefined) setSelectedOption(updated.user_vote);
        onVoteSuccess?.(postId, updated);
      }
      toast.success('Vote recorded! 🗳️');
    } catch (err: any) {
      setSelectedOption(previousSelected);
      setLocalVotes(payload?.votes || []);
      toast.error('Failed to register vote. Try again.');
    } finally {
      setIsVoting(false);
    }
  };

  if (!options || options.length === 0) return null;

  return (
    <div
      className={`my-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col gap-2.5 select-none ${className}`}
      style={{
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Option Rows */}
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const pct = percentages[i] || 0;
          const count = localVotes[i] || 0;
          const isLeader = hasVoted && i === highestVoteIdx && count > 0;

          return (
            <button
              key={i}
              type="button"
              onClick={(e) => handleVote(i, e)}
              disabled={isVoting}
              className="relative w-full rounded-xl overflow-hidden text-left p-3.5 transition-all group flex items-center justify-between border cursor-pointer"
              style={{
                background: isSelected
                  ? 'rgba(229, 9, 20, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                borderColor: isSelected
                  ? 'rgba(229, 9, 20, 0.45)'
                  : isLeader
                  ? 'rgba(251, 191, 36, 0.3)'
                  : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Animated Progress Bar Fill */}
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 pointer-events-none rounded-xl"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(229,9,20,0.2) 0%, rgba(229,9,20,0.35) 100%)'
                      : isLeader
                      ? 'linear-gradient(90deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.18) 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                />
              )}

              {/* Option Text & Checkmark */}
              <div className="relative z-10 flex items-center gap-2.5 min-w-0 pr-3">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all"
                  style={{
                    borderColor: isSelected
                      ? 'var(--primary, #E50914)'
                      : 'rgba(255, 255, 255, 0.3)',
                    background: isSelected ? 'var(--primary, #E50914)' : 'transparent',
                  }}
                >
                  {isSelected ? (
                    <CheckCircle2 size={12} className="text-white fill-current" />
                  ) : null}
                </div>

                <span
                  className={`text-sm font-semibold truncate ${
                    isSelected ? 'text-white font-bold' : 'text-white/85'
                  }`}
                >
                  {opt}
                </span>
              </div>

              {/* Percentage & Vote Count */}
              {hasVoted ? (
                <div className="relative z-10 shrink-0 flex items-center gap-2">
                  {isLeader && (
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Top
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-primary' : 'text-white/60'
                    }`}
                  >
                    {pct}%
                  </span>
                  <span className="text-[11px] text-white/35 font-medium">
                    ({count})
                  </span>
                </div>
              ) : (
                <div className="relative z-10 shrink-0 text-xs font-semibold text-white/40 group-hover:text-white/80 transition-colors">
                  Vote
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-1 pt-1 text-xs text-white/40">
        <div className="flex items-center gap-1.5">
          <BarChart2 size={13} className="text-white/50" />
          <span>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
          {hasVoted && (
            <span className="text-white/30">• Click any option to change vote</span>
          )}
        </div>

        {isVoting ? (
          <div className="flex items-center gap-1 text-primary text-xs font-semibold">
            <Loader2 size={12} className="animate-spin" /> Saving vote...
          </div>
        ) : hasVoted ? (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Check size={12} strokeWidth={2.5} /> Voted
          </span>
        ) : (
          <span className="text-white/40">Click option to vote</span>
        )}
      </div>
    </div>
  );
}
