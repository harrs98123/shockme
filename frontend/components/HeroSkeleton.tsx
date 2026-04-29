'use client';

export default function HeroSkeleton() {
  return (
    <section 
      className="skeleton"
      style={{
        width: '100%',
        minHeight: '80vh', // Slightly smaller than real hero to avoid layout shift later
        background: '#0a0a0a',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 4%'
      }}
    >
      <div style={{ maxWidth: 680 }}>
        {/* Title Skeleton */}
        <div className="skeleton" style={{ width: '80%', height: 60, marginBottom: 24, borderRadius: 12, opacity: 0.5 }} />
        {/* Meta Skeleton */}
        <div className="skeleton" style={{ width: '40%', height: 24, marginBottom: 24, borderRadius: 8, opacity: 0.3 }} />
        {/* Desc Skeleton */}
        <div className="skeleton" style={{ width: '100%', height: 80, marginBottom: 32, borderRadius: 12, opacity: 0.2 }} />
        {/* Button Skeletons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="skeleton" style={{ width: 140, height: 48, borderRadius: 8, opacity: 0.4 }} />
          <div className="skeleton" style={{ width: 140, height: 48, borderRadius: 8, opacity: 0.4 }} />
        </div>
      </div>
    </section>
  );
}
