'use client';

import { useState, useEffect } from 'react';

interface Props {
  token: string | null;
}

export default function StealthPlayer({ token }: Props) {
  const [provider, setProvider] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    // We now use the backend proxy with an encrypted token.
    // Scanners only see "/telemetry/stream-viewer?t=..."
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${API_BASE}/telemetry/stream-viewer?t=${encodeURIComponent(token)}`;
    setProvider(url);

    // Simulate initial loading sequence for aesthetic
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [token]);

  // Even if token is missing, we show the loading state to indicate "synchronization"
  // This prevents the player from returning null and showing a blank modal.
  const showLoading = !token || !provider || isLoading;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#000',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Cinematic Loading State */}
      {showLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          backgroundColor: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20
        }}>
          <div className="flex gap-1 items-end h-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: '100%',
                  background: 'linear-gradient(to top, #e11d48, #fb7185)',
                  borderRadius: 2,
                  animation: `pulse 1s ease-in-out infinite ${i * 0.1}s`
                }}
              />
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
            {(!token || !provider) ? 'Requesting Secure Link...' : 'Synchronizing Secure Feed...'}
          </p>
          <style>{`
            @keyframes pulse {
              0%, 100% { height: 20%; opacity: 0.3; }
              50% { height: 100%; opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {provider && (
        <iframe
          src={provider}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000'
          }}
          allowFullScreen
          allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
        />
      )}
    </div>
  );
}
