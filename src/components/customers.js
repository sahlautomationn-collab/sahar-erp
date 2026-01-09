'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function getCustomers() {
      const { data } = await supabase.from('customers').select('*').order('total_spent', { ascending: false });
      if (data) setCustomers(data);
    }
    getCustomers();
  }, []);

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#B69142]"><i className="fas fa-users mr-2"></i> Customers Database</h1>
        <input 
            type="text" placeholder="Search customer..." 
            className="bg-[#121212] border border-[#333] px-4 py-2 rounded-lg text-white focus:border-[#B69142] outline-none"
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#252525] text-gray-400 text-xs uppercase">
            <tr>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Total Orders</th>
              <th className="p-4">Total Spent</th>
              <th className="p-4">Last Visit</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-gray-200 text-sm">
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-[#333] hover:bg-[#2a2a2a]">
                <td className="p-4 font-bold">{c.name}</td>
                <td className="p-4 font-mono text-gray-400">{c.phone}</td>
                <td className="p-4 text-center bg-[#121212] w-1">{c.total_orders}</td>
                <td className="p-4 font-bold text-[#B69142]">{c.total_spent} LE</td>
                <td className="p-4 text-xs text-gray-500">{new Date(c.last_visit).toLocaleDateString()}</td>
                <td className="p-4">
                    {c.total_spent > 5000 ? (
                        <span className="bg-[#B69142] text-black text-[10px] font-bold px-2 py-1 rounded">VIP</span>
                    ) : (
                        <span className="bg-[#333] text-gray-300 text-[10px] font-bold px-2 py-1 rounded">REGULAR</span>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}