'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AdminIndexPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user?.is_admin) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [user, isLoading, router]);

  return null;
}
