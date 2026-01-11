'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // تحديث تلقائي كل 5 ثواني
  useEffect(() => {
    fetchKitchen();
    const interval = setInterval(fetchKitchen, 5000); 
    return () => clearInterval(interval);
  }, []);

  async function fetchKitchen() {
    const { data } = await supabase.from('orders')
      .select('*')
      .eq('is_paid', true)
      .neq('status', 'Cancelled') // Exclude cancelled orders
      .neq('status', 'Delivered') // Exclude delivered orders
      .order('created_at', { ascending: true }); // الأقدم يظهر الأول (FIFO)

    if(data) {
        setOrders(data);
        setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    // تحديث الحالة في قاعدة البيانات
    const { error } = await supabase.from('orders').update({ status }).eq('order_id', id);

    if (!error) {
        // تحديث الحالة محلياً بسرعة عشان الانيميشن
        setOrders(prev => prev.map(o => o.order_id === id ? { ...o, status } : o));
    }
  }

  // دالة لحساب الوقت المنقضي
  function getElapsedTime(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 60000); // الفرق بالدائق
    if (diff < 1) return 'Just now';
    return `${diff} min ago`;
  }

  // دالة عشان نفصل تفاصيل الاوردر لسطور
  function parseOrderItems(summary) {
    if (!summary) return [];
    return summary.split(',').map(item => item.trim());
  }

  return (
    <div className="p-4 h-[calc(100vh-2.5rem)] overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <i className="fas fa-fire-burner text-[#B69142]"></i> Kitchen Live Feed
        </h1>
        <div className="flex gap-4 text-sm font-bold">
            <span className="flex items-center gap-2 text-yellow-500"><span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></span> New: {orders.filter(o=>o.status==='New').length}</span>
            <span className="flex items-center gap-2 text-blue-400"><span className="w-3 h-3 rounded-full bg-blue-400"></span> Prep: {orders.filter(o=>o.status==='Preparing').length}</span>
            <span className="flex items-center gap-2 text-green-500"><span className="w-3 h-3 rounded-full bg-green-500"></span> Ready: {orders.filter(o=>o.status==='Ready').length}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          
          {orders.length === 0 && !loading && (
             <div className="col-span-full h-96 flex flex-col items-center justify-center text-gray-600 opacity-50">
                <i className="fas fa-utensils text-6xl mb-4"></i>
                <p className="text-xl font-bold">All Orders Cleared!</p>
             </div>
          )}

          {orders.map(order => {
             const items = parseOrderItems(order.order_summary);
             const timeElapsed = getElapsedTime(order.created_at);
             
             // تحديد الألوان بناء على الحالة
             const statusColor = 
                order.status === 'New' ? 'border-yellow-500 shadow-yellow-900/20' : 
                order.status === 'Preparing' ? 'border-blue-500 shadow-blue-900/20' : 
                'border-green-500 shadow-green-900/20';

             return (
                <div key={order.order_id} 
                     className={`bg-[#1E1E1E] rounded-2xl border-t-4 shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${statusColor}`}>
                  
                  {/* Card Header */}
                  <div className="p-4 border-b border-[#333] flex justify-between items-start bg-[#252525] rounded-t-xl">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-[#333] text-white font-mono text-xs px-2 py-1 rounded border border-[#444]">#{order.order_id}</span>
                            <span className="text-gray-400 text-xs font-bold"><i className="far fa-clock"></i> {timeElapsed}</span>
                        </div>
                        <h4 className="font-bold text-[#B69142] text-lg truncate w-40" title={order.customer_name}>{order.customer_name}</h4>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider
                        ${order.status === 'New' ? 'bg-yellow-500 text-black animate-pulse' : 
                          order.status === 'Preparing' ? 'bg-blue-600 text-white' : 
                          'bg-green-600 text-white'}`}>
                        {order.status}
                    </div>
                  </div>

                  {/* Card Body (Items) */}
                  <div className="p-4 flex-1 overflow-y-auto max-h-[250px] custom-scrollbar">
                     <ul className="space-y-3">
                        {items.map((itemStr, idx) => {
                            // 1. نفصل الكمية عن النص (مثال: "1x شاي")
                            const parts = itemStr.split('x ');
                            const qty = parts.length > 1 ? parts[0] : '1';
                            let fullText = parts.length > 1 ? parts[1] : itemStr;

                            // 2. نفصل الاسم عن الملاحظات (الملاحظات تبدأ بقوس)
                            const noteStart = fullText.indexOf('(');
                            let name = fullText;
                            let note = '';

                            if (noteStart !== -1) {
                                name = fullText.substring(0, noteStart).trim();
                                note = fullText.substring(noteStart).trim();
                            }
                            
                            return (
                                <li key={idx} className="flex gap-3 text-sm border-b border-[#333] pb-2 last:border-0 last:pb-0">
                                    {/* مربع الكمية */}
                                    <span className="font-bold text-[#B69142] bg-[#2a2a2a] h-6 w-6 flex items-center justify-center rounded text-xs shrink-0 mt-0.5">
                                        {qty}
                                    </span>
                                    
                                    <div className="flex flex-col">
                                        {/* الاسم */}
                                        <span className="text-gray-200 font-bold leading-snug">
                                            {name}
                                        </span>
                                        {/* الملاحظات بلون ذهبي */}
                                        {note && (
                                            <span className="text-[#B69142] text-[11px] font-mono mt-0.5">
                                                {note}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                     </ul>
                  </div>

                  {/* Card Footer (Actions) */}
                  <div className="p-3 bg-[#252525] rounded-b-2xl border-t border-[#333]">
                    {order.status === 'New' && (
                      <button onClick={() => updateStatus(order.order_id, 'Preparing')} 
                        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                        <span>START COOKING</span> <i className="fas fa-fire"></i>
                      </button>
                    )}
                    
                    {order.status === 'Preparing' && (
                      <button onClick={() => updateStatus(order.order_id, 'Completed')}
                        className="w-full bg-green-700 text-gray-300 hover:bg-green-600 hover:text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                        <span>COMPLETED</span> <i className="fas fa-check-circle"></i>
                      </button>
                    )}

                    {order.status === 'Completed' && (
                      <button onClick={() => updateStatus(order.order_id, 'Delivered')}
                        className="w-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                         <span>DELIVERED</span> <i className="fas fa-motorcycle"></i>
                      </button>
                    )}
                  </div>

                </div>
             );
          })}
        </div>
      </div>
    </div>
  );
}