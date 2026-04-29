'use client';

export default function MovieRowSkeleton() {
  return (
    <section style={{ padding: '32px 0' }}>
      <div className="container">
        {/* Title Skeleton */}
        <div 
          className="skeleton" 
          style={{ 
            width: 200, 
            height: 28, 
            marginBottom: 24,
            borderRadius: 8 
          }} 
        />
        
        {/* Row of Cards */}
        <div 
          style={{ 
            display: 'flex', 
            gap: 16, 
            overflow: 'hidden',
            padding: '8px 4px 16px'
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i}
              className="skeleton"
              style={{
                minWidth: 210,
                height: 315,
                borderRadius: 24,
                flexShrink: 0
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
