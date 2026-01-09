'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Toastify from 'toastify-js';

const supabase = createClient(
  'https://wxmwneumvsxkensiwnnl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bXduZXVtdnN4a2Vuc2l3bm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDkyOTEsImV4cCI6MjA4MzA4NTI5MX0.s2B9SQ6WgBfajFrwPAhshkewQnXkBB2DIH0Vh_43HGs'
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: roleData } = await supabase.from('user_roles').select('role').eq('id', user.id).single();
      localStorage.setItem('erp_role', roleData?.role || 'user');
      
      Toastify({ text: "تم الدخول بنجاح! 🚀", style: { background: "#00c851" } }).showToast();
      router.push('/admin');

    } catch (err) {
      Toastify({ text: "بيانات الدخول غير صحيحة", style: { background: "#ff4444" } }).showToast();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505]">
      <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl border border-[#B69142] shadow-[0_0_30px_rgba(182,145,66,0.15)] text-center">
        <h1 className="text-[#B69142] text-3xl font-bold mb-8">SAHAR ERP</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="البريد الإلكتروني" required onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-[#222] border border-[#333] rounded-lg text-white outline-none focus:border-[#B69142]" />
          <input type="password" placeholder="كلمة المرور" required onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-[#222] border border-[#333] rounded-lg text-white outline-none focus:border-[#B69142]" />
          <button type="submit" disabled={loading} className="w-full p-4 bg-[#B69142] text-black font-bold rounded-lg hover:bg-white transition-all">
            {loading ? "جاري التحقق..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}