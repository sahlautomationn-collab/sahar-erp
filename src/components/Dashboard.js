'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export default function Dashboard() {
  const [filter, setFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    revenue: 0,
    ordersCount: 0,
    avgOrder: 0,
    cash: 0,
    visa: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [filter]);

  async function fetchDashboardData() {
    setLoading(true);
    const now = new Date();
    let startDate = new Date();

    if (filter === 'today') {
        startDate.setHours(0, 0, 0, 0);
    } else if (filter === 'week') {
        startDate.setDate(now.getDate() - 7);
    } else if (filter === 'month') {
        startDate.setMonth(now.getMonth() - 1);
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('is_paid', true)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
        logger.error("Error fetching dashboard stats", error);
        setLoading(false);
        return;
    }

    const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const count = orders.length;
    const cash = orders.filter(o => o.payment_method === 'Cash').length;
    const visa = count - cash; 

    setStats({
        revenue,
        ordersCount: count,
        avgOrder: count > 0 ? Math.round(revenue / count) : 0,
        cash,
        visa
    });

    setRecentOrders(orders.slice(0, 5));
    setLoading(false);
  }

  return (
    <div className="w-full animate-fade">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
         <div>
            <h2 className="text-3xl font-bold text-white">Dashboard</h2>
            <p className="text-gray-400 text-sm mt-1">Financial performance & orders summary</p>
         </div>
         
         {/* Filter Buttons */}
         <div className="bg-[#1a1a1a] p-1 rounded-lg border border-[#333] flex shadow-lg">
            {['today', 'week', 'month'].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 rounded-md text-xs font-bold transition-all ${
                        filter === f 
                        ? 'bg-[#B69142] text-black shadow' 
                        : 'text-gray-400 hover:text-white hover:bg-[#222]'
                    }`}
                >
                    {f === 'today' ? 'Today' : f === 'week' ? 'Week' : 'Month'}
                </button>
            ))}
         </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-[#121212] to-[#1a1a1a] p-6 rounded-2xl border border-[#333] relative overflow-hidden group hover:border-[#B69142] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <h3 className="text-4xl font-bold text-[#B69142] mt-2">
                        {loading ? '...' : stats.revenue.toLocaleString()} <span className="text-sm font-normal text-gray-500">LE</span>
                    </h3>
                  </div>
                  <div className="p-3 bg-[#B69142]/10 rounded-full text-[#B69142]">
                    <i className="fas fa-coins text-xl"></i>
                  </div>
              </div>
              <div className="w-full bg-[#222] h-1 rounded-full mt-2 overflow-hidden">
                 <div className="bg-[#B69142] h-full animate-pulse transition-all duration-500" style={{width: `${Math.min((stats.revenue / 10000) * 100, 100)}%`}}></div>
              </div>
          </div>

          {/* Orders Card */}
          <div className="bg-gradient-to-br from-[#121212] to-[#1a1a1a] p-6 rounded-2xl border border-[#333] relative overflow-hidden group hover:border-blue-500 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Orders Count</p>
                    <h3 className="text-4xl font-bold text-white mt-2">
                        {loading ? '...' : stats.ordersCount}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                    <i className="fas fa-receipt text-xl"></i>
                  </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-400 mt-2">
                 <span className="bg-blue-500/20 px-2 py-1 rounded">Avg: {stats.avgOrder} LE</span>
                 <span>Average Order</span>
              </div>
          </div>

          {/* Payment Methods Card */}
          <div className="bg-gradient-to-br from-[#121212] to-[#1a1a1a] p-6 rounded-2xl border border-[#333] hover:border-green-500 transition-all duration-300">
              <p className="text-gray-400 text-sm mb-4">Payment Analysis</p>
              
              {/* Cash Bar */}
              <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-400 font-bold"><i className="fas fa-money-bill mr-1"></i> Cash</span>
                      <span className="text-white">{stats.cash}</span>
                  </div>
                  <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden">
                      <div className="bg-green-600 h-full transition-all duration-1000" style={{ width: `${(stats.cash / (stats.ordersCount || 1)) * 100}%` }}></div>
                  </div>
              </div>

              {/* Visa Bar */}
              <div>
                  <div className="flex justify-between text-xs mb-1">
                      <span className="text-purple-400 font-bold"><i className="fas fa-credit-card mr-1"></i> Electronic</span>
                      <span className="text-white">{stats.visa}</span>
                  </div>
                  <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full transition-all duration-1000" style={{ width: `${(stats.visa / (stats.ordersCount || 1)) * 100}%` }}></div>
                  </div>
              </div>
          </div>
      </div>

      {/* 3. Recent Activity Table */}
      <div className="bg-[#121212] rounded-xl border border-[#333] overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
              <h3 className="font-bold text-white flex items-center gap-2">
                 <i className="fas fa-history text-[#B69142]"></i> Recent Activity
              </h3>
          </div>
          <div className="table-container">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-[#121212] text-gray-500 text-xs uppercase tracking-wider">
                      <tr>
                          <th className="p-4 font-medium">Order ID</th>
                          <th className="p-4 font-medium">Customer</th>
                          <th className="p-4 font-medium">Amount</th>
                          <th className="p-4 font-medium">Payment</th>
                          <th className="p-4 font-medium">Time</th>
                      </tr>
                  </thead>
                  <tbody className="text-gray-300 text-sm divide-y divide-[#222]">
                      {loading ? (
                          <tr><td colSpan="5" className="p-8 text-gray-500">Loading data...</td></tr>
                      ) : recentOrders.length === 0 ? (
                          <tr><td colSpan="5" className="p-8 text-gray-500">No orders found in this period</td></tr>
                      ) : (
                          recentOrders.map(order => (
                              <tr key={order.order_id} className="hover:bg-[#1f1f1f] transition-colors">
                                  <td className="p-4 font-mono text-[#B69142] font-bold">#{order.order_id}</td>
                                  <td className="p-4">{order.customer_name || 'Walk-in'}</td>
                                  <td className="p-4 font-bold text-white">{order.total_amount} LE</td>
                                  <td className="p-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                          order.payment_method === 'Cash' 
                                          ? 'bg-green-900/20 text-green-400 border-green-900' 
                                          : 'bg-purple-900/20 text-purple-400 border-purple-900'
                                      }`}>
                                          {order.payment_method}
                                      </span>
                                  </td>
                                  <td className="p-4 text-xs text-gray-500 font-mono">
                                      {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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