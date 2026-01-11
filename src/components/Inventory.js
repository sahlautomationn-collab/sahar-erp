'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, low

  // --- Modal State (حالة نافذة التعديل) ---
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState({ 
    stock: 0, 
    min_limit: 0, 
    cost_per_unit: 0 
  });

  useEffect(() => { loadInventory(); }, []);

  // 1. جلب البيانات مع الربط بين الجدولين
  async function loadInventory() {
    setLoading(true);
    
    /* هنا بنقول لـ Supabase:
       1. هات كل حاجة من جدول inventory
       2. وكمان هات name و unit من جدول ingredients المربوط بيه
    */
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        ingredient_id,
        stock,
        min_limit,
        cost_per_unit,
        ingredients (
          name,
          unit
        )
      `)
      .order('ingredient_id');
    
    if (error) {
        console.error("Error:", error);
        Toastify({text: "Error loading inventory", style:{background:"red"}}).showToast();
    } else {
        setItems(data);
    }
    setLoading(false);
  }

  // 2. التحديث السريع (+/-)
  async function quickUpdateStock(id, currentStock, change, name) {
    const newStock = Number(currentStock) + Number(change);
    
    if (newStock < 0) {
        Toastify({text: "الكمية لا يمكن أن تكون بالسالب", style:{background:"red"}}).showToast();
        return;
    }

    const { error } = await supabase.from('inventory').update({ stock: newStock }).eq('ingredient_id', id);
    
    if (!error) {
      // تحديث فوري للشاشة
      updateLocalItem(id, { stock: newStock });
      // تسجيل في اللوج
      logChange(id, change, 'Quick Update');
      Toastify({text: `${name} Updated ✅`, style:{background:"#B69142", color:"black"}}).showToast();
    }
  }

  // 3. حفظ التعديلات من المودال (التحكم الكامل)
  async function handleSaveChanges() {
    if (!selectedItem) return;

    const stockDiff = Number(editForm.stock) - Number(selectedItem.stock);

    // تحديث بيانات inventory فقط
    const { error } = await supabase
      .from('inventory')
      .update({
        stock: Number(editForm.stock),
        min_limit: Number(editForm.min_limit),
        cost_per_unit: Number(editForm.cost_per_unit)
      })
      .eq('ingredient_id', selectedItem.ingredient_id);

    if (!error) {
      // تحديث الواجهة
      updateLocalItem(selectedItem.ingredient_id, {
        stock: Number(editForm.stock),
        min_limit: Number(editForm.min_limit),
        cost_per_unit: Number(editForm.cost_per_unit)
      });

      // لو الكمية اتغيرت، نسجل في اللوج
      if (stockDiff !== 0) {
        logChange(selectedItem.ingredient_id, stockDiff, 'Manual Edit (Admin)');
      }

      setSelectedItem(null); // قفل المودال
      Toastify({text: "تم حفظ التعديلات بنجاح 👌", style:{background:"green"}}).showToast();
    } else {
      Toastify({text: "حدث خطأ أثناء الحفظ", style:{background:"red"}}).showToast();
    }
  }

  // دوال مساعدة
  const updateLocalItem = (id, newFields) => {
    setItems(prev => prev.map(item => item.ingredient_id === id ? { ...item, ...newFields } : item));
  };

  const logChange = async (id, change, reason) => {
    await supabase.from('inventory_log').insert([{ 
      ingredient_id: id, 
      change_amount: change, 
      reason: reason, 
      admin_name: 'Admin' 
    }]);
  };

  // فتح المودال
  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditForm({
      stock: item.stock,
      min_limit: item.min_limit,
      cost_per_unit: item.cost_per_unit
    });
  };

  // الفلترة والبحث
  const filteredItems = items.filter(item => {
      // بنجيب الاسم من الجدول المربوط ingredients
      const name = item.ingredients?.name || '';
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'low' ? item.stock <= item.min_limit : true;
      return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] gap-4 text-gray-100 font-sans p-2 overflow-hidden">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <i className="fas fa-boxes text-[#B69142] text-2xl"></i>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
         </div>

         {/* Search & Filter */}
         <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] py-2 pl-10 pr-4 rounded-xl text-sm focus:border-[#B69142] outline-none transition-all"
                />
            </div>

            <div className="flex bg-[#121212] p-1 rounded-xl border border-[#333]">
                <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-[#333] text-white' : 'text-gray-500'}`}>All</button>
                <button onClick={() => setFilter('low')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'low' ? 'bg-red-900 text-white' : 'text-gray-500'}`}>Low</button>
            </div>
         </div>
      </div>

      {/* Inventory Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <i className="fas fa-circle-notch fa-spin text-3xl mb-3 text-[#B69142]"></i>
                <p>Loading Inventory...</p>
             </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => {
                const isLowStock = item.stock <= item.min_limit;
                const ingredientName = item.ingredients?.name || 'Unknown Item';
                const unitName = item.ingredients?.unit || 'Unit';

                return (
                    <div key={item.ingredient_id} 
                         className={`relative bg-[#1E1E1E] rounded-2xl border p-5 flex flex-col justify-between transition-all group hover:-translate-y-1 hover:shadow-xl
                         ${isLowStock ? 'border-red-900/50 shadow-red-900/10' : 'border-[#333] hover:border-[#B69142]'}`}>
                        
                        {/* Header: Name & Cost */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="overflow-hidden">
                                <h4 className="font-bold text-gray-200 text-lg truncate" title={ingredientName}>
                                    {ingredientName}
                                </h4>
                                <div className="flex flex-col mt-1 space-y-0.5">
                                    <span className="text-[10px] text-gray-500 font-mono">ID: #{item.ingredient_id}</span>
                                    <span className="text-[10px] text-gray-400">
                                        Cost: <span className="text-[#B69142]">{item.cost_per_unit} LE</span> / {unitName}
                                    </span>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border shrink-0 ml-2
                                ${isLowStock ? 'bg-red-900/20 text-red-500 border-red-900 animate-pulse' : 'bg-green-900/20 text-green-500 border-green-900'}`}>
                                {isLowStock ? 'LOW' : 'OK'}
                            </span>
                        </div>

                        {/* Stock Display */}
                        <div className="flex items-end gap-2 mb-6">
                            <span className={`text-4xl font-black font-mono ${isLowStock ? 'text-red-500' : 'text-white'}`}>
                                {item.stock}
                            </span>
                            <span className="text-gray-500 font-bold text-sm mb-1">{unitName}</span>
                        </div>

                        {/* Controls */}
                        <div className="bg-[#121212] p-2 rounded-xl flex justify-between items-center border border-[#333]">
                            {/* Decrease */}
                            <button onClick={() => quickUpdateStock(item.ingredient_id, item.stock, -1, ingredientName)} 
                                className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-red-500 border border-[#333] hover:bg-red-900 hover:text-white hover:border-red-500 transition-all flex items-center justify-center">
                                <i className="fas fa-minus"></i>
                            </button>
                            
                            <div className="flex gap-2">
                                <button onClick={() => quickUpdateStock(item.ingredient_id, item.stock, 1, ingredientName)} 
                                    className="px-3 py-1 rounded bg-[#252525] text-xs font-bold text-green-500 hover:bg-green-500 hover:text-black transition-all">
                                    +1
                                </button>
                                {/* Edit Button */}
                                <button onClick={() => openEditModal(item)} 
                                    className="px-3 py-1 rounded bg-[#B69142] text-xs font-bold text-black hover:bg-white transition-all flex items-center gap-1">
                                    <i className="fas fa-pen text-[10px]"></i> Edit
                                </button>
                            </div>
                        </div>

                        {/* Warning Line if Low */}
                        {isLowStock && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-red-600 rounded-b-2xl"></div>
                        )}
                    </div>
                );
            })}
            </div>
        )}
      </div>

      {/* --- EDIT MODAL (نافذة التعديل) --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1E1E1E] border border-[#B69142] w-full max-w-sm rounded-2xl p-6 relative shadow-[0_0_50px_rgba(182,145,66,0.1)]">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
            
            <h3 className="text-xl text-[#B69142] font-bold mb-1 text-center">Edit Inventory</h3>
            <p className="text-gray-500 text-center text-sm mb-6 font-bold">{selectedItem.ingredients?.name}</p>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Current Stock ({selectedItem.ingredients?.unit})</label>
                    <input type="number" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-white focus:border-[#B69142] outline-none font-mono text-lg" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Min Limit</label>
                        <input type="number" value={editForm.min_limit} onChange={e => setEditForm({...editForm, min_limit: e.target.value})}
                            className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-white focus:border-[#B69142] outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Cost / Unit (LE)</label>
                        <input type="number" value={editForm.cost_per_unit} onChange={e => setEditForm({...editForm, cost_per_unit: e.target.value})}
                            className="w-full bg-[#121212] border border-[#333] p-3 rounded-lg text-white focus:border-[#B69142] outline-none" />
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                <button onClick={() => setSelectedItem(null)} className="flex-1 py-3 rounded-xl border border-[#333] text-gray-400 hover:bg-[#333] hover:text-white transition-all font-bold">Cancel</button>
                <button onClick={handleSaveChanges} className="flex-1 py-3 rounded-xl bg-[#B69142] text-black font-bold hover:bg-[#cbb37a] transition-all shadow-lg hover:shadow-[#B69142]/20">
                    Save Changes
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}