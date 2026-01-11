'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import { logger } from '../lib/logger';

export default function WebOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, preparing, ready, delivered
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchWebOrders();
    // Real-time subscription
    const subscription = supabase
      .channel('web-orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: 'order_type=eq.website'
      }, () => {
        fetchWebOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchWebOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'website')
      .eq('is_paid', false) // Only show unpaid orders
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching web orders', error);
      toast.error('Failed to load web orders');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  async function confirmPayment(orderId) {
    const { error } = await supabase
      .from('orders')
      .update({
        is_paid: true,
        status: 'New'
      })
      .eq('order_id', orderId);

    if (error) {
      logger.error('Error confirming payment', error);
      toast.error('Failed to confirm payment');
      return;
    }

    toast.success('Payment confirmed! Order sent to kitchen');
    fetchWebOrders();
  }

  async function cancelOrder(orderId) {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'Cancelled',
        is_paid: true // Mark as paid so it disappears from Website Orders
      })
      .eq('order_id', orderId);

    if (error) {
      logger.error('Error cancelling order', error);
      toast.error('Failed to cancel order');
      return;
    }

    toast.success('Order cancelled successfully');
    fetchWebOrders();
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.phone?.includes(search) ||
      order.order_id?.toString().includes(search);

    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && !order.is_paid) ||
      order.status === filter;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (order) => {
    if (!order.is_paid) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-red-900/30 text-red-400 border-red-900 animate-pulse">
          Pending Payment
        </span>
      );
    }

    const statusColors = {
      'New': 'bg-yellow-900/30 text-yellow-400 border-yellow-900 animate-pulse',
      'Preparing': 'bg-blue-900/30 text-blue-400 border-blue-900',
      'Ready': 'bg-green-900/30 text-green-400 border-green-900',
      'Delivered': 'bg-gray-700/30 text-gray-400 border-gray-700',
      'Cancelled': 'bg-red-900/30 text-red-400 border-red-900'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
        statusColors[order.status] || 'bg-gray-700/30 text-gray-400 border-gray-700'
      }`}>
        {order.status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] gap-4 text-gray-100 font-sans p-2 overflow-hidden">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <i className="fas fa-globe text-[#B69142] text-2xl"></i>
          <h1 className="text-2xl font-bold text-white">Website Orders</h1>
          <span className="bg-[#B69142] text-black text-xs font-bold px-2 py-1 rounded-full">
            {orders.filter(o => !o.is_paid).length} Pending
          </span>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="text"
              placeholder="Search ID, Name, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121212] border border-[#333] py-2 pl-10 pr-4 rounded-xl text-sm focus:border-[#B69142] outline-none"
            />
          </div>
          <button onClick={fetchWebOrders} className="bg-[#1a1a1a] border border-[#333] hover:border-[#B69142] text-white px-4 py-2 rounded-xl transition-all active:scale-95">
            <i className="fas fa-sync-alt text-[#B69142]"></i>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-[#121212] p-1 rounded-xl border border-[#333]">
        {['all', 'pending', 'New', 'Preparing', 'Ready', 'Delivered'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === status
                ? 'bg-[#B69142] text-black shadow'
                : 'text-gray-500 hover:text-white hover:bg-[#222]'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <i className="fas fa-circle-notch fa-spin text-3xl mb-3 text-[#B69142]"></i>
            <p>Loading Website Orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
            <i className="fas fa-inbox text-6xl mb-4"></i>
            <p className="text-xl font-bold">No Website Orders</p>
            <p className="text-sm">No orders from the website found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
              <div
                key={order.order_id}
                className={`relative bg-[#1E1E1E] rounded-2xl border p-5 transition-all ${
                  !order.is_paid
                    ? 'border-red-900/50 shadow-red-900/20'
                    : 'border-[#333] hover:border-[#B69142]'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#333] text-white font-mono text-xs px-2 py-1 rounded border border-[#444]">
                        #{order.order_id}
                      </span>
                      {getStatusBadge(order)}
                    </div>
                    <h3 className="font-bold text-white text-lg">{order.customer_name}</h3>
                    <p className="text-gray-500 text-xs font-mono">{order.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#B69142]">
                      {order.total_amount}
                    </p>
                    <p className="text-[10px] text-gray-500">LE</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-[#121212] p-3 rounded-xl mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className={`fas text-lg ${
                        order.payment_method === 'Cash' ? 'fa-money-bill text-green-500' :
                        order.payment_method === 'Vodafone' ? 'fa-mobile-alt text-red-500' :
                        'fa-credit-card text-blue-500'
                      }`}></i>
                      <span className="text-sm font-bold">{order.payment_method}</span>
                    </div>
                    {order.payment_method !== 'Cash' && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">Payment Status</p>
                        <p className={`text-xs font-bold ${
                          order.is_paid ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {order.is_paid ? '✓ Confirmed' : '⏳ Pending'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Proof Image */}
                  {order.payment_receipt_url && (
                    <div className="mt-3">
                      <button
                        onClick={() => setSelectedImage(order.payment_receipt_url)}
                        className="w-full flex items-center justify-center gap-2 bg-[#252525] hover:bg-[#333] py-2 rounded-lg transition-colors"
                      >
                        <i className="fas fa-image text-[#B69142]"></i>
                        <span className="text-xs font-bold">View Payment Proof</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="bg-[#121212] p-3 rounded-xl mb-4">
                  <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Order Items</p>
                  <p className="text-xs text-gray-300 line-clamp-2">{order.order_summary}</p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {!order.is_paid ? (
                    <>
                      <button
                        onClick={() => confirmPayment(order.order_id)}
                        className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-check-circle"></i>
                        <span>
                          {order.payment_method === 'Cash' ? 'Confirm Cash Payment' : 'Confirm Payment & Start'}
                        </span>
                      </button>
                      <button
                        onClick={() => cancelOrder(order.order_id)}
                        className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-times-circle"></i>
                        <span>Cancel Order</span>
                      </button>
                    </>
                  ) : null}
                </div>

                {/* Time */}
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-gray-600">
                    {new Date(order.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {!order.is_paid && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-[#B69142] text-4xl"
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Payment Proof"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
