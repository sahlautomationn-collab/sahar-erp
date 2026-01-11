'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '../../lib/auth';
import { logger } from '../../lib/logger';
import Sidebar from '../../components/Sidebar';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const isAuth = auth.isAuthenticated();
        if (!isAuth) {
          router.push('/login');
          return;
        }

        const userRole = auth.getRole();
        setRole(userRole);
        setLoading(false);

        // Redirect users to POS on first load
        if (userRole === 'user' && pathname === '/admin') {
          router.replace('/admin/pos');
        }
      } catch (error) {
        logger.error('Authentication check failed', error, false);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, pathname]);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center text-[#B69142]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B69142] mx-auto mb-4"></div>
          <p className="text-lg">Loading System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 bg-[#B69142] hover:bg-[#8e7032] text-white p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        title="Toggle Menu"
        aria-label="Toggle Menu"
      >
        <Menu size={24} strokeWidth={2.5} />
      </button>

      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 animate-fade"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-72 bg-[#1E1E1E] border-r border-[#333] z-40 transition-transform duration-300 ease-in-out shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar activeView={pathname} role={role} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <main className="p-2 md:p-4 lg:p-6 min-h-screen transition-all duration-300">
        <div className="max-w-full overflow-x-hidden h-full">
          {children}
        </div>
      </main>

    </div>
  );
}
