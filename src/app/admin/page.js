'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// استدعاء جميع المكعبات (Components)
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import POS from '@/components/POS';
import Kitchen from '@/components/Kitchen';
import Orders from '@/components/Orders';
import Finance from '@/components/Finance';
import Menu from '@/components/Menu';
import Inventory from '@/components/Inventory';

export default function AdminLayout() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التأكد من الدخول والصلاحية
    const userRole = localStorage.getItem('erp_role');
    if (!userRole) {
      router.push('/');
    } else {
      setRole(userRole);
      // توجيه تلقائي حسب الدور لو مش أدمن
      if (userRole === 'kitchen') setActiveView('kitchen');
      else if (userRole === 'user') setActiveView('pos');
      
      setLoading(false);
    }
  }, []);

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-[#B69142]">
      Loading System...
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-tajawal">
      
      {/* 1. القائمة الجانبية */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} role={role} />

      {/* 2. منطقة المحتوى */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto h-screen relative">
        
        {/* Header بسيط للموبايل فقط */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h2 className="text-[#B69142] font-bold text-xl uppercase">{activeView}</h2>
        </div>

        {/* عرض المكعبات حسب الاختيار (بدون أي تكرار أو نصوص قديمة) */}
        <div className="animate-fade pb-10">
          
          {activeView === 'dashboard' && <Dashboard />}
          
          {activeView === 'pos' && <POS />}
          
          {activeView === 'kitchen' && <Kitchen />}
          
          {activeView === 'orders' && <Orders />}
          
          {activeView === 'finance' && <Finance />}
          
          {activeView === 'menu' && <Menu />}
          
          {activeView === 'inventory' && <Inventory />}

        </div>

      </main>
    </div>
  );
}