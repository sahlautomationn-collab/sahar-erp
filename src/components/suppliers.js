'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null); // للتحكم في قائمة الخيارات لكل كارت

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    setLoading(true);
    const { data } = await supabase.from('suppliers').select('*').order('name');
    if (data) setSuppliers(data);
    setLoading(false);
  }

  // --- Actions ---

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', contact_person: '', phone: '', address: '' });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const openEditModal = (sup) => {
    setEditingId(sup.id);
    setFormData({
      name: sup.name,
      contact_person: sup.contact_person,
      phone: sup.phone,
      address: sup.address
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      Toastify({text: "Name and Phone are required ⚠️", style:{background:"#ffcc00", color:"black"}}).showToast();
      return;
    }

    let error;
    if (editingId) {
      // Update
      const { error: updateError } = await supabase
        .from('suppliers')
        .update(formData)
        .eq('id', editingId);
      error = updateError;
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('suppliers')
        .insert([formData]);
      error = insertError;
    }

    if (!error) {
      Toastify({text: editingId ? "Supplier Updated ✅" : "Supplier Added ✅", style:{background:"#B69142", color:"black"}}).showToast();
      setIsModalOpen(false);
      fetchSuppliers();
    } else {
      Toastify({text: "Error Saving!", style:{background:"red"}}).showToast();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (!error) {
        setSuppliers(suppliers.filter(s => s.id !== id));
        Toastify({text: "Deleted 🗑️", style:{background:"red"}}).showToast();
      }
    }
    setActiveMenuId(null);
  };

  const toggleMenu = (id) => {
    if (activeMenuId === id) setActiveMenuId(null);
    else setActiveMenuId(id);
  };

  // Filter
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-6 text-gray-100 font-sans p-2 overflow-hidden" onClick={() => setActiveMenuId(null)}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <i className="fas fa-truck text-[#B69142] text-2xl"></i>
            <h1 className="text-2xl font-bold">Suppliers Management</h1>
         </div>

         <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input 
                    type="text" placeholder="Search supplier..." 
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] py-2 pl-10 pr-4 rounded-xl text-sm focus:border-[#B69142] outline-none"
                />
            </div>
            <button onClick={(e) => { e.stopPropagation(); openAddModal(); }} className="bg-[#B69142] text-black px-4 py-2 rounded-xl font-bold hover:bg-white transition-all flex items-center gap-2">
                <i className="fas fa-plus"></i> Add Supplier
            </button>
         </div>
      </div>
      
      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {loading ? <div className="text-center text-gray-500 mt-20">Loading...</div> : 
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSuppliers.map(sup => (
                <div key={sup.id} className="relative bg-[#1E1E1E] p-5 rounded-[2rem] border border-[#333] hover:border-[#B69142] transition-all group hover:-translate-y-1 hover:shadow-xl">
                    
                    {/* Top Section */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 bg-[#252525] rounded-2xl flex items-center justify-center text-2xl text-gray-400 group-hover:bg-[#B69142] group-hover:text-black transition-colors shadow-inner">
                            <i className="fas fa-building"></i>
                        </div>
                        
                        {/* Options Menu Button */}
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); toggleMenu(sup.id); }} 
                                className="w-8 h-8 rounded-full hover:bg-[#333] text-gray-500 hover:text-white flex items-center justify-center transition-all">
                                <i className="fas fa-ellipsis-v"></i>
                            </button>
                            
                            {/* Dropdown Menu */}
                            {activeMenuId === sup.id && (
                                <div className="absolute right-0 top-8 w-32 bg-[#252525] border border-[#444] rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(sup); }} className="w-full text-left px-4 py-3 text-sm hover:bg-[#333] hover:text-[#B69142] flex items-center gap-2">
                                        <i className="fas fa-pen text-xs"></i> Edit
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(sup.id); }} className="w-full text-left px-4 py-3 text-sm hover:bg-[#333] text-red-500 flex items-center gap-2">
                                        <i className="fas fa-trash text-xs"></i> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-100 mb-1 truncate" title={sup.name}>{sup.name}</h3>
                    <p className="text-gray-500 text-xs mb-4 font-mono truncate">{sup.contact_person || 'No Contact'}</p>
                    
                    <div className="space-y-3 pt-3 border-t border-[#333]">
                        <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                            <i className="fas fa-phone text-[#B69142] w-4"></i> 
                            <span className="font-mono tracking-wide">{sup.phone}</span>
                        </div>
                        <div className="flex items-start gap-3 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                            <i className="fas fa-map-marker-alt text-[#B69142] w-4 mt-0.5"></i> 
                            <span className="leading-snug">{sup.address || 'No Address Recorded'}</span>
                        </div>
                    </div>
                </div>
            ))}
         </div>
        }
      </div>

      {/* --- MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#1E1E1E] border border-[#B69142] w-full max-w-md rounded-[2rem] p-6 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><i className="fas fa-times"></i></button>
            
            <h3 className="text-xl text-[#B69142] font-bold mb-6 text-center">
                {editingId ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Company Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white focus:border-[#B69142] outline-none" placeholder="e.g. Al-Marai" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Phone Number</label>
                        <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white focus:border-[#B69142] outline-none font-mono" placeholder="010xxxxxxx" />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Contact Person</label>
                        <input type="text" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                            className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white focus:border-[#B69142] outline-none" placeholder="Mr. Ahmed" />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold ml-1 mb-1 block">Address</label>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white focus:border-[#B69142] outline-none" placeholder="Cairo, Egypt..." />
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