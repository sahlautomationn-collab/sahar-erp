'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import { logger } from '../lib/logger';
import { validators, sanitizers } from '../lib/utils';

export default function Menu() {
  const [menu, setMenu] = useState([]);
  
  // حالة الفورم (تمت إضافة كل الحقول + حالة خاصة للملف)
  const [newItem, setNewItem] = useState({ 
    id: '', // اختياري (لو سيبته فاضي الداتابيز هتعمل اوتو)
    name_ar: '', name_en: '', category: 'hot',
    price: '', discount_price: '', cost: '', 
    is_available: true, is_trending: false
  });
  const [newItemImage, setNewItemImage] = useState(null); // لتخزين ملف الصورة المؤقت

  useEffect(() => { fetchMenu(); }, []);

  async function fetchMenu() {
    const { data, error } = await supabase.from('menu').select('*').order('id', { ascending: true });
    if (error) logger.error("Error fetching menu", error);
    if (data) setMenu(data);
  }

  // --- 1. Add new menu item function ---
  async function addNewItem() {
    // Validation
    if (!validators.isRequired(newItem.name_ar)) {
      return toast.error("Name (Arabic) is required");
    }

    if (!validators.isPositive(newItem.price)) {
      return toast.error("Price must be a positive number");
    }

    // Sanitize inputs
    const sanitizedItem = {
      ...newItem,
      name_ar: sanitizers.sanitizeString(newItem.name_ar),
      name_en: sanitizers.sanitizeString(newItem.name_en),
      price: sanitizers.sanitizeNumber(newItem.price),
      discount_price: sanitizers.sanitizeNumber(newItem.discount_price) || 0,
      cost: sanitizers.sanitizeNumber(newItem.cost) || 0
    };

    const loadingToast = toast.loading("Adding item...");

    let finalImageUrl = null;

    try {
      // Upload image if selected
      if (newItemImage) {
        const fileExt = newItemImage.name.split('.').pop();
        const fileName = `new_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('menu_images')
          .upload(fileName, newItemImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('menu_images')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      // Prepare data payload
      const payload = {
        ...sanitizedItem,
        image: finalImageUrl,
        id: sanitizedItem.id ? sanitizedItem.id : undefined
      };

      // Insert into database
      const { error } = await supabase.from('menu').insert([payload]);

      if (error) throw error;

      // Success
      toast.success("Item added successfully");
      fetchMenu();

      // Reset form
      setNewItem({
        id: '', name_ar: '', name_en: '', category: 'hot',
        price: '', discount_price: '', cost: '',
        is_available: true, is_trending: false
      });
      setNewItemImage(null);

    } catch (err) {
      logger.error("Error adding menu item", err);
      toast.error("Failed to add item: " + err.message);
    }
  }

  // --- 2. Quick update function ---
  async function updateItem(oldId, field, value) {
    if (field === 'id') {
       toast.confirm("Warning: Changing the ID may cause issues. Are you sure?", async () => {
         await performUpdate(oldId, field, value);
       });
       return;
    }

    await performUpdate(oldId, field, value);
  }

  async function performUpdate(oldId, field, value) {
    try {
      // Sanitize value if it's a string
      const sanitizedValue = typeof value === 'string'
        ? sanitizers.sanitizeString(value)
        : value;

      const { error } = await supabase.from('menu').update({ [field]: sanitizedValue }).eq('id', oldId);
      if (error) throw error;

      toast.success("Saved successfully");
      fetchMenu();
    } catch (error) {
      logger.error("Error updating item", error);
      toast.error("Failed to update: " + error.message);
      fetchMenu();
    }
  }

  // --- 3. Change image for existing item ---
  async function handleImageChange(id, e) {
    const file = e.target.files[0];
    if (!file) return;

    toast.loading("Changing image...");

    try {
      const fileName = `menu_${id}_${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('menu_images').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('menu_images').getPublicUrl(fileName);
      await updateItem(id, 'image', publicUrl);
      toast.success("Image changed successfully");
    } catch (error) {
      logger.error("Error uploading image", error);
      toast.error("Upload failed: " + error.message);
    }
  }

  return (
    <div className="space-y-8 animate-fade w-full overflow-hidden">
      
      {/* ================= FORM SECTION (NEW STYLE) ================= */}
      <div className="bg-[#121212] p-6 rounded-xl border border-[#B69142] relative overflow-hidden">
        {/* شريط جمالي جانبي */}
        <div className="absolute top-0 right-0 w-2 h-full bg-[#B69142]"></div>
        
        <h3 className="text-[#B69142] font-bold text-xl mb-6 flex items-center gap-2">
          <i className="fas fa-plus-circle"></i> إضافة منتج جديد
        </h3>
        
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-start">
          
          {/* 1. الأسماء والقسم */}
          <div className="col-span-1 md:col-span-2 space-y-3">
             <input placeholder="الاسم (عربي)" className="w-full p-3 bg-[#1a1a1a] rounded border border-[#333] text-white focus:border-[#B69142] outline-none text-right" 
               value={newItem.name_ar} onChange={e => setNewItem({...newItem, name_ar: e.target.value})} />
             <input placeholder="Name (English)" className="w-full p-3 bg-[#1a1a1a] rounded border border-[#333] text-white focus:border-[#B69142] outline-none" 
               value={newItem.name_en} onChange={e => setNewItem({...newItem, name_en: e.target.value})} />
             <select className="w-full p-3 bg-[#1a1a1a] rounded border border-[#333] text-white focus:border-[#B69142] outline-none cursor-pointer"
               value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
               {['hot', 'coffee', 'ice', 'frappe', 'smoothie', 'fresh', 'bakery', 'dessert'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
             </select>
          </div>

          {/* 2. الأسعار والتكلفة */}
          <div className="col-span-1 md:col-span-2 space-y-3">
             <div className="flex gap-2">
                <input type="number" placeholder="السعر (Price)" className="w-full p-3 bg-[#1a1a1a] rounded border border-[#333] text-[#B69142] font-bold focus:border-[#B69142] outline-none" 
                  value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                <input type="number" placeholder="الخصم (Opt)" className="w-full p-3 bg-[#1a1a1a] rounded border border-[#333] text-gray-400 focus:border-[#B69142] outline-none" 
                  value={newItem.discount_price} onChange={e => setNewItem({...newItem, discount_price: e.target.value})} />
             </div>
             <div className="flex gap-2">
                <input type="number" placeholder="التكلفة (Cost)" className="w-full p-3 bg-[#1a1a1a] rounded border border-[#333] text-gray-400 focus:border-[#B69142] outline-none" 
                   value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} />
                <input type="number" placeholder="ID (Manual)" className="w-full p-3 bg-[#1a1a1a] rounded border border-[#333] text-gray-500 focus:border-[#B69142] outline-none" 
                   value={newItem.id} onChange={e => setNewItem({...newItem, id: e.target.value})} title="اتركه فارغاً لإنشاء تلقائي" />
             </div>
          </div>

          {/* 3. الإعدادات والصورة */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-3 h-full">
             {/* Switches */}
             <div className="flex gap-4 p-3 bg-[#1a1a1a] rounded border border-[#333] justify-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-[#B69142] w-5 h-5" checked={newItem.is_available} onChange={e => setNewItem({...newItem, is_available: e.target.checked})} />
                  <span className="text-sm text-gray-300">متاح (Avail)</span>
                </label>
                <div className="w-px h-6 bg-[#333]"></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-[#B69142] w-5 h-5" checked={newItem.is_trending} onChange={e => setNewItem({...newItem, is_trending: e.target.checked})} />
                  <span className="text-sm text-gray-300">تريند (Star)</span>
                </label>
             </div>

             {/* Image Picker */}
             <div className="flex gap-2 h-full">
                <label className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer transition-all ${newItemImage ? 'border-[#00c851] bg-[#00c851]/10' : 'border-[#333] hover:border-[#B69142] hover:bg-[#B69142]/10'}`}>
                   <i className={`fas ${newItemImage ? 'fa-check-circle text-green-500' : 'fa-cloud-upload-alt text-gray-500'} mb-1`}></i>
                   <span className="text-xs text-gray-400">{newItemImage ? 'تم اختيار الصورة' : 'رفع صورة'}</span>
                   <input type="file" className="hidden" accept="image/*" onChange={e => setNewItemImage(e.target.files[0])} />
                </label>
                
                <button onClick={addNewItem} className="flex-1 bg-[#B69142] hover:bg-[#d4af56] text-black font-bold rounded shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center">
                  <i className="fas fa-plus mb-1"></i>
                  <span>إضافة</span>
                </button>
             </div>
          </div>

        </div>
      </div>

      {/* ================= TABLE SECTION ================= */}
      <div className="table-container bg-[#121212] rounded-xl border border-[#333] shadow-2xl">
        <table className="w-full text-center border-collapse min-w-[1200px]">
          <thead>
            <tr className="text-[#B69142] bg-[#1a1a1a] text-sm uppercase tracking-wider font-bold">
              <th className="p-4 border-b border-[#333]">Image (Edit)</th>
              <th className="p-4 border-b border-[#333]">Cost</th>
              <th className="p-4 border-b border-[#333]">Trending</th>
              <th className="p-4 border-b border-[#333]">Available</th>
              <th className="p-4 border-b border-[#333]">Discount</th>
              <th className="p-4 border-b border-[#333]">Price</th>
              <th className="p-4 border-b border-[#333]">Name (AR)</th>
              <th className="p-4 border-b border-[#333]">Name (EN)</th>
              <th className="p-4 border-b border-[#333]">Category</th>
              <th className="p-4 border-b border-[#333]">ID</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 text-sm font-medium">
            {menu.map(item => (
              <tr key={item.id} className="border-b border-[#222] hover:bg-[#1f1f1f] transition-colors group">

                {/* Image Upload */}
                <td className="p-3">
                  <div className="flex justify-center relative group cursor-pointer">
                    <label htmlFor={`file-${item.id}`} className="cursor-pointer relative block w-24 h-24 shrink-0">
                      <div className="w-full h-full bg-[#222] rounded-lg overflow-hidden border border-[#333] group-hover:border-[#B69142]">
                        <img src={item.image || 'https://placehold.co/100'} onError={(e) => e.target.src='https://placehold.co/100?text=Error'} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <i className="fas fa-pen text-white text-xs"></i>
                      </div>
                    </label>
                    <input type="file" id={`file-${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleImageChange(item.id, e)} />
                  </div>
                </td>

                <td className="p-3"><input type="number" className="bg-transparent text-center text-gray-500 border-b border-transparent focus:border-[#B69142] outline-none w-14" defaultValue={item.cost} onBlur={e => updateItem(item.id, 'cost', e.target.value)} /></td>
                
                <td className="p-3">
                   <button onClick={() => updateItem(item.id, 'is_trending', !item.is_trending)} className={`text-lg transition-transform hover:scale-110 ${item.is_trending ? 'text-[#B69142]' : 'text-[#333]'}`}><i className="fas fa-star"></i></button>
                </td>

                <td className="p-3">
                  <div onClick={() => updateItem(item.id, 'is_available', !item.is_available)} className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${item.is_available ? 'bg-green-600' : 'bg-red-900'}`}>
                     <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-md ${item.is_available ? 'left-6' : 'left-1'}`}></div>
                  </div>
                </td>

                <td className="p-3"><input type="number" className="bg-transparent text-center text-gray-400 border-b border-transparent focus:border-[#B69142] outline-none w-14" defaultValue={item.discount_price} onBlur={e => updateItem(item.id, 'discount_price', e.target.value)} /></td>
                <td className="p-3"><input type="number" className="bg-transparent text-center text-[#B69142] font-bold text-lg border-b border-transparent focus:border-[#B69142] outline-none w-16" defaultValue={item.price} onBlur={e => updateItem(item.id, 'price', e.target.value)} /></td>
                <td className="p-3"><input className="bg-transparent text-center text-white border-b border-transparent focus:border-[#B69142] outline-none w-full font-bold" defaultValue={item.name_ar} onBlur={e => updateItem(item.id, 'name_ar', e.target.value)} /></td>
                <td className="p-3"><input className="bg-transparent text-center text-white border-b border-transparent focus:border-[#B69142] outline-none w-full" defaultValue={item.name_en} onBlur={e => updateItem(item.id, 'name_en', e.target.value)} /></td>
                <td className="p-3"><span className="bg-[#222] border border-[#333] px-2 py-1 rounded text-[10px] uppercase text-gray-400 tracking-wider">{item.category}</span></td>

                {/* ID Input */}
                <td className="p-3">
                  <input type="number" defaultValue={item.id} 
                    onBlur={(e) => { if(e.target.value != item.id) updateItem(item.id, 'id', e.target.value) }}
                    className="bg-transparent text-center text-gray-600 font-mono border-b border-transparent focus:border-[#B69142] outline-none w-12 hover:border-[#333]" />
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}