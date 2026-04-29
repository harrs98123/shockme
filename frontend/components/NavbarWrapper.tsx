'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main className={isAuthPage ? '' : 'flex-1'}>
        {children}
      </main>
      {!isAuthPage && (
        <footer className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)', borderTop: '1px solid var(--border)' }}>
          <p>© 2025 shockme. Powered by <span style={{ color: 'var(--primary)' }}>TMDB</span>.</p>
        </footer>
      )}
    </>
  );
}
