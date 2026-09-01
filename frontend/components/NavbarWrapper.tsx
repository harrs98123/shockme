'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isWatchPage = pathname?.startsWith('/watch');
  const isAdminPage = pathname?.startsWith('/admin');
  const hideChrome = isAuthPage || isWatchPage || isAdminPage;

  return (
    <>
      {!hideChrome && <Navbar />}
      <main className={hideChrome ? '' : 'flex-1'}>
        {children}
      </main>
      {!hideChrome && <Footer />}
    </>
  );
}

