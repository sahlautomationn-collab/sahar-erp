'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

export default function POS() {
  // --- States ---
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  
  // Customer State
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  // Order State
  const [paymentMethod, setPaymentMethod] = useState('Cash'); 

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [sugar, setSugar] = useState('Medium');
  const [note, setNote] = useState('');

  // --- 1. Load Menu ---
  useEffect(() => {
    async function fetchMenu() {
      // شلنا شرط .eq('is_available', true) عشان نجيب كله
      const { data } = await supabase.from('menu').select('*').order('name_ar');
      if (data) setMenu(data);
    }
    fetchMenu();
  }, []);

  // --- 2. Customer Lookup Logic ---
  const handlePhoneChange = async (e) => {
    const inputPhone = e.target.value;
    setPhone(inputPhone);

    if (inputPhone.length >= 11) {
      setIsLoadingCustomer(true);
      const { data } = await supabase.from('customers').select('*').eq('phone', inputPhone).single();
      setIsLoadingCustomer(false);

      if (data) {
        setCustomerData(data);
        setCustomerName(data.name);
        Toastify({text: "Customer Found! 🎉", style:{background:"#B69142", color:"black"}}).showToast();
      } else {
        setCustomerData(null);
      }
    } else {
      setCustomerData(null);
    }
  };

  // --- 3. Cart Logic ---
  const addToCart = () => {
    const finalPrice = (selectedItem.discount_price > 0 && selectedItem.discount_price < selectedItem.price) 
                       ? selectedItem.discount_price : selectedItem.price;
    
    const cartItem = {
      ...selectedItem,
      qty: 1,
      price: finalPrice,
      note: `(Sugar: ${sugar}) ${note}`
    };

    setCart([...cart, cartItem]);
    setSelectedItem(null);
    Toastify({text: "Added ✅", style:{background:"#222", color:"#B69142"}}).showToast();
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // --- 4. Submit Order ---
  const submitOrder = async () => {
    if(!cart.length) return;
    
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    // تجهيز ملخص الطلب مع الملاحظات والسكر
    const summary = cart.map(i => {
        return `${i.qty}x ${i.name_ar}${i.note ? ` ${i.note}` : ''}`
    }).join(', ');

    // معالجة بيانات العميل (تحديث أو إنشاء)
    if (phone.length >= 11) {
      if (customerData) {
        await supabase.from('customers').update({
          last_visit: new Date(),
          total_orders: (customerData.total_orders || 0) + 1,
          total_spent: (customerData.total_spent || 0) + total
        }).eq('id', customerData.id);
      } else {
        await supabase.from('customers').insert([{
          phone: phone, name: customerName || 'Unknown', first_visit: new Date(), last_visit: new Date(), total_orders: 1, total_spent: total
        }]);
      }
    }

    // إنشاء الطلب
    const { data, error } = await supabase.from('orders').insert([{
      customer_name: customerName || "Walk-in", phone: phone || "000000000", total_amount: total, 
      order_summary: summary, status: 'New', payment_method: paymentMethod, is_paid: true
    }]).select();

    if(!error) {
      // تسجيل تفاصيل المنتجات
      const orderItems = cart.map(i => ({
        order_id: data[0].order_id, menu_item_id: i.id, quantity: i.qty, price_at_time: i.price
      }));
      await supabase.from('order_items').insert(orderItems);

      // إعادة تعيين الصفحة
      setCart([]); setPhone(''); setCustomerName(''); setCustomerData(null); setPaymentMethod('Cash');
      Toastify({text: "Order Paid & Sent 🚀", style:{background:"#00c851"}}).showToast();
    } else {
      Toastify({text: "Error!", style:{background:"red"}}).showToast();
    }
  };

  // Filtering
  const filteredMenu = menu.filter(item => 
    (category === 'All' || item.category === category) &&
    (item.name_ar.includes(search) || item.name_en?.toLowerCase().includes(search.toLowerCase()))
  );
  const categories = ['All', ...new Set(menu.map(i => i.category))];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2.5rem)] gap-4 text-gray-100 overflow-hidden font-sans p-2">

      {/* 🟢 LEFT SIDE: PRODUCTS GRID */}
      <div className="flex-1 bg-[#1E1E1E] rounded-[2rem] shadow-2xl border border-[#333] p-5 flex flex-col h-full relative overflow-hidden">

        {/* Top Bar: Search & Categories */}
        <div className="flex flex-col gap-4 mb-6 z-10">
          <div className="relative">
             <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
             <input
               type="text"
               placeholder="Search menu..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full bg-[#121212] border border-[#333] py-3.5 pl-12 pr-4 rounded-xl text-white focus:border-[#B69142] focus:ring-1 focus:ring-[#B69142] outline-none transition-all shadow-inner"
             />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-6 py-2.5 rounded-xl whitespace-nowrap text-sm font-bold transition-all shadow-md transform active:scale-95 shrink-0
                ${category === cat
                  ? 'bg-gradient-to-r from-[#B69142] to-[#d4af37] text-black shadow-[#B69142]/20'
                  : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-white'}`}>
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMenu.map(item => {
              // هل المنتج متاح؟
              const isAvailable = item.is_available; 

              return (
                <div key={item.id} 
                  // لو مش متاح نوقف الكليك
                  onClick={() => { if(isAvailable) { setSelectedItem(item); setNote(''); setSugar('Medium'); } }}
                  className={`relative bg-[#252525] rounded-2xl border border-[#333] overflow-hidden group transition-all duration-300 flex flex-col shadow-lg
                    ${isAvailable ? 'cursor-pointer hover:border-[#B69142] hover:-translate-y-1 hover:shadow-xl' : 'opacity-80 cursor-not-allowed border-red-900/30'}`}>
                  
                  {/* Image Section */}
                  <div className="w-full aspect-square relative overflow-hidden bg-[#1a1a1a]">
                    <img 
                      src={item.image} 
                      alt={item.name_ar} 
                      className={`w-full h-full object-cover transition-transform duration-700 ${isAvailable ? 'group-hover:scale-110' : 'grayscale blur-[2px]'}`} 
                    />
                    
                    {/* Badge for Sale */}
                    {isAvailable && item.discount_price > 0 && (
                      <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-md z-20">
                        SALE
                      </span>
                    )}

                    {/* Overlay for Unavailable */}
                    {!isAvailable && (
                       <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30">
                          <i className="fas fa-ban text-red-500 text-3xl mb-1"></i>
                          <span className="text-white font-bold text-sm border border-white/20 bg-black/50 px-3 py-1 rounded-full">غير متوفر</span>
                       </div>
                    )}
                  </div>
                  
                  {/* Info Section */}
                  <div className="p-4 flex flex-col flex-1 justify-between bg-gradient-to-b from-[#252525] to-[#1e1e1e]">
                    <h3 className={`font-bold text-sm mb-1 line-clamp-1 ${isAvailable ? 'text-gray-100' : 'text-gray-500'}`}>{item.name_ar}</h3>
                    
                    <div className="flex justify-between items-end">
                       <div className="flex flex-col">
                          {item.discount_price > 0 && <span className="text-gray-600 text-[10px] line-through">{item.price} LE</span>}
                          <span className={`${isAvailable ? 'text-[#B69142]' : 'text-gray-600'} font-bold text-lg`}>
                            {item.discount_price || item.price} <span className="text-[10px]">LE</span>
                          </span>
                       </div>
                       
                       {isAvailable && (
                         <div className="w-8 h-8 rounded-full bg-[#333] text-[#B69142] flex items-center justify-center group-hover:bg-[#B69142] group-hover:text-black transition-colors shadow-lg">
                           <i className="fas fa-plus"></i>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🟠 RIGHT SIDE: CART (Sidebar) */}
      <div className="w-full lg:w-96 xl:w-[420px] max-w-[90vw] bg-[#1E1E1E] rounded-[2rem] shadow-2xl border border-[#333] flex flex-col h-full shrink-0 overflow-hidden">
        
        {/* Customer Header */}
        <div className="p-5 bg-[#252525] border-b border-[#333]">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-[#B69142] font-bold text-lg flex items-center gap-2">
                 <i className="fas fa-user-circle"></i> Customer
               </h2>
               <div className="text-[10px] text-gray-500 bg-[#121212] px-2 py-1 rounded border border-[#333]">
                 {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
               </div>
            </div>

            <div className="flex gap-2 mb-3">
               <div className="relative flex-1">
                 <i className="fas fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                 <input 
                   value={phone} 
                   onChange={handlePhoneChange} 
                   placeholder="Mobile Number" 
                   className="w-full bg-[#121212] border border-[#333] py-2.5 pl-8 pr-2 rounded-lg text-sm focus:border-[#B69142] outline-none font-mono tracking-wide"
                 />
               </div>
            </div>

            {customerData ? (
                <div className="bg-gradient-to-r from-[#B69142]/20 to-transparent border-l-4 border-[#B69142] rounded-r-lg p-3 animate-fade-in">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white">{customerData.name}</span>
                        <span className="text-[10px] bg-[#B69142] text-black px-2 py-0.5 rounded font-bold">VIP</span>
                    </div>
                    <div className="flex gap-4 text-[11px] text-gray-400">
                        <span>Orders: <b className="text-[#B69142]">{customerData.total_orders}</b></span>
                        <span>Total: <b className="text-[#B69142]">{customerData.total_spent} LE</b></span>
                    </div>
                </div>
            ) : (
                <div className="relative">
                  <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                  <input 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    disabled={isLoadingCustomer}
                    placeholder={isLoadingCustomer ? "Searching..." : "Customer Name"} 
                    className="w-full bg-[#121212] border border-[#333] py-2.5 pl-8 pr-2 rounded-lg text-sm focus:border-[#B69142] outline-none"
                  />
                </div>
            )}
        </div>

        {/* Cart List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#181818]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
              <div className="w-20 h-20 bg-[#222] rounded-full flex items-center justify-center mb-4">
                 <i className="fas fa-shopping-basket text-3xl text-gray-500"></i>
              </div>
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs">Select items from the menu</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#252525] p-3 rounded-xl border border-[#333] hover:border-[#444] group transition-all shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="w-8 h-8 rounded-lg bg-[#B69142] text-black flex items-center justify-center font-bold text-xs shrink-0">
                     {item.qty}
                   </div>
                   <div className="flex flex-col">
                      <p className="font-bold text-sm text-gray-200 truncate">{item.name_ar}</p>
                      {item.note && <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{item.note}</p>}
                   </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[#B69142]">{item.price * item.qty}</span>
                  <button onClick={() => removeFromCart(idx)} className="w-7 h-7 rounded-full bg-[#1a1a1a] text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Payment */}
        <div className="bg-[#252525] p-5 border-t border-[#333] shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-20">
            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {['Cash', 'Vodafone', 'InstaPay'].map(method => (
                    <button 
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-3 rounded-xl border text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-2
                        ${paymentMethod === method 
                           ? 'bg-[#B69142] text-black border-[#B69142] shadow-[0_0_10px_rgba(182,145,66,0.4)] transform scale-105' 
                           : 'bg-[#1a1a1a] text-gray-500 border-[#333] hover:border-gray-500 hover:text-gray-300'}`}
                    >
                       <i className={`fas text-lg ${method === 'Cash' ? 'fa-wallet' : method === 'Vodafone' ? 'fa-mobile-alt' : 'fa-university'}`}></i>
                       {method}
                    </button>
                ))}
            </div>

            <div className="flex justify-between items-center mb-5 bg-[#121212] p-4 rounded-xl border border-[#333]">
                <span className="text-gray-400 text-sm font-bold">Total Payable</span>
                <span className="text-[#B69142] font-black font-mono text-3xl">{cart.reduce((a,b)=>a+(b.price*b.qty),0)} <span className="text-sm font-sans font-medium text-gray-500">LE</span></span>
            </div>

            <button 
                onClick={submitOrder} 
                disabled={cart.length === 0}
                className="w-full bg-gradient-to-r from-[#B69142] to-[#cbb37a] text-black font-black text-lg py-4 rounded-xl hover:shadow-[0_0_20px_rgba(182,145,66,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3">
                <span>CONFIRM & PRINT</span>
                <i className="fas fa-print"></i>
            </button>
        </div>
      </div>

      {/* --- MODAL POPUP (Improved) --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1E1E1E] border border-[#B69142]/50 w-full max-w-sm rounded-[2rem] p-6 relative shadow-2xl shadow-[#B69142]/10 transform scale-100 transition-all">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 w-8 h-8 bg-[#121212] rounded-full text-gray-500 hover:text-white flex items-center justify-center"><i className="fas fa-times"></i></button>
            
            <div className="text-center mb-6 mt-2">
                <h3 className="text-2xl text-[#B69142] font-black mb-1">{selectedItem.name_ar}</h3>
                <p className="text-gray-500 text-sm font-medium tracking-wide">{selectedItem.name_en}</p>
            </div>
            
            <div className="mb-6">
              <label className="text-[10px] text-gray-400 mb-3 block uppercase tracking-widest font-bold text-center">Sugar Level</label>
              <div className="flex bg-[#121212] p-1.5 rounded-xl border border-[#333]">
                {['Zero', 'Medium', 'Extra'].map(lvl => (
                  <button key={lvl} onClick={() => setSugar(lvl)} 
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${sugar === lvl ? 'bg-[#B69142] text-black shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="✍️ Add a note (optional)..." 
              className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white mb-6 focus:border-[#B69142] outline-none text-sm shadow-inner transition-colors" />

            <button onClick={addToCart} className="w-full bg-[#B69142] text-black font-bold py-4 rounded-xl hover:bg-[#cbb37a] hover:shadow-lg transition-all flex justify-between px-6">
              <span>ADD TO CART</span>
              <span>{selectedItem.discount_price || selectedItem.price} LE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}