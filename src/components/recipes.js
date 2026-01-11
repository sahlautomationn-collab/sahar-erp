'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

export default function Recipes() {
  // --- States ---
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]); // قائمة الأصناف
  const [ingredients, setIngredients] = useState([]); // قائمة الخامات
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    menu_item_id: '',
    ingredient_id: '',
    amount: ''
  });

  // --- 1. Load Data ---
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // 1. Get Recipes
    const { data: recipesData } = await supabase
      .from('recipes')
      .select(`
        id, amount,
        menu_item_id, ingredient_id,
        menu (id, name_ar),
        ingredients (id, name, unit)
      `)
      .order('menu_item_id');

    // 2. Get Menu Items (For Dropdown)
    const { data: menuData } = await supabase.from('menu').select('id, name_ar').order('name_ar');

    // 3. Get Ingredients (For Dropdown)
    const { data: ingData } = await supabase.from('ingredients').select('id, name, unit').order('name');

    if (recipesData) setRecipes(recipesData);
    if (menuData) setMenuItems(menuData);
    if (ingData) setIngredients(ingData);
    
    setLoading(false);
  }

  // --- 2. Handle Actions ---
  
  // فتح المودال للإضافة
  const openAddModal = () => {
    setEditingId(null);
    setFormData({ menu_item_id: '', ingredient_id: '', amount: '' });
    setIsModalOpen(true);
  };

  // فتح المودال للتعديل
  const openEditModal = (recipe) => {
    setEditingId(recipe.id);
    setFormData({
      menu_item_id: recipe.menu_item_id,
      ingredient_id: recipe.ingredient_id,
      amount: recipe.amount
    });
    setIsModalOpen(true);
  };

  // الحفظ (إضافة أو تعديل)
  const handleSubmit = async () => {
    if (!formData.menu_item_id || !formData.ingredient_id || !formData.amount) {
      Toastify({text: "Please fill all fields ⚠️", style:{background:"#ffcc00", color:"black"}}).showToast();
      return;
    }

    let error;
    if (editingId) {
      // Update
      const { error: updateError } = await supabase
        .from('recipes')
        .update({
          menu_item_id: formData.menu_item_id,
          ingredient_id: formData.ingredient_id,
          amount: formData.amount
        })
        .eq('id', editingId);
      error = updateError;
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('recipes')
        .insert([formData]);
      error = insertError;
    }

    if (!error) {
      Toastify({text: editingId ? "Recipe Updated ✅" : "Recipe Added ✅", style:{background:"#B69142", color:"black"}}).showToast();
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } else {
      Toastify({text: "Error Saving!", style:{background:"red"}}).showToast();
      console.error(error);
    }
  };

  // الحذف
  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to remove this ingredient from the recipe?")) {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (!error) {
        setRecipes(recipes.filter(r => r.id !== id));
        Toastify({text: "Deleted 🗑️", style:{background:"red"}}).showToast();
      }
    }
  };

  // تصفية النتائج
  const filteredRecipes = recipes.filter(r => 
    r.menu?.name_ar.includes(search) || r.ingredients?.name.includes(search)
  );

  // البحث عن وحدة الخامة المختارة لعرضها في المودال
  const getSelectedUnit = () => {
    const ing = ingredients.find(i => i.id == formData.ingredient_id);
    return ing ? ing.unit : '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] gap-4 text-gray-100 font-sans p-2 overflow-hidden">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <i className="fas fa-scroll text-[#B69142] text-2xl"></i>
            <h1 className="text-2xl font-bold">Recipes Management</h1>
         </div>

         <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input
                    type="text" placeholder="Search recipe..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] py-2 pl-10 pr-4 rounded-xl text-sm focus:border-[#B69142] outline-none"
                />
            </div>
            <button onClick={openAddModal} className="bg-[#B69142] text-black px-4 py-2 rounded-xl font-bold hover:bg-white transition-all flex items-center gap-2">
                <i className="fas fa-plus"></i> Add Ingredient
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-[#1E1E1E] rounded-[2rem] border border-[#333] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <div className="table-container rounded-lg border border-[#333]">
            <table className="w-full text-left border-collapse">
                <thead className="bg-[#1a1a1a] text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-4 rounded-l-xl">Menu Item</th>
                        <th className="p-4">Ingredient</th>
                        <th className="p-4">Amount Required</th>
                        <th className="p-4 rounded-r-xl text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {loading ? (
                        <tr><td colSpan="4" className="text-center p-10 text-gray-500">Loading Recipes...</td></tr>
                    ) : (
                        filteredRecipes.map(r => (
                            <tr key={r.id} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors group">
                                <td className="p-4 font-bold text-[#B69142]">{r.menu?.name_ar}</td>
                                <td className="p-4 text-gray-200">{r.ingredients?.name}</td>
                                <td className="p-4 font-mono font-bold">{r.amount} <span className="text-xs text-gray-500">{r.ingredients?.unit}</span></td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(r)} className="w-8 h-8 rounded-lg bg-[#333] text-gray-400 hover:bg-[#B69142] hover:text-black flex items-center justify-center transition-all">
                                            <i className="fas fa-pen text-xs"></i>
                                        </button>
                                        <button onClick={() => handleDelete(r.id)} className="w-8 h-8 rounded-lg bg-[#333] text-gray-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all">
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1E1E1E] border border-[#B69142] w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><i className="fas fa-times"></i></button>
            
            <h3 className="text-xl text-[#B69142] font-bold mb-6 text-center">
                {editingId ? 'Edit Recipe Item' : 'Link Ingredient to Menu'}
            </h3>

            <div className="space-y-4">
                {/* 1. Select Menu Item */}
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Menu Item</label>
                    <select 
                        value={formData.menu_item_id} 
                        onChange={(e) => setFormData({...formData, menu_item_id: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white focus:border-[#B69142] outline-none appearance-none"
                    >
                        <option value="">-- Select Product --</option>
                        {menuItems.map(m => <option key={m.id} value={m.id}>{m.name_ar}</option>)}
                    </select>
                </div>

                {/* 2. Select Ingredient */}
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Ingredient</label>
                    <select 
                        value={formData.ingredient_id} 
                        onChange={(e) => setFormData({...formData, ingredient_id: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white focus:border-[#B69142] outline-none appearance-none"
                    >
                        <option value="">-- Select Ingredient --</option>
                        {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                    </select>
                </div>

                {/* 3. Amount */}
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Amount Required</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={formData.amount} 
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            className="w-full bg-[#121212] border border-[#333] p-3 pl-4 rounded-xl text-white focus:border-[#B69142] outline-none font-mono text-lg"
                            placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B69142] font-bold text-sm">
                            {getSelectedUnit()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-[#333] text-gray-400 hover:bg-[#333] hover:text-white font-bold transition-all">Cancel</button>
                <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-[#B69142] text-black font-bold hover:bg-[#cbb37a] shadow-lg transition-all">Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}