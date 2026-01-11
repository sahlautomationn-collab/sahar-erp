'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function BestSellers() {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    fetchBestSellers();
  }, [period]);

  async function fetchBestSellers() {
    setLoading(true);

    let startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get order items within the period
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price_at_time,
        menu_item_id,
        orders (created_at)
      `)
      .gte('orders.created_at', startDate.toISOString())
      .order('quantity', { ascending: false });

    if (error) {
      console.error('Error fetching best sellers:', error);
      setLoading(false);
      return;
    }

    // Aggregate by menu item
    const aggregated = {};
    orderItems?.forEach(item => {
      const key = item.menu_item_id;
      if (!aggregated[key]) {
        aggregated[key] = {
          menu_item_id: key,
          total_quantity: 0,
          total_revenue: 0,
          count: 0
        };
      }
      aggregated[key].total_quantity += item.quantity;
      aggregated[key].total_revenue += (item.quantity * item.price_at_time);
      aggregated[key].count += 1;
    });

    // Get menu details
    const menuIds = Object.keys(aggregated);
    const { data: menuItems } = await supabase
      .from('menu')
      .select('id, name_ar, name_en, image, category')
      .in('id', menuIds);

    // Combine data
    const combined = Object.values(aggregated)
      .map(item => {
        const menuItem = menuItems?.find(m => m.id === item.menu_item_id);
        return {
          ...item,
          ...menuItem
        };
      })
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 20); // Top 20

    setBestSellers(combined);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] gap-4 text-gray-100 font-sans p-2 overflow-hidden">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <i className="fas fa-trophy text-[#B69142] text-2xl"></i>
          <h1 className="text-2xl font-bold">Best Sellers</h1>
        </div>

        {/* Period Filter */}
        <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
          {['today', 'week', 'month'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-md text-xs font-bold transition-all ${
                period === p
                  ? 'bg-[#B69142] text-black shadow'
                  : 'text-gray-400 hover:text-white hover:bg-[#222]'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <i className="fas fa-circle-notch fa-spin text-3xl mb-3 text-[#B69142]"></i>
            <p>Loading Best Sellers...</p>
          </div>
        ) : bestSellers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
            <i className="fas fa-box-open text-6xl mb-4"></i>
            <p className="text-xl font-bold">No Sales Data</p>
            <p className="text-sm">No orders found for this period</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {bestSellers.map((item, index) => (
              <div
                key={item.menu_item_id}
                className={`relative bg-[#1E1E1E] rounded-2xl border p-5 flex flex-col transition-all group hover:-translate-y-1 hover:shadow-xl ${
                  index === 0 ? 'border-yellow-500 shadow-yellow-500/10' : 'border-[#333] hover:border-[#B69142]'
                }`}
              >
                {/* Rank Badge */}
                {index < 3 && (
                  <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-lg ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                    'bg-orange-600 text-black'
                  }`}>
                    {index + 1}
                  </div>
                )}

                {/* Image */}
                <div className="w-full aspect-square relative mb-4 rounded-xl overflow-hidden bg-[#121212]">
                  <img
                    src={item.image || 'https://placehold.co/200'}
                    alt={item.name_ar}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded-full">
                      🏆 TOP
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3 className="font-bold text-white text-sm mb-2 line-clamp-2">{item.name_ar}</h3>
                <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider">{item.category}</p>

                {/* Stats */}
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between items-center bg-[#121212] p-2 rounded-lg">
                    <span className="text-[10px] text-gray-500">Sold</span>
                    <span className="font-mono font-bold text-[#B69142]">{item.total_quantity}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#121212] p-2 rounded-lg">
                    <span className="text-[10px] text-gray-500">Revenue</span>
                    <span className="font-mono font-bold text-green-500">{item.total_revenue.toLocaleString()} LE</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
