'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function InventoryLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('inventory_log')
        .select('*, ingredients(name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) setLogs(data);
    }
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#B69142] mb-6"><i className="fas fa-history mr-2"></i> Inventory Logs</h1>
      
      <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#252525] text-gray-400 text-xs uppercase">
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Ingredient</th>
              <th className="p-4">Change</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Admin</th>
            </tr>
          </thead>
          <tbody className="text-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-[#333] hover:bg-[#2a2a2a]">
                <td className="p-4 text-gray-500 text-xs">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="p-4 font-bold">{log.ingredients?.name}</td>
                <td className={`p-4 font-mono font-bold ${log.change_amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                </td>
                <td className="p-4">{log.reason}</td>
                <td className="p-4 text-[#B69142] text-xs">{log.admin_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}