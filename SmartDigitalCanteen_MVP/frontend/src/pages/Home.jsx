import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import MenuGrid from "../components/MenuGrid";
import Cart from "../components/Cart";
import OrderTracker from "../components/OrderTracker";
import guestManager from "../utils/GuestManager";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("CART") || "[]")
  );
  const [customerName, setCustomerName] = useState(() => {
    if (isAuthenticated && user) return user.username;
    return localStorage.getItem("CUSTOMER_NAME") || "Guest";
  });
  const [orderId, setOrderId] = useState(
    localStorage.getItem("LAST_ORDER_ID") || ""
  );

  // Guest upgrade prompt state
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);

  useEffect(() => {
    localStorage.setItem("CART", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("CUSTOMER_NAME", customerName);
      guestManager.updatePreferences({ customerName });
    }
  }, [customerName, isAuthenticated]);

  // Show upgrade hint for frequent guests
  useEffect(() => {
    if (!isAuthenticated) {
      const orderHistory = JSON.parse(localStorage.getItem('ORDER_HISTORY') || '[]');
      const favorites = JSON.parse(localStorage.getItem('FAVORITES') || '[]');
      
      if (orderHistory.length >= 2 || favorites.length >= 3) {
        setTimeout(() => setShowUpgradeHint(true), 5000);
      }
    }
  }, [isAuthenticated]);

  // Enhanced addToCart with stock validation
  const addToCart = (item) => {
    if (item.stock === 0 || item.isOutOfStock) {
      alert(`❌ ${item.name} is out of stock!\n\nThis item cannot be added to your cart. Please choose another item.`);
      return;
    }

    const existingInCart = cart.find((p) => p._id === item._id);
    const currentCartQty = existingInCart ? existingInCart.qty : 0;
    
    if (item.stock !== -1 && currentCartQty >= item.stock) {
      alert(`⚠️ Cannot add more ${item.name}!\n\nYou already have ${currentCartQty} in your cart, which is the maximum available stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((p) => p._id === item._id);
      if (existing) {
        const newQty = existing.qty + 1;
        if (item.stock !== -1 && newQty > item.stock) {
          alert(`⚠️ Stock limit reached!\n\nOnly ${item.stock} ${item.name} available in stock.`);
          return prev;
        }
        return prev.map((p) =>
          p._id === item._id ? { ...p, qty: newQty } : p
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });

    // Success feedback with stock warning
    const remainingStock = item.stock === -1 ? 'unlimited' : item.stock - (currentCartQty + 1);
    if (remainingStock !== 'unlimited' && remainingStock <= 5) {
      alert(`✅ ${item.name} added to cart!\n\n⚠️ Only ${remainingStock} left in stock.`);
    }
  };

  // Enhanced order placement
  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      // Validate stock before placing order
      for (const cartItem of cart) {
        if (cartItem.stock === 0 || cartItem.isOutOfStock) {
          alert(`❌ Order cannot be placed!\n\n${cartItem.name} is out of stock. Please remove it from your cart.`);
          return;
        }
        if (cartItem.stock !== -1 && cartItem.qty > cartItem.stock) {
          alert(`❌ Order cannot be placed!\n\n${cartItem.name}: You have ${cartItem.qty} in cart but only ${cartItem.stock} available in stock.`);
          return;
        }
      }

      const payload = {
        customerName,
        items: cart.map((item) => ({
          menuItemId: item._id,
          qty: item.qty,
        })),
        // Include user ID if authenticated
        ...(isAuthenticated && user && { userId: user.id })
      };

      const response = await api.post("/api/orders", payload);
      const newOrderId = response.data._id;
      const orderTotal = response.data.total;
      
      setOrderId(newOrderId);
      localStorage.setItem("LAST_ORDER_ID", newOrderId);
      setCart([]);
      
      // Track order for guest users
      if (!isAuthenticated) {
        guestManager.trackOrder(newOrderId, orderTotal);
        
        // Collect email for notifications (non-intrusive)
        setTimeout(() => {
          guestManager.collectEmailForNotifications(newOrderId);
        }, 1000);
      }
      
      alert(`🎉 Order placed successfully!\n\nOrder ID: #${newOrderId.slice(-6)}\nEstimated time: ${response.data.estimatedReadyAt ? new Date(response.data.estimatedReadyAt).toLocaleTimeString() : 'TBD'}`);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to place order";
      if (errorMsg.includes('stock')) {
        alert(`❌ Stock Error!\n\n${errorMsg}\n\nPlease refresh the page and adjust your cart.`);
      } else {
        alert(`❌ Order Failed!\n\n${errorMsg}`);
      }
    }
  };

  const handleCancelOrder = (cancelledOrderId) => {
    if (cancelledOrderId === orderId) {
      setOrderId("");
      localStorage.removeItem("LAST_ORDER_ID");
    }
  };

  // Handle name update for guests
  const handleSetName = () => {
    const name = prompt("Please enter your name:");
    if (name && name.trim()) {
      setCustomerName(name.trim());
    }
  };

  // Handle account creation prompt
  const handleCreateAccount = () => {
    guestManager.showUpgradeModal();
    setShowUpgradeHint(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍽️ Smart Digital Canteen</h1>
              <p className="text-gray-600 text-sm">Fresh food, delivered fast</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {isAuthenticated ? 'Welcome back,' : 'Welcome,'}
                </div>
                <div className="font-medium text-gray-900 flex items-center">
                  {customerName}
                  {!isAuthenticated && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                      Guest
                    </span>
                  )}
                </div>
              </div>
              
              {!isAuthenticated && (
                <div className="flex space-x-2">
                  {customerName === "Guest" && (
                    <button
                      onClick={handleSetName}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Set Name
                    </button>
                  )}
                  <button
                    onClick={handleCreateAccount}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Hint Banner for Guests */}
      {showUpgradeHint && !isAuthenticated && (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                🎉 You're a frequent customer! Create an account to save your favorites and get faster checkout.
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCreateAccount}
                className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
              >
                Create Account
              </button>
              <button
                onClick={() => setShowUpgradeHint(false)}
                className="text-white hover:text-gray-200 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <MenuGrid onAdd={addToCart} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cart */}
            <Cart 
              items={cart} 
              setItems={setCart} 
              onPlaceOrder={placeOrder} 
            />

            {/* Order Tracker */}
            {orderId && (
              <OrderTracker 
                orderId={orderId} 
                onCancel={handleCancelOrder}
              />
            )}

            {/* Guest Benefits Card */}
            {!isAuthenticated && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                <h3 className="font-medium text-gray-900 mb-2">🎁 Create Account Benefits</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Save favorites across devices</li>
                  <li>• Faster checkout process</li>
                  <li>• Order history & tracking</li>
                  <li>• Exclusive member discounts</li>
                </ul>
                <button
                  onClick={handleCreateAccount}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
                >
                  Create Free Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
