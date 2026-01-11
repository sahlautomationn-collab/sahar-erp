'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function InventoryLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // All, Addition, Waste, Sale, Adjustment

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching inventory logs:', error);
      setLoading(false);
      return;
    }

    setLogs(data || []);
    setLoading(false);
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.reason?.toLowerCase().includes(search.toLowerCase()) ||
      log.admin_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.ingredient_id?.toString().includes(search);

    const matchesFilter = filter === 'All' ||
      (filter === 'Addition' && log.change_amount > 0) ||
      (filter === 'Waste' && log.change_amount < 0 && log.reason?.toLowerCase().includes('waste')) ||
      (filter === 'Sale' && log.change_amount < 0 && !log.reason?.toLowerCase().includes('waste')) ||
      (filter === 'Adjustment' && log.reason?.toLowerCase().includes('adjustment'));

    return matchesSearch && matchesFilter;
  });

  const getChangeBadge = (amount) => {
    if (amount > 0) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-green-900/30 text-green-400 border-green-900">
          +{amount}
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-red-900/30 text-red-400 border-red-900">
          {amount}
        </span>
      );
    }
  };

  const getReasonBadge = (reason) => {
    const lowerReason = reason?.toLowerCase() || '';

    if (lowerReason.includes('waste')) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-red-900/30 text-red-400 border-red-900">
          Waste
        </span>
      );
    } else if (lowerReason.includes('sale') || lowerReason.includes('order')) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-blue-900/30 text-blue-400 border-blue-900">
          Sale
        </span>
      );
    } else if (lowerReason.includes('addition') || lowerReason.includes('restock') || lowerReason.includes('purchase')) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-green-900/30 text-green-400 border-green-900">
          Addition
        </span>
      );
    } else if (lowerReason.includes('adjustment')) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-purple-900/30 text-purple-400 border-purple-900">
          Adjustment
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-gray-700/30 text-gray-400 border-gray-700">
          {reason || 'Other'}
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] gap-4 text-gray-100 font-sans p-2 overflow-hidden">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <i className="fas fa-clipboard-list text-[#B69142] text-2xl"></i>
          <h1 className="text-2xl font-bold">Inventory Log</h1>
        </div>

        {/* Search & Refresh */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="text"
              placeholder="Search reason, admin, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121212] border border-[#333] py-2 pl-10 pr-4 rounded-xl text-sm focus:border-[#B69142] outline-none"
            />
          </div>
          <button onClick={fetchLogs} className="bg-[#1a1a1a] border border-[#333] hover:border-[#B69142] text-white px-4 py-2 rounded-xl transition-all active:scale-95">
            <i className="fas fa-sync-alt text-[#B69142]"></i>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-[#1E1E1E] rounded-[2rem] border border-[#333] shadow-2xl flex flex-col overflow-hidden">

        {/* Table Header & Filters */}
        <div className="p-5 border-b border-[#333] bg-[#252525] flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Filter Tabs */}
          <div className="flex bg-[#121212] p-1 rounded-lg border border-[#333] flex-wrap gap-1">
            {['All', 'Addition', 'Waste', 'Sale', 'Adjustment'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${filter === type ? 'bg-[#B69142] text-black shadow' : 'text-gray-500 hover:text-white'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400">
            Showing <span className="text-white font-bold">{filteredLogs.length}</span> records
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <div className="table-container rounded-lg border border-[#333]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1a1a1a] text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-md">
                <tr>
                  <th className="p-4 rounded-l-xl">ID</th>
                  <th className="p-4">Ingredient ID</th>
                  <th className="p-4">Change</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Admin</th>
                  <th className="p-4 rounded-r-xl">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan="6" className="text-center p-10 text-gray-500">Loading inventory logs...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan="6" className="text-center p-10 text-gray-500">No inventory logs found matching your search.</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors group">
                      {/* ID */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-[#B69142] bg-[#333] px-2 py-1 rounded">#{log.id}</span>
                      </td>

                      {/* Ingredient ID */}
                      <td className="p-4">
                        <span className="font-bold text-gray-200">{log.ingredient_id}</span>
                      </td>

                      {/* Change Amount */}
                      <td className="p-4">
                        {getChangeBadge(log.change_amount)}
                      </td>

                      {/* Reason */}
                      <td className="p-4">
                        {getReasonBadge(log.reason)}
                      </td>

                      {/* Admin Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-user text-gray-500"></i>
                          <span className="text-xs font-bold">{log.admin_name || 'System'}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
