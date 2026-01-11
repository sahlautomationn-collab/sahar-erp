'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import { logger } from '../lib/logger';
import { validators, sanitizers } from '../lib/utils';

export default function Finance() {
  // --- States ---
  const [timeRange, setTimeRange] = useState('daily');
  const [analyticsTab, setAnalyticsTab] = useState('overview'); // overview, products, customers, trends

  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    cogs: 0,
    netProfit: 0,
    ordersCount: 0,
    avgOrderValue: 0,
    profitMargin: 0
  });

  const [topProducts, setTopProducts] = useState([]);
  const [salesByHour, setSalesByHour] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [expensesList, setExpensesList] = useState([]);
  const [comparison, setComparison] = useState({ period: 0, percentage: 0 });

  const [loading, setLoading] = useState(true);

  // Expenses Form State
  const [newExp, setNewExp] = useState({
    amount: '',
    description: '',
    category: 'Bills',
    recorded_by: ''
  });

  // لما نغير الوقت أو التاب، نحمل البيانات تاني
  useEffect(() => {
    loadFinance();
  }, [timeRange, analyticsTab]);

  // دالة لحساب تاريخ البداية بناءً على الفلتر
  const getStartDate = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (timeRange === 'weekly') {
        // آخر 7 أيام
        date.setDate(date.getDate() - 7);
    } else if (timeRange === 'monthly') {
        // بداية الشهر الحالي
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
    }
    // daily = اليوم الحالي من الساعة 00:00

    // استخدام local time مع timezone offset
    // مصر GMT+2 فبنطرح 2 ساعة عشان نوافق UTC
    const offset = 2; // Egypt timezone (GMT+2)
    date.setHours(date.getHours() - offset);

    return date.toISOString();
  };

  async function loadFinance() {
    setLoading(true);
    const startDateISO = getStartDate();

    console.log('📊 Finance Query Start Date:', startDateISO);
    console.log('📊 Current Analytics Tab:', analyticsTab);

    try {
      // 1. حساب المبيعات
      const { data: orders, error: ordersError } = await supabase.from('orders')
        .select('order_id, total_amount, payment_method, created_at')
        .gte('created_at', startDateISO);

      // Log للخطأ لو موجود
      if (ordersError) {
        logger.error('Error fetching orders', ordersError);
        console.error('❌ Supabase Orders Error:', ordersError);
      }

      console.log('✅ Orders fetched:', orders?.length || 0, 'orders');

      const income = orders ? orders.reduce((sum, o) => sum + o.total_amount, 0) : 0;
      const ordersCount = orders ? orders.length : 0;
      const avgOrderValue = ordersCount > 0 ? income / ordersCount : 0;

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

      // 3. حساب المصروفات
      const { data: expenses } = await supabase.from('expenses')
        .select('*')
        .gte('created_at', startDateISO)
        .order('created_at', { ascending: false });

      const expenseTotal = expenses ? expenses.reduce((sum, e) => sum + e.amount, 0) : 0;

      // 4. الحساب النهائي
      const netProfit = income - (expenseTotal + cogsTotal);
      const profitMargin = income > 0 ? ((netProfit / income) * 100).toFixed(1) : 0;

      setStats({
        income,
        expenses: expenseTotal,
        cogs: cogsTotal,
        netProfit,
        ordersCount,
        avgOrderValue: avgOrderValue.toFixed(1),
        profitMargin
      });
      setExpensesList(expenses || []);

      // 5. تحميل Analytics إضافية - تأكد أن orders ليس undefined
      if (analyticsTab !== 'overview' && orders && Array.isArray(orders)) {
        await loadAdvancedAnalytics(orders, startDateISO);
      } else if (analyticsTab !== 'overview') {
        // إذا لم يوجد بيانات، قم بتهيئة المصفوفات الفارغة
        setTopProducts([]);
        setSalesByHour(Array.from({ length: 12 }, (_, i) => ({ hour: i + 9, sales: 0, orders: 0 })));
        setPaymentMethods([]);
      }

      // 6. حساب المقارنة مع الفترة السابقة
      await loadComparison(startDateISO, netProfit);

    } catch (error) {
      logger.error('Error loading finance data', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }

  async function loadAdvancedAnalytics(orders, _startDateISO) {
    console.log('🔍 loadAdvancedAnalytics called with:', {
      orders: orders?.length || 0,
      tab: analyticsTab,
      ordersData: orders
    });

    // تأكد من وجود بيانات صالحة
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      console.log('⚠️ No orders data, initializing empty arrays');
      setTopProducts([]);
      setSalesByHour(Array.from({ length: 12 }, (_, i) => ({ hour: i + 9, sales: 0, orders: 0 })));
      setPaymentMethods([]);
      return;
    }

    // Top Products
    if (analyticsTab === 'products') {
      const orderIds = orders.map(o => o.order_id);
      const { data: items } = await supabase
        .from('order_items')
        .select('menu_item_id, quantity, price_at_time, menu(menu_id, name_en, name_ar)')
        .in('order_id', orderIds);

      if (items) {
        const productMap = {};
        items.forEach(item => {
          const name = item.menu?.name_en || item.menu?.name_ar || `Item ${item.menu_item_id}`;
          if (!productMap[name]) {
            productMap[name] = { name, quantity: 0, revenue: 0 };
          }
          productMap[name].quantity += item.quantity;
          productMap[name].revenue += item.quantity * item.price_at_time;
        });

        const sorted = Object.values(productMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
        setTopProducts(sorted);
      }
    }

    // Sales by Hour
    if (analyticsTab === 'trends') {
      console.log('📈 Loading sales by hour...');

      const hourlyData = Array.from({ length: 12 }, (_, i) => ({
        hour: i + 9,
        sales: 0,
        orders: 0
      }));

      if (orders && Array.isArray(orders) && orders.length > 0) {
        orders.forEach(order => {
          const hour = new Date(order.created_at).getHours();
          if (hour >= 9 && hour <= 22) {
            const idx = hour - 9;
            if (hourlyData[idx]) {
              hourlyData[idx].sales += order.total_amount || 0;
              hourlyData[idx].orders += 1;
            }
          }
        });
      }

      console.log('✅ Hourly data:', hourlyData);
      setSalesByHour(hourlyData);
    }

    // Payment Methods Distribution
    const methodCounts = {};
    if (orders && Array.isArray(orders)) {
      orders.forEach(order => {
        const method = order.payment_method || 'Unknown';
        if (!methodCounts[method]) {
          methodCounts[method] = { count: 0, amount: 0 };
        }
        methodCounts[method].count += 1;
        methodCounts[method].amount += order.total_amount || 0;
      });
    }

    const methodsData = Object.entries(methodCounts).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
      percentage: stats.income > 0 ? ((data.amount / stats.income) * 100).toFixed(1) : 0
    }));

    setPaymentMethods(methodsData);
  }

  async function loadComparison(currentStartDate, currentProfit) {
    // حساب الفترة السابقة للمقارنة
    const currentStart = new Date(currentStartDate);
    const duration = new Date() - currentStart;
    const prevStart = new Date(currentStart.getTime() - duration);
    const prevEnd = currentStart;

    const { data: prevOrders } = await supabase.from('orders')
      .select('total_amount')
      .eq('is_paid', true)
      .gte('created_at', prevStart.toISOString())
      .lt('created_at', prevEnd.toISOString());

    const prevIncome = prevOrders ? prevOrders.reduce((sum, o) => sum + o.total_amount, 0) : 0;

    const periodDiff = currentProfit - prevIncome;
    const percentage = prevIncome > 0 ? ((periodDiff / prevIncome) * 100).toFixed(1) : 0;

    setComparison({ period: periodDiff, percentage });
  }

  async function addExpense() {
    if (!validators.isRequired(newExp.amount)) {
      toast.warning("Amount is required");
      return;
    }

    if (!validators.isPositive(newExp.amount)) {
      toast.error("Amount must be a positive number");
      return;
    }

    if (!validators.isRequired(newExp.description)) {
      toast.warning("Description is required");
      return;
    }

    if (!validators.isRequired(newExp.recorded_by)) {
      toast.warning("Recorded by is required");
      return;
    }

    const sanitizedData = {
      amount: sanitizers.sanitizeNumber(newExp.amount),
      description: sanitizers.sanitizeString(newExp.description),
      category: newExp.category,
      recorded_by: sanitizers.sanitizeString(newExp.recorded_by),
      created_at: new Date()
    };

    const { error } = await supabase.from('expenses').insert([sanitizedData]);

    if (!error) {
      toast.success("Expense recorded successfully");
      loadFinance();
      setNewExp({ ...newExp, amount: '', description: '' });
    } else {
      logger.error("Error adding expense", error);
      toast.error("Error adding expense");
    }
  }

  async function deleteExpense(id) {
    toast.confirm("Are you sure you want to delete this expense?", async () => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (!error) {
        toast.success("Deleted successfully");
        loadFinance();
      } else {
        logger.error("Error deleting expense", error);
        toast.error("Error deleting expense");
      }
    });
  }

  // حسابات إضافية
  const grossProfit = useMemo(() => stats.income - stats.cogs, [stats.income, stats.cogs]);
  const grossMargin = useMemo(() => {
    return stats.income > 0 ? ((grossProfit / stats.income) * 100).toFixed(1) : 0;
  }, [grossProfit, stats.income]);

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center text-[#B69142]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B69142] mx-auto mb-4"></div>
          <p className="text-lg">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] gap-4 text-gray-100 font-sans p-2 overflow-y-auto custom-scrollbar">

      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-2 gap-4">
         <div className="flex items-center gap-3">
            <i className="fas fa-chart-line text-[#B69142] text-2xl"></i>
            <h1 className="text-2xl font-bold">Financial Analytics & BI</h1>
         </div>

         <div className="flex gap-2">
            {/* Analytics Tabs */}
            <div className="bg-[#121212] p-1 rounded-xl border border-[#333] flex gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
                { id: 'products', label: 'Products', icon: 'fa-box' },
                { id: 'trends', label: 'Trends', icon: 'fa-chart-line' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAnalyticsTab(tab.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2
                  ${analyticsTab === tab.id
                    ? 'bg-[#B69142] text-black shadow-lg'
                    : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'}`}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Time Range Filter */}
            <div className="bg-[#121212] p-1 rounded-xl border border-[#333] flex gap-1">
              {['daily', 'weekly', 'monthly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all
                  ${timeRange === range
                    ? 'bg-[#B69142] text-black shadow-lg'
                    : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'}`}
                >
                  {range}
                </button>
              ))}
            </div>
         </div>
      </div>

      {/* Overview Tab */}
      {analyticsTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">

            {/* Sales */}
            <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#333] shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-cash-register text-4xl text-green-500"></i>
              </div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Revenue</p>
              <h3 className="text-xl font-black text-white mt-1">{stats.income.toLocaleString()} <span className="text-xs text-[#B69142]">LE</span></h3>
              {comparison.percentage !== 0 && (
                <p className={`text-[10px] font-bold ${parseFloat(comparison.percentage) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseFloat(comparison.percentage) >= 0 ? '↑' : '↓'} {Math.abs(comparison.percentage)}% vs last period
                </p>
              )}
            </div>

            {/* Orders */}
            <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#333] shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-shopping-cart text-4xl text-blue-500"></i>
              </div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Orders</p>
              <h3 className="text-xl font-black text-white mt-1">{stats.ordersCount}</h3>
            </div>

            {/* Avg Order */}
            <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#333] shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-receipt text-4xl text-purple-500"></i>
              </div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Avg Order</p>
              <h3 className="text-xl font-black text-white mt-1">{stats.avgOrderValue} <span className="text-xs text-[#B69142]">LE</span></h3>
            </div>

            {/* COGS */}
            <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#333] shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-boxes text-4xl text-orange-500"></i>
              </div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">COGS</p>
              <h3 className="text-xl font-black text-orange-500 mt-1">-{stats.cogs.toLocaleString()} <span className="text-xs text-gray-400">LE</span></h3>
            </div>

            {/* Expenses */}
            <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#333] shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-file-invoice-dollar text-4xl text-red-500"></i>
              </div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Expenses</p>
              <h3 className="text-xl font-black text-red-500 mt-1">-{stats.expenses.toLocaleString()} <span className="text-xs text-gray-400">LE</span></h3>
            </div>

            {/* Net Profit */}
            <div className="bg-gradient-to-br from-[#B69142] to-[#8a6d32] p-4 rounded-2xl shadow-xl shadow-[#B69142]/20 relative overflow-hidden text-black">
              <div className="absolute right-0 top-0 p-2 opacity-10">
                <i className="fas fa-coins text-4xl text-black"></i>
              </div>
              <p className="text-black/70 text-[10px] font-black uppercase tracking-wider">Net Profit</p>
              <h3 className="text-xl font-black mt-1">{stats.netProfit.toLocaleString()} <span className="text-xs">LE</span></h3>
              <p className="text-black/60 text-[10px] font-bold">{stats.profitMargin}% margin</p>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Gross Profit */}
            <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[#333]">
              <h4 className="text-gray-400 text-sm font-bold mb-3">Gross Profit</h4>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-green-500">{grossProfit.toLocaleString()} LE</span>
                <span className="text-sm text-gray-500 mb-1">{grossMargin}% margin</span>
              </div>
              <div className="mt-3 h-2 bg-[#121212] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                  style={{ width: `${Math.min(grossMargin, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[#333]">
              <h4 className="text-gray-400 text-sm font-bold mb-3">Payment Methods</h4>
              <div className="space-y-2">
                {paymentMethods.length > 0 ? paymentMethods.map(method => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className={`fas ${
                        method.method === 'Cash' ? 'fa-wallet text-green-500' :
                        method.method === 'Vodafone' ? 'fa-mobile-alt text-red-500' :
                        'fa-credit-card text-blue-500'
                      }`}></i>
                      <span className="text-sm text-gray-300">{method.method}</span>
                    </div>
                    <span className="text-sm font-bold">{method.percentage}%</span>
                  </div>
                )) : (
                  <p className="text-gray-600 text-xs">No payment data available</p>
                )}
              </div>
            </div>

            {/* Profit Breakdown */}
            <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[#333]">
              <h4 className="text-gray-400 text-sm font-bold mb-3">Profit Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Revenue</span>
                  <span className="text-sm font-bold text-green-500">{stats.income.toLocaleString()} LE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">- COGS</span>
                  <span className="text-sm font-bold text-orange-500">-{stats.cogs.toLocaleString()} LE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">- Expenses</span>
                  <span className="text-sm font-bold text-red-500">-{stats.expenses.toLocaleString()} LE</span>
                </div>
                <div className="border-t border-[#333] pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-[#B69142]">Net Profit</span>
                  <span className="text-lg font-black text-white">{stats.netProfit.toLocaleString()} LE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Table & Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Add Expense Form */}
            <div className="lg:col-span-1 bg-[#1E1E1E] p-5 rounded-2xl border border-[#333] shadow-2xl h-fit">
              <h3 className="text-[#B69142] font-bold text-sm mb-4 flex items-center gap-2">
                <i className="fas fa-plus-circle"></i> Add Expense
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-[#121212] border border-[#333] p-3 pl-3 rounded-xl text-white focus:border-[#B69142] outline-none font-mono"
                      value={newExp.amount}
                      onChange={e => setNewExp({...newExp, amount: e.target.value})}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">LE</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Electricity, Supplies..."
                    className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white focus:border-[#B69142] outline-none text-sm"
                    value={newExp.description}
                    onChange={e => setNewExp({...newExp, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Category</label>
                    <select
                      className="w-full bg-[#121212] border border-[#333] p-3 rounded-xl text-white focus:border-[#B69142] outline-none appearance-none text-xs"
                      value={newExp.category}
                      onChange={e => setNewExp({...newExp, category: e.target.value})}>
                      <option>Bills</option>
                      <option>Salaries</option>
                      <option>Maintenance</option>
                      <option>Restocking</option>
                      <option>Marketing</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#B69142] uppercase font-bold ml-1">Recorded By</label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full bg-[#121212] border border-[#B69142]/50 p-3 rounded-xl text-white focus:border-[#B69142] outline-none text-sm"
                      value={newExp.recorded_by}
                      onChange={e => setNewExp({...newExp, recorded_by: e.target.value})}
                    />
                  </div>
                </div>

                <button
                  onClick={addExpense}
                  className="w-full bg-[#B69142] hover:bg-[#cbb37a] text-black font-black py-3 rounded-xl transition-all shadow-lg active:scale-95 text-xs font-bold mt-2"
                >
                  REGISTER EXPENSE
                </button>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="lg:col-span-2 bg-[#1E1E1E] rounded-2xl border border-[#333] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#333] bg-[#252525] flex justify-between items-center">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <i className="fas fa-list-ul text-gray-500"></i> Expenses ({timeRange})
                </h3>
                <span className="bg-[#121212] px-2 py-1 rounded-full text-[10px] text-gray-400 border border-[#333]">
                  {expensesList.length} records
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[300px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#1a1a1a] text-gray-500 text-[10px] uppercase sticky top-0 z-10">
                    <tr>
                      <th className="p-3 rounded-l-xl">Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">By</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 rounded-r-xl text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {expensesList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center p-8 text-gray-600">
                          No expenses recorded for this period.
                        </td>
                      </tr>
                    ) : (
                      expensesList.map(e => (
                        <tr key={e.id} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors group">
                          <td className="p-3 font-bold text-gray-200">{e.description}</td>
                          <td className="p-3">
                            <span className="bg-[#333] px-2 py-1 rounded text-[10px] text-gray-300 border border-[#444] uppercase">
                              {e.category}
                            </span>
                          </td>
                          <td className="p-3 text-[#B69142] font-bold text-[10px]">{e.recorded_by}</td>
                          <td className="p-3 text-red-400 font-mono font-bold">-{e.amount} LE</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => deleteExpense(e.id)}
                              className="w-6 h-6 rounded-full bg-[#1a1a1a] text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <i className="fas fa-trash text-[10px]"></i>
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
        </>
      )}

      {/* Products Tab */}
      {analyticsTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Products */}
          <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[#333]">
            <h3 className="text-[#B69142] font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-trophy"></i> Top 10 Products by Revenue
            </h3>
            <div className="space-y-2">
              {topProducts.length > 0 ? topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#252525] rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                      ${i === 0 ? 'bg-yellow-500 text-black' :
                        i === 1 ? 'bg-gray-400 text-black' :
                        i === 2 ? 'bg-orange-600 text-black' :
                        'bg-[#333] text-gray-500'}`}>
                      {i + 1}
                    </span>
                    <span className="font-bold text-gray-200 text-sm">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[#B69142] font-black text-sm">{product.revenue.toLocaleString()} LE</p>
                    <p className="text-gray-500 text-[10px]">{product.quantity} sold</p>
                  </div>
                </div>
              )) : (
                <p className="text-gray-600 text-center py-8">No product data available</p>
              )}
            </div>
          </div>

          {/* Product Performance */}
          <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[#333]">
            <h3 className="text-[#B69142] font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-chart-bar"></i> Performance Metrics
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-[#252525] rounded-xl">
                <p className="text-gray-400 text-xs mb-1">Total Revenue</p>
                <p className="text-xl font-black text-white">{stats.income.toLocaleString()} LE</p>
              </div>
              <div className="p-3 bg-[#252525] rounded-xl">
                <p className="text-gray-400 text-xs mb-1">Cost of Goods Sold</p>
                <p className="text-xl font-black text-orange-500">{stats.cogs.toLocaleString()} LE</p>
              </div>
              <div className="p-3 bg-[#252525] rounded-xl">
                <p className="text-gray-400 text-xs mb-1">Gross Profit</p>
                <p className="text-xl font-black text-green-500">{grossProfit.toLocaleString()} LE</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {analyticsTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sales by Hour */}
          <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[#333]">
            <h3 className="text-[#B69142] font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-clock"></i> Sales by Hour
            </h3>
            <div className="space-y-2">
              {salesByHour.map((hour, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 w-12">{hour.hour}:00</span>
                  <div className="flex-1 h-6 bg-[#121212] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#B69142] to-[#8a6d32] transition-all"
                      style={{ width: `${Math.min((hour.sales / Math.max(...salesByHour.map(h => h.sales))) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-white w-20 text-right">
                    {hour.sales > 0 ? hour.sales.toLocaleString() : '-'} LE
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours Analysis */}
          <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-[#333]">
            <h3 className="text-[#B69142] font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-fire"></i> Peak Hours
            </h3>
            <div className="space-y-3">
              {salesByHour
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5)
                .map((hour, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-[#252525] rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                        ${i === 0 ? 'bg-yellow-500 text-black' :
                          i === 1 ? 'bg-gray-400 text-black' :
                          i === 2 ? 'bg-orange-600 text-black' :
                          'bg-[#333] text-gray-500'}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-300">{hour.hour}:00</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[#B69142] font-black text-sm">{hour.sales.toLocaleString()} LE</p>
                      <p className="text-gray-500 text-[10px]">{hour.orders} orders</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
