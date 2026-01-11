'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/auth';
import Dashboard from '../../components/Dashboard';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const role = auth.getRole();
    // Redirect users to POS if they try to access Dashboard
    if (role === 'user') {
      router.replace('/admin/pos');
    }
  }, [router]);

  const role = auth.getRole();
  if (role === 'user') {
    return null; // Don't render Dashboard for users
  }

  return <Dashboard />;
}
