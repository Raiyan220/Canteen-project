// frontend/src/pages/OrderHistory.jsx (COMPLETE FILE)
import { useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';

function Star({ filled, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-2xl ${filled ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
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
  const { user, isAuthenticated } = useAuth();

  // Fetch orders based on authentication status
  const fetchOrders = async () => {
    try {
      setLoading(true);
      if (isAuthenticated) {
        // Fetch by authenticated user (userId will be used automatically)
        const response = await api.get('/api/orders');
        setOrders(response.data);
      } else {
        // Fetch by customerName for guest users
        const customerName = localStorage.getItem('CUSTOMER_NAME') || 'Guest';
        if (customerName && customerName !== 'Guest') {
          const response = await api.get('/api/orders', { params: { customerName } });
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
      await api.patch(`/api/orders/${order._id}/cancel`);
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

            {orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500 mb-4">
                  {!isAuthenticated && (
                    <span>Sign in to view your order history across devices</span>
                  )}
                </p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Start Ordering
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Order #{order._id.slice(-6)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.placedAt || order.createdAt).toLocaleDateString()} at{' '}
                          {new Date(order.placedAt || order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-900">৳{order.total}</p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'Preparing'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'Ready'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'Collected'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Items:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>{item.name} × {item.qty}</span>
                            <span>৳{item.price * item.qty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => reorder(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Reorder
                        </button>
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => cancel(order)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        )}
                        {order.status === 'Collected' && (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Rate Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feedback Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Rate Order #{selectedOrder._id.slice(-6)}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating:</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      filled={star <= rating}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments:</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Tell us about your experience..."
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={submitFeedback}
                  disabled={rating === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setRating(0);
                    setComment('');
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
