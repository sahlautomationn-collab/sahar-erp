'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function StockLog() {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total_used'); // total_used, times_used, name

  useEffect(() => {
    fetchStockUsage();
  }, []);

  async function fetchStockUsage() {
    setLoading(true);
    const { data, error } = await supabase
      .from('total_ingredients_usage')
      .select('*')
      .order('total_used', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching stock usage:', error);
      setLoading(false);
      return;
    }

    setUsageData(data || []);
    setLoading(false);
  }

  const filteredAndSortedData = usageData
    .filter(item => {
      const matchesSearch =
        item.ingredient_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.ingredient_id?.toString().includes(search) ||
        item.unit?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'total_used') {
        return b.total_used - a.total_used;
      } else if (sortBy === 'times_used') {
        return b.times_used - a.times_used;
      } else if (sortBy === 'name') {
        return a.ingredient_name?.localeCompare(b.ingredient_name);
      }
      return 0;
    });

  const getUsageBadge = (amount) => {
    if (amount === 0) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-gray-700/30 text-gray-400 border-gray-700">
          Not Used
        </span>
      );
    } else if (amount < 10) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-green-900/30 text-green-400 border-green-900">
          Low Usage
        </span>
      );
    } else if (amount < 50) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-yellow-900/30 text-yellow-400 border-yellow-900">
          Medium
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-red-900/30 text-red-400 border-red-900 animate-pulse">
          High Usage
        </span>
      );
    }
  };

  const getRankBadge = (index) => {
    if (index === 0) {
      return <span className="text-lg">🥇</span>;
    } else if (index === 1) {
      return <span className="text-lg">🥈</span>;
    } else if (index === 2) {
      return <span className="text-lg">🥉</span>;
    } else {
      return <span className="text-xs font-bold text-gray-500">#{index + 1}</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] gap-4 text-gray-100 font-sans p-2 overflow-hidden">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <i className="fas fa-chart-bar text-[#B69142] text-2xl"></i>
          <h1 className="text-2xl font-bold">Stock Usage Log</h1>
        </div>

        {/* Search & Refresh */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="text"
              placeholder="Search ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121212] border border-[#333] py-2 pl-10 pr-4 rounded-xl text-sm focus:border-[#B69142] outline-none"
            />
          </div>
          <button onClick={fetchStockUsage} className="bg-[#1a1a1a] border border-[#333] hover:border-[#B69142] text-white px-4 py-2 rounded-xl transition-all active:scale-95">
            <i className="fas fa-sync-alt text-[#B69142]"></i>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-[#1E1E1E] rounded-[2rem] border border-[#333] shadow-2xl flex flex-col overflow-hidden">

        {/* Table Header & Filters */}
        <div className="p-5 border-b border-[#333] bg-[#252525] flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Sort Options */}
          <div className="flex bg-[#121212] p-1 rounded-lg border border-[#333] gap-1">
            <button
              onClick={() => setSortBy('total_used')}
              className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${sortBy === 'total_used' ? 'bg-[#B69142] text-black shadow' : 'text-gray-500 hover:text-white'}`}
            >
              By Total Used
            </button>
            <button
              onClick={() => setSortBy('times_used')}
              className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${sortBy === 'times_used' ? 'bg-[#B69142] text-black shadow' : 'text-gray-500 hover:text-white'}`}
            >
              By Times Used
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${sortBy === 'name' ? 'bg-[#B69142] text-black shadow' : 'text-gray-500 hover:text-white'}`}
            >
              By Name
            </button>
          </div>

          <div className="text-xs text-gray-400">
            Showing <span className="text-white font-bold">{filteredAndSortedData.length}</span> ingredients
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <div className="table-container rounded-lg border border-[#333]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1a1a1a] text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-md">
                <tr>
                  <th className="p-4 rounded-l-xl">Rank</th>
                  <th className="p-4">Ingredient</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Total Used</th>
                  <th className="p-4">Times Used</th>
                  <th className="p-4">Usage Level</th>
                  <th className="p-4 rounded-r-xl">Unit</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan="7" className="text-center p-10 text-gray-500">Loading stock usage data...</td></tr>
                ) : filteredAndSortedData.length === 0 ? (
                  <tr><td colSpan="7" className="text-center p-10 text-gray-500">No ingredients found matching your search.</td></tr>
                ) : (
                  filteredAndSortedData.map((item, index) => (
                    <tr key={item.ingredient_id} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors group">
                      {/* Rank */}
                      <td className="p-4">
                        {getRankBadge(index)}
                      </td>

                      {/* Ingredient Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-box text-[#B69142]"></i>
                          <span className="font-bold text-gray-200">{item.ingredient_name || 'Unknown'}</span>
                        </div>
                      </td>

                      {/* Ingredient ID */}
                      <td className="p-4">
                        <span className="font-mono text-xs text-gray-500 bg-[#333] px-2 py-1 rounded">#{item.ingredient_id}</span>
                      </td>

                      {/* Total Used */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-lg">{item.total_used || 0}</span>
                        </div>
                      </td>

                      {/* Times Used */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-redo text-gray-500 text-xs"></i>
                          <span className="font-bold text-gray-300">{item.times_used || 0}</span>
                          <span className="text-xs text-gray-500">times</span>
                        </div>
                      </td>

                      {/* Usage Level Badge */}
                      <td className="p-4">
                        {getUsageBadge(item.total_used || 0)}
                      </td>

                      {/* Unit */}
                      <td className="p-4">
                        <span className="text-xs text-gray-400 bg-[#1a1a1a] px-2 py-1 rounded border border-[#333]">
                          {item.unit || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-900/30 flex items-center justify-center">
              <i className="fas fa-fire text-red-500 text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">High Usage Items</p>
              <p className="text-xl font-black text-white">
                {usageData.filter(item => item.total_used >= 50).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-900/30 flex items-center justify-center">
              <i className="fas fa-balance-scale text-yellow-500 text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Medium Usage Items</p>
              <p className="text-xl font-black text-white">
                {usageData.filter(item => item.total_used >= 10 && item.total_used < 50).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-900/30 flex items-center justify-center">
              <i className="fas fa-leaf text-green-500 text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Low Usage Items</p>
              <p className="text-xl font-black text-white">
                {usageData.filter(item => item.total_used > 0 && item.total_used < 10).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-700/30 flex items-center justify-center">
              <i className="fas fa-box-open text-gray-500 text-xl"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500">Not Used Items</p>
              <p className="text-xl font-black text-white">
                {usageData.filter(item => item.total_used === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
