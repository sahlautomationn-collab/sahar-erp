'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function BestSellersComponent() {
  const [filter, setFilter] = useState('month');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxSales, setMaxSales] = useState(0); // عشان نحسب نسبة شريط التقدم

  useEffect(() => {
    fetchBestSellers();
  }, [filter]);

  async function fetchBestSellers() {
    setLoading(true);
    
    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (filter === 'week') startDate.setDate(now.getDate() - 7);
    if (filter === 'month') startDate.setMonth(now.getMonth() - 1);

    try {
      // 1. Fetch Sales
      const { data: salesData, error: salesError } = await supabase
        .from('order_items') 
        .select('menu_item_id, quantity, price_at_time, created_at')
        .gte('created_at', startDate.toISOString());

      if (salesError) throw salesError;

      // 2. Group Data
      const grouped = {};
      salesData.forEach(item => {
        const id = item.menu_item_id;
        if (grouped[id]) {
          grouped[id].sold += item.quantity;
          grouped[id].revenue += item.quantity * item.price_at_time;
        } else {
          grouped[id] = {
            id: id,
            sold: item.quantity,
            revenue: item.quantity * item.price_at_time,
            price: item.price_at_time,
            name_en: 'Unknown Item',
            image: null
          };
        }
      });

      // 3. Fetch Details
      const ids = Object.keys(grouped);
      if (ids.length > 0) {
        const { data: menuItems, error: menuError } = await supabase
          .from('menu') 
          .select('id, name_en, image') 
          .in('id', ids);

        if (!menuError && menuItems) {
          menuItems.forEach(menuItem => {
            if (grouped[menuItem.id]) {
              grouped[menuItem.id].name_en = menuItem.name_en;
              grouped[menuItem.id].image = menuItem.image;
            }
          });
        }
      }

      // 4. Sort & Calculate Max
      const sortedProducts = Object.values(grouped)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10);

      if (sortedProducts.length > 0) {
        setMaxSales(sortedProducts[0].sold);
      }

      setProducts(sortedProducts);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(num);
  };

  // --- Components ---

  const HeroCard = ({ item, rank }) => {
    const config = {
      0: { 
        bg: 'bg-gradient-to-b from-[#B69142]/20 to-[#1E1E1E]', 
        border: 'border-[#B69142]', 
        text: 'text-[#B69142]', 
        glow: 'shadow-[0_0_30px_rgba(182,145,66,0.15)]',
        badge: 'bg-[#B69142] text-black'
      },
      1: { 
        bg: 'bg-gradient-to-b from-gray-400/10 to-[#1E1E1E]', 
        border: 'border-gray-400', 
        text: 'text-gray-300', 
        glow: 'shadow-[0_0_20px_rgba(156,163,175,0.1)]',
        badge: 'bg-gray-400 text-black'
      },
      2: { 
        bg: 'bg-gradient-to-b from-orange-700/10 to-[#1E1E1E]', 
        border: 'border-orange-700', 
        text: 'text-orange-500', 
        glow: 'shadow-[0_0_20px_rgba(194,65,12,0.1)]',
        badge: 'bg-orange-700 text-white'
      }
    }[rank];

    return (
      <div className={`relative p-6 rounded-3xl border ${config.border} ${config.bg} ${config.glow} flex flex-col items-center gap-4 transition-transform hover:-translate-y-2 duration-300 group`}>
        {/* Rank Badge */}
        <div className={`absolute -top-4 px-4 py-1 rounded-full font-black text-sm uppercase tracking-wider shadow-lg ${config.badge}`}>
          Rank #{rank + 1}
        </div>

        {/* Image with Ring */}
        <div className={`w-28 h-28 rounded-full p-1 border-2 ${config.border} border-dashed`}>
            <div className="w-full h-full rounded-full overflow-hidden bg-black">
                {item.image ? (
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-600"><i className="fas fa-utensils text-2xl"></i></div>
                )}
            </div>
        </div>

        {/* Info */}
        <div className="text-center">
            <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">{item.name_en}</h3>
            <p className="text-gray-400 text-xs">{item.price} EGP / Unit</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 w-full mt-2">
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Sold</p>
                <p className={`text-xl font-black ${config.text}`}>{item.sold}</p>
            </div>
            <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Revenue</p>
                <p className="text-sm font-bold text-white">{formatCurrency(item.revenue)}</p>
            </div>
        </div>
      </div>
    );
  };

  const ListItem = ({ item, index }) => {
    // Calculate width percentage for progress bar
    const percentage = Math.round((item.sold / maxSales) * 100);

    return (
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1A1A1A] border border-[#333] hover:border-[#B69142]/50 transition-colors group">
        
        {/* Rank Number */}
        <div className="w-8 text-center font-mono font-bold text-gray-500 text-lg">
            #{index + 4}
        </div>

        {/* Image */}
        <div className="w-12 h-12 rounded-lg bg-[#252525] overflow-hidden shrink-0">
             {item.image ? (
                 <img src={item.image} className="w-full h-full object-cover" />
             ) : (
                 <div className="flex items-center justify-center h-full"><i className="fas fa-image text-gray-600"></i></div>
             )}
        </div>

        {/* Name & Bar */}
        <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1">
                <h4 className="text-white font-bold truncate pr-4">{item.name_en}</h4>
                <span className="text-[#B69142] font-bold text-sm">{item.sold} Sold</span>
            </div>
            {/* Progress Bar Background */}
            <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                {/* Progress Bar Fill */}
                <div 
                    className="h-full bg-gradient-to-r from-[#B69142] to-[#8a6d32] rounded-full" 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>

        {/* Revenue */}
        <div className="text-right pl-4 border-l border-[#333]">
            <p className="text-[10px] text-gray-500 uppercase">Revenue</p>
            <p className="text-white font-mono font-bold">{formatCurrency(item.revenue)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-8 pb-10">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Best Sellers <span className="text-[#B69142]">.</span></h1>
            <p className="text-gray-400 mt-1">Top performing menu items based on sales volume.</p>
        </div>

        {/* Modern Segmented Control */}
        <div className="bg-[#1A1A1A] p-1 rounded-xl border border-[#333] flex">
            {['today', 'week', 'month'].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-300 ${
                        filter === f 
                        ? 'bg-[#B69142] text-black shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-[#B69142]/30 border-t-[#B69142] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm animate-pulse">Crunching Numbers...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#333] rounded-3xl bg-[#1E1E1E]/50">
            <i className="fas fa-box-open text-6xl text-[#333] mb-4"></i>
            <p className="text-gray-500">No sales recorded for this period.</p>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
            
            {/* 1. Top 3 Grid (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Reordering for visual hierarchy: 2nd, 1st, 3rd */}
                {products[1] && <div className="md:mt-8"><HeroCard item={products[1]} rank={1} /></div>}
                {products[0] && <div className="z-10"><HeroCard item={products[0]} rank={0} /></div>}
                {products[2] && <div className="md:mt-8"><HeroCard item={products[2]} rank={2} /></div>}
            </div>

            {/* 2. Remaining List */}
            {products.length > 3 && (
                <div className="pt-4">
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-4 pl-2">Runner Ups</h3>
                    <div className="flex flex-col gap-3">
                        {products.slice(3).map((item, idx) => (
                            <ListItem key={item.id} item={item} index={idx} />
                        ))}
                    </div>
                </div>
            )}

        </div>
      )}
    </div>
  );
}