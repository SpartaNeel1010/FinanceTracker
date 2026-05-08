'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (user && token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [user, token, router]);

  return (
    <div className="auth-page">
      <div className="spinner" />
    </div>
  );
}
