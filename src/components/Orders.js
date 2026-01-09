'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // All, Completed, New

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    // جلب آخر 100 طلب لتغطية البحث والفلترة بشكل مبدئي
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) setOrders(data);
    setLoading(false);
  }

  // منطق الفلترة والبحث (Client-Side)
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
        order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.phone?.includes(search) ||
        order.order_id?.toString().includes(search);
    
    const matchesFilter = filter === 'All' || order.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-6 text-gray-100 font-sans p-2 overflow-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <i className="fas fa-receipt text-[#B69142] text-2xl"></i>
            <h1 className="text-2xl font-bold">Orders History</h1>
         </div>

         {/* Search & Refresh */}
         <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input 
                    type="text" 
                    placeholder="Search ID, Name, Phone..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] py-2 pl-10 pr-4 rounded-xl text-sm focus:border-[#B69142] outline-none"
                />
            </div>
            <button onClick={fetchOrders} className="bg-[#1a1a1a] border border-[#333] hover:border-[#B69142] text-white px-4 py-2 rounded-xl transition-all active:scale-95">
                <i className="fas fa-sync-alt text-[#B69142]"></i>
            </button>
         </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-[#1E1E1E] rounded-[2rem] border border-[#333] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Table Header & Filters */}
        <div className="p-5 border-b border-[#333] bg-[#252525] flex flex-col md:flex-row justify-between items-center gap-4">
             {/* Filter Tabs */}
             <div className="flex bg-[#121212] p-1 rounded-lg border border-[#333]">
                {['All', 'New', 'Completed', 'Preparing'].map(status => (
                    <button 
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === status ? 'bg-[#B69142] text-black shadow' : 'text-gray-500 hover:text-white'}`}
                    >
                        {status}
                    </button>
                ))}
             </div>
             
             <div className="text-xs text-gray-400">
                Showing <span className="text-white font-bold">{filteredOrders.length}</span> orders
             </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <table className="w-full text-left border-collapse">
                <thead className="bg-[#1a1a1a] text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-4 rounded-l-xl">Order ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Summary</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 rounded-r-xl">Date</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {loading ? (
                        <tr><td colSpan="7" className="text-center p-10 text-gray-500">Loading orders...</td></tr>
                    ) : filteredOrders.length === 0 ? (
                        <tr><td colSpan="7" className="text-center p-10 text-gray-500">No orders found matching your search.</td></tr>
                    ) : (
                        filteredOrders.map(order => (
                            <tr key={order.order_id} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors group">
                                {/* ID */}
                                <td className="p-4">
                                    <span className="font-mono font-bold text-[#B69142] bg-[#333] px-2 py-1 rounded">#{order.order_id}</span>
                                </td>
                                
                                {/* Customer */}
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-200">{order.customer_name}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">{order.phone}</span>
                                    </div>
                                </td>

                                {/* Summary */}
                                <td className="p-4 max-w-[250px]">
                                    <p className="truncate text-gray-400 text-xs" title={order.order_summary}>
                                        {order.order_summary}
                                    </p>
                                </td>

                                {/* Payment Method */}
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <i className={`fas ${order.payment_method === 'Cash' ? 'fa-wallet text-green-500' : order.payment_method === 'Vodafone' ? 'fa-mobile-alt text-red-500' : 'fa-credit-card text-blue-500'}`}></i>
                                        <span className="text-xs font-bold">{order.payment_method}</span>
                                    </div>
                                </td>

                                {/* Total */}
                                <td className="p-4">
                                    <span className="font-black text-white">{order.total_amount} <span className="text-[#B69142] text-[10px]">LE</span></span>
                                </td>

                                {/* Status */}
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border
                                        ${order.status === 'Completed' ? 'bg-green-900/30 text-green-400 border-green-900' : 
                                          order.status === 'New' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900 animate-pulse' : 
                                          'bg-blue-900/30 text-blue-400 border-blue-900'}`}>
                                        {order.status}
                                    </span>
                                </td>

                                {/* Date */}
                                <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(order.created_at).toLocaleString('en-US', {
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
  );
}