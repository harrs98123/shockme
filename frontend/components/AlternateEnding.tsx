'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function AlternateEnding({ movieId, mediaType = 'movie' }: { movieId: number | string, mediaType?: 'movie' | 'tv' }) {
  const [endingType, setEndingType] = useState<string>('twist');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const generateEnding = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch(`${API_BASE}/alternate-ending/${movieId}?media_type=${mediaType}&ending_type=${endingType}`);
      if (!res.ok) {
        throw new Error('Failed to generate alternate ending. Please try again later.');
      }
      const data = await res.json();
      setResult(data.alternate_ending);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const types = [
    { id: 'dark', label: 'Dark', icon: '🌑' },
    { id: 'happy', label: 'Happy', icon: '✨' },
    { id: 'twist', label: 'Twist', icon: '🌪️' }
  ];

  return (
    <section className="alternate-ending-section" style={{ margin: '2rem 0', width: '100%' }}>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
                Alternate Ending
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                AI-generated cinematic "What If" scenarios
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {types.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setEndingType(t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${endingType === t.id ? 'rgba(167, 139, 250, 0.4)' : 'rgba(255,255,255,0.05)'}`,
                    background: endingType === t.id ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
                    color: endingType === t.id ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
            onClick={generateEnding}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%' }} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span style={{ opacity: 0.7 }}>✨</span> Generate Story
              </>
            )}
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}
            >
              {error}
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '24px',
                padding: '24px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                position: 'relative'
              }}
            >
              <button
                onClick={handleCopy}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: copied ? '#4ade80' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.2s'
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>

              <div
                className="prose prose-invert max-w-none"
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: '1.7',
                  fontSize: '14px'
                }}
              >
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .prose h1, .prose h2, .prose h3 {
          color: #fff;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
          font-size: 1.1em;
        }
        .prose p {
          margin-bottom: 1rem;
        }
      `}} />
    </section>
  );
}
