import { useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';

function Star({ filled, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-2xl transition-colors duration-200 hover:scale-110 transform ${
        filled ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'
      }`}
    >
      ★
    </button>
  );
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const { user, isAuthenticated } = useAuth();

  // PRESERVED: All existing functions
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (isAuthenticated) {
        const response = await api.get('/api/orders');
        setOrders(response.data);
      } else {
        const customerName = localStorage.getItem('CUSTOMER_NAME') || 'Guest';
        if (customerName && customerName !== 'Guest') {
          const response = await api.get('/api/orders', { 
            params: { customerName } 
          });
          setOrders(response.data);
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated, user]);

  const reorder = (order) => {
    const cartItems = order.items.map(i => ({
      _id: i.menuItemId,
      name: i.name,
      price: i.price,
      qty: i.qty
    }));
    localStorage.setItem('CART', JSON.stringify(cartItems));
    window.location.href = '/';
  };

  const cancel = async (order) => {
    try {
      const payload = isAuthenticated ? {} : { customerName: order.customerName };
      await api.patch(`/api/orders/${order._id}/cancel`, payload);
      fetchOrders();
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order: ' + (error.response?.data?.error || error.message));
    }
  };

  const submitFeedback = () => {
    const fb = JSON.parse(localStorage.getItem('FEEDBACKS') || '[]');
    fb.push({
      orderId: selectedOrder?._id,
      rating,
      comment,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('FEEDBACKS', JSON.stringify(fb));
    setRating(0);
    setComment('');
    setSelectedOrder(null);
    alert('Thanks for your feedback!');
  };

  // Filter orders based on status
  const filteredOrders = filterStatus 
    ? orders.filter(order => order.status === filterStatus)
    : orders;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Your Orders</h3>
          <p className="text-slate-600">Please wait while we fetch your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white text-2xl">🍽️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Smart Digital Canteen
                  </h1>
                  <p className="text-sm text-slate-500">Order History</p>
                </div>
              </a>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{user.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-slate-700 font-medium">{user.username}</span>
                </div>
              ) : (
                <div className="text-slate-600">
                  <span className="font-medium">Guest User</span>
                </div>
              )}
              
              <a
                href="/"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏠 Back to Home
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
          {/* Title & Filter Section */}
          <div className="px-6 py-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">🛍️ Your Order History</h2>
                <p className="text-slate-600">
                  {isAuthenticated 
                    ? `Track your orders and reorder favorites (${orders.length} total orders)` 
                    : !isAuthenticated && 'Sign in to view your order history across devices'
                  }
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-slate-700">Filter by status:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">All Orders</option>
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready">Ready</option>
                    <option value="Collected">Collected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                
                <button
                  onClick={fetchOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="divide-y divide-slate-200">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-6 text-slate-300">📋</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {filterStatus ? `No ${filterStatus.toLowerCase()} orders found` : 'No orders yet'}
                </h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
                  {!isAuthenticated && !localStorage.getItem('CUSTOMER_NAME') ? (
                    'Sign in to view your order history across all your devices, or set your name to track guest orders.'
                  ) : filterStatus ? (
                    `You don't have any orders with status "${filterStatus}". Try selecting a different filter.`
                  ) : (
                    'Your order history will appear here once you place your first order.'
                  )}
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="/"
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Start Ordering
                  </a>
                  {!isAuthenticated && (
                    <a
                      href="/register"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Create Account
                    </a>
                  )}
                </div>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-lg">#</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Order #{order._id.slice(-6)}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10h8V11M8 11a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2" />
                            </svg>
                            <span>{new Date(order.placedAt || order.createdAt).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{new Date(order.placedAt || order.createdAt).toLocaleTimeString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">৳{order.total}</div>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        order.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'Preparing'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'Ready'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'Collected'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Items Ordered:</h4>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="grid gap-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-slate-600 text-sm font-medium">{item.qty}</span>
                              </div>
                              <span className="text-slate-900 font-medium">{item.name}</span>
                            </div>
                            <span className="text-slate-700 font-semibold">৳{item.price * item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => reorder(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Reorder</span>
                      </button>
                      
                      {['Pending', 'Preparing'].includes(order.status) && (
                        <button
                          onClick={() => cancel(order)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancel</span>
                        </button>
                      )}
                      
                      {order.status === 'Collected' && (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <span>Rate Order</span>
                        </button>
                      )}
                    </div>

                    {/* Order Summary */}
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">Total Amount</div>
                      <div className="text-xl font-bold text-slate-900">৳{order.total}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Rate Your Experience
              </h3>
              <p className="text-slate-600">
                Order #{selectedOrder._id.slice(-6)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
                  How was your order?
                </label>
                <div className="flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      filled={star <= rating}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-slate-600 mt-2">
                    {rating === 1 && "Poor - We'll do better next time"}
                    {rating === 2 && "Fair - Room for improvement"}
                    {rating === 3 && "Good - Satisfied with the order"}
                    {rating === 4 && "Very Good - Great experience!"}
                    {rating === 5 && "Excellent - Outstanding!"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Share your feedback (optional):
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-colors"
                  rows="3"
                  placeholder="Tell us about your experience..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={submitFeedback}
                  disabled={rating === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold transition-colors"
                >
                  Submit Feedback
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setRating(0);
                    setComment('');
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-xl font-semibold transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
