'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  movieId: number;
  mediaType?: 'movie' | 'tv';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ExplanationEngine({ movieId, mediaType = 'movie' }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/explanation/${movieId}?media_type=${mediaType}`);
      if (!res.ok) throw new Error('Failed to fetch explanation');

      const data = await res.json();
      setExplanation(data.explanation);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '2rem 0', width: '100%' }}>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: '28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: explanation ? 24 : 0, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
              AI Analysis
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4, margin: 0 }}>
              Deep dive into themes & cultural impact
            </p>
          </div>

          {!explanation && !loading && (
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchExplanation}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span style={{ opacity: 0.7 }}>✨</span> Why This {mediaType === 'tv' ? 'Series' : 'Movie'}?
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ padding: '32px 0', textAlign: 'center' }}
            >
              <div className="spinner" style={{
                width: 24, height: 24,
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px'
              }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                Analyzing themes and context...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: '#ef4444', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 10, marginTop: 16, fontSize: 12, border: '1px solid rgba(239, 68, 68, 0.1)' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {explanation && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="prose prose-invert max-w-none"
              style={{
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
                fontSize: 14
              }}
            >
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 12, color: '#fff' }} {...props} />,
                  h2: ({ node, ...props }) => <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10, color: '#fff' }} {...props} />,
                  h3: ({ node, ...props }) => <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 16, marginBottom: 8, color: '#fff' }} {...props} />,
                  p: ({ node, ...props }) => <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.6)' }} {...props} />,
                  ul: ({ node, ...props }) => <ul style={{ marginBottom: 16, paddingLeft: 20, color: 'rgba(255,255,255,0.6)', listStyleType: 'disc' }} {...props} />,
                  li: ({ node, ...props }) => <li style={{ marginBottom: 6 }} {...props} />,
                  strong: ({ node, ...props }) => <strong style={{ color: '#fff', fontWeight: 600 }} {...props} />,
                  em: ({ node, ...props }) => <em style={{ color: '#fff', fontStyle: 'italic' }} {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: '3px solid rgba(167, 139, 250, 0.5)', paddingLeft: 16, fontStyle: 'italic', margin: '20px 0', color: 'rgba(255,255,255,0.5)' }} {...props} />
                }}
              >
                {explanation}
              </ReactMarkdown>
            </motion.div>
          )}
        </AnimatePresence>

        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    </div>
  );
}
