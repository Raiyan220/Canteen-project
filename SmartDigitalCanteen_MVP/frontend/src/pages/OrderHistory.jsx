// frontend/src/pages/OrderHistory.jsx (UPDATED)
import { useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';

function Star({ filled, onClick }) {
  return (
    <button 
      className={"text-xl " + (filled ? "text-yellow-500" : "text-gray-300")} 
      onClick={onClick}
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

  const { user, isAuthenticated } = useAuth(); // Get auth context

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
          const response = await api.get('/api/orders', { 
            params: { customerName } 
          });
          setOrders(response.data);
        } else {
          setOrders([]); // No orders for guest without name
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
  }, [isAuthenticated, user]); // Re-fetch when auth status changes

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
      fetchOrders(); // Refresh the orders list
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
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Your Orders</h2>
        {isAuthenticated && (
          <span className="text-sm text-gray-600">
            Logged in as: {user?.username}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No orders found</p>
          {!isAuthenticated && (
            <p className="text-sm mt-2">
              Sign in to view your order history across devices
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o._id} className="border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">#{o._id.slice(-6)} • {o.status}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    {o.items.map(i => i.name + '×' + i.qty).join(', ')}
                  </div>
                  <div className="text-sm font-medium">Total: ৳{o.total}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={() => reorder(o)} 
                    className="px-3 py-1 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 text-sm"
                  >
                    Reorder
                  </button>
                  {o.status === 'Pending' && (
                    <button 
                      onClick={() => cancel(o)} 
                      className="px-3 py-1 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedOrder(o)} 
                    className="px-3 py-1 border border-green-500 text-green-500 rounded-lg hover:bg-green-50 text-sm"
                  >
                    Rate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="mt-4 border rounded-xl p-3 bg-gray-50">
          <h3 className="font-semibold mb-2">
            Rate Order #{selectedOrder._id.slice(-6)}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map(n => (
              <Star 
                key={n} 
                filled={n <= rating} 
                onClick={() => setRating(n)} 
              />
            ))}
          </div>
          <textarea 
            value={comment} 
            onChange={e => setComment(e.target.value)} 
            className="w-full border rounded-xl px-3 py-2 mb-2" 
            placeholder="Comments (optional)" 
            rows={3}
          />
          <div className="flex gap-2">
            <button 
              onClick={submitFeedback} 
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Submit
            </button>
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
