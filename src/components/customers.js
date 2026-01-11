'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
    <div className="flex flex-col h-[calc(100vh-2.5rem)] gap-4 text-gray-100 font-sans p-2 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <i className="fas fa-users text-[#B69142] text-2xl"></i>
          <h1 className="text-2xl font-bold text-white">Customers Database</h1>
        </div>
        <div className="relative flex-1 md:w-64">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input
            type="text" placeholder="Search customer..."
            className="w-full bg-[#121212] border border-[#333] py-2 pl-10 pr-4 rounded-xl text-white focus:border-[#B69142] outline-none"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 bg-[#1E1E1E] rounded-[2rem] border border-[#333] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <div className="table-container rounded-lg border border-[#333]">
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
      </div>
    </div>
  );
}