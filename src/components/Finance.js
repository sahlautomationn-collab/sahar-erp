'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

export default function Finance() {
  // --- States ---
  const [timeRange, setTimeRange] = useState('daily'); // daily, weekly, monthly
  
  const [stats, setStats] = useState({ 
    income: 0, 
    expenses: 0, 
    cogs: 0, 
    netProfit: 0 
  });
  const [expensesList, setExpensesList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Expenses Form State
  const [newExp, setNewExp] = useState({ 
    amount: '', 
    description: '', 
    category: 'Bills',
    recorded_by: '' // خليناها فاضية عشان يكتب اسمه
  });

  // لما نغير الوقت، نحمل البيانات تاني
  useEffect(() => { loadFinance(); }, [timeRange]);

  // دالة لحساب تاريخ البداية بناءً على الفلتر
  const getStartDate = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // تصفير الوقت

    if (timeRange === 'weekly') {
        // نرجع 7 أيام لورا
        date.setDate(date.getDate() - 7);
    } else if (timeRange === 'monthly') {
        // نرجع لأول يوم في الشهر الحالي
        date.setDate(1);
    }
    // daily مش محتاج تعديل لأنه واخد النهاردة 00:00
    return date.toISOString();
  };

  async function loadFinance() {
    setLoading(true);
    const startDateISO = getStartDate(); // التاريخ بناءً على الفلتر

    // 1. حساب المبيعات (Sales)
    const { data: orders } = await supabase.from('orders')
      .select('order_id, total_amount')
      .eq('is_paid', true)
      .gte('created_at', startDateISO); // استخدمنا تاريخ الفلتر
    
    const income = orders ? orders.reduce((sum, o) => sum + o.total_amount, 0) : 0;

    // 2. حساب تكلفة المنتجات (COGS)
    let cogsTotal = 0;
    if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.order_id);
        
        const { data: items } = await supabase
            .from('order_items')
            .select('quantity, menu(cost)') 
            .in('order_id', orderIds);

        if (items) {
            cogsTotal = items.reduce((sum, item) => {
                const itemCost = item.menu?.cost || 0; 
                return sum + (itemCost * item.quantity);
            }, 0);
        }
    }

    // 3. حساب المصروفات (Expenses)
    const { data: expenses } = await supabase.from('expenses')
      .select('*')
      .gte('created_at', startDateISO) // استخدمنا تاريخ الفلتر
      .order('created_at', { ascending: false });
    
    const expenseTotal = expenses ? expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
    
    // 4. الحساب النهائي
    setStats({ 
        income, 
        expenses: expenseTotal, 
        cogs: cogsTotal,
        netProfit: income - (expenseTotal + cogsTotal) 
    });
    setExpensesList(expenses || []);
    setLoading(false);
  }

  async function addExpense() {
    // التحقق إن كل الخانات مليانة بما فيها الاسم
    if (!newExp.amount || !newExp.description || !newExp.recorded_by) {
        Toastify({text: "Please fill all fields & Name ⚠️", style:{background:"#ffcc00", color: "black"}}).showToast();
        return;
    }

    const { error } = await supabase.from('expenses').insert([{
        amount: parseFloat(newExp.amount),
        description: newExp.description,
        category: newExp.category,
        recorded_by: newExp.recorded_by, // الاسم اللي انكتب
        created_at: new Date()
    }]);

    if (!error) {
      Toastify({text: "Expense Recorded 📉", style:{background:"#B69142", color:"black"}}).showToast();
      loadFinance();
      // نفضي الخانات ما عدا الاسم عشان لو هيسجل كذا حاجة ورا بعض
      setNewExp({ ...newExp, amount: '', description: '' }); 
    } else {
      console.error(error);
      Toastify({text: "Error adding expense", style:{background:"red"}}).showToast();
    }
  }

  async function deleteExpense(id) {
    if(confirm("Are you sure you want to delete this expense?")) {
      await supabase.from('expenses').delete().eq('id', id);
      loadFinance();
      Toastify({text: "Deleted 🗑️", style:{background:"red"}}).showToast();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-6 text-gray-100 font-sans p-2 overflow-y-auto custom-scrollbar">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-2 gap-4">
         <div className="flex items-center gap-3">
            <i className="fas fa-chart-pie text-[#B69142] text-2xl"></i>
            <h1 className="text-2xl font-bold">Financial Overview</h1>
         </div>

         {/* Time Range Filter Buttons */}
         <div className="bg-[#121212] p-1 rounded-xl border border-[#333] flex gap-1">
            {['daily', 'weekly', 'monthly'].map((range) => (
                <button 
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all
                    ${timeRange === range 
                        ? 'bg-[#B69142] text-black shadow-lg' 
                        : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'}`}
                >
                    {range}
                </button>
            ))}
         </div>
      </div>

      {/* 1. KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Sales Card */}
        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-[#333] shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-cash-register text-6xl text-green-500"></i>
          </div>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Sales ({timeRange})</p>
          <h3 className="text-3xl font-black text-white mt-2">{stats.income.toLocaleString()} <span className="text-sm text-[#B69142]">LE</span></h3>
        </div>

        {/* COGS Card */}
        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-[#333] shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-boxes text-6xl text-orange-500"></i>
          </div>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Costs (COGS)</p>
          <h3 className="text-3xl font-black text-orange-500 mt-2">-{stats.cogs.toLocaleString()} <span className="text-sm text-gray-400">LE</span></h3>
        </div>

        {/* Expenses Card */}
        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-[#333] shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-file-invoice-dollar text-6xl text-red-500"></i>
          </div>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Expenses ({timeRange})</p>
          <h3 className="text-3xl font-black text-red-500 mt-2">-{stats.expenses.toLocaleString()} <span className="text-sm text-gray-400">LE</span></h3>
        </div>

        {/* Net Profit Card */}
        <div className="bg-gradient-to-br from-[#B69142] to-[#8a6d32] p-6 rounded-2xl shadow-xl shadow-[#B69142]/20 relative overflow-hidden text-black">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <i className="fas fa-coins text-6xl text-black"></i>
          </div>
          <p className="text-black/70 text-sm font-black uppercase tracking-wider">Net Profit ({timeRange})</p>
          <h3 className="text-4xl font-black mt-1">{stats.netProfit.toLocaleString()} <span className="text-lg">LE</span></h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Add Expense Form */}
        <div className="lg:col-span-1 bg-[#1E1E1E] p-6 rounded-[2rem] border border-[#333] shadow-2xl h-fit">
            <h3 className="text-[#B69142] font-bold text-lg mb-6 flex items-center gap-2">
                <i className="fas fa-plus-circle"></i> Add New Expense
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold ml-1">Amount</label>
                    <div className="relative">
                        <input type="number" placeholder="0.00" className="w-full bg-[#121212] border border-[#333] p-4 pl-4 rounded-xl text-white focus:border-[#B69142] outline-none font-mono text-lg"
                        value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">LE</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold ml-1">Description</label>
                    <input type="text" placeholder="e.g. Electricity, Supplies..." className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white focus:border-[#B69142] outline-none"
                    value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold ml-1">Category</label>
                        <select className="w-full bg-[#121212] border border-[#333] p-4 rounded-xl text-white focus:border-[#B69142] outline-none appearance-none"
                        value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})}>
                            <option>Bills</option>
                            <option>Salaries</option>
                            <option>Maintenance</option>
                            <option>Restocking</option>
                            <option>Marketing</option>
                            <option>Other</option>
                        </select>
                    </div>
                    {/* خانة الاسم بقيت مفعلة وإجبارية */}
                    <div>
                         <label className="text-xs text-[#B69142] uppercase font-bold ml-1">Recorded By *</label>
                         <input type="text" placeholder="Your Name" 
                            className="w-full bg-[#121212] border border-[#B69142]/50 p-4 rounded-xl text-white focus:border-[#B69142] outline-none"
                            value={newExp.recorded_by} onChange={e => setNewExp({...newExp, recorded_by: e.target.value})} 
                         />
                    </div>
                </div>

                <button onClick={addExpense} className="w-full bg-[#B69142] hover:bg-[#cbb37a] text-black font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 mt-2">
                    REGISTER EXPENSE 💸
                </button>
            </div>
        </div>

        {/* 3. Expenses Table */}
        <div className="lg:col-span-2 bg-[#1E1E1E] rounded-[2rem] border border-[#333] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[#333] bg-[#252525] flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <i className="fas fa-list-ul text-gray-500"></i> Expenses Log ({timeRange})
                </h3>
                <span className="bg-[#121212] px-3 py-1 rounded-full text-xs text-gray-400 border border-[#333]">{expensesList.length} Records</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1a1a1a] text-gray-500 text-xs uppercase sticky top-0 z-10">
                        <tr>
                            <th className="p-4 rounded-l-xl">Description</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">By</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4 rounded-r-xl text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {expensesList.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center p-10 text-gray-600">
                                    No expenses recorded for this period.
                                </td>
                            </tr>
                        ) : (
                            expensesList.map(e => (
                                <tr key={e.id} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors group">
                                    <td className="p-4 font-bold text-gray-200">{e.description}</td>
                                    <td className="p-4">
                                        <span className="bg-[#333] px-2 py-1 rounded text-[10px] text-gray-300 border border-[#444] uppercase">{e.category}</span>
                                    </td>
                                    <td className="p-4 text-[#B69142] font-bold text-xs">{e.recorded_by}</td>
                                    <td className="p-4 text-red-400 font-mono font-bold">-{e.amount} LE</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => deleteExpense(e.id)} className="w-8 h-8 rounded-full bg-[#1a1a1a] text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}