'use client';

export default function TrendingRankedRowSkeleton() {
  return (
    <section style={{ padding: '48px 0 24px' }}>
      <div className="container">
        {/* Title Skeleton */}
        <div 
          className="skeleton" 
          style={{ 
            width: 250, 
            height: 32, 
            marginBottom: 32,
            borderRadius: 8 
          }} 
        />
        
        {/* Row of Cards with offsets for numbers */}
        <div 
          style={{ 
            display: 'flex', 
            gap: 40, 
            overflow: 'hidden',
            padding: '20px 40px 40px 20px'
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i}
              style={{
                position: 'relative',
                minWidth: 220,
                display: 'flex',
                alignItems: 'flex-end',
                marginLeft: i === 0 ? 0 : 85
              }}
            >
              {/* Number Placeholder */}
              <div 
                className="skeleton"
                style={{
                  position: 'absolute',
                  left: -45,
                  bottom: -25,
                  width: 150,
                  height: 200,
                  opacity: 0.1,
                  borderRadius: 20
                }}
              />
              {/* Card Placeholder */}
              <div 
                className="skeleton"
                style={{
                  width: 210,
                  height: 315,
                  borderRadius: 24,
                  zIndex: 1
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
