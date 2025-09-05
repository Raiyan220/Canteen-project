import { useEffect, useState } from "react";
import { api } from "../api/api";
import MenuGrid from "../components/MenuGrid";
import Cart from "../components/Cart";
import OrderTracker from "../components/OrderTracker";

export default function Home() {
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("CART") || "[]")
  );
  const [customerName, setCustomerName] = useState(
    localStorage.getItem("CUSTOMER_NAME") || "Guest"
  );
  const [orderId, setOrderId] = useState(
    localStorage.getItem("LAST_ORDER_ID") || ""
  );

  useEffect(() => {
    localStorage.setItem("CART", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("CUSTOMER_NAME", customerName);
  }, [customerName]);

  const addToCart = (item) => {
    // Enhanced stock validation
    if (item.stock === 0 || item.isOutOfStock) {
      alert(`❌ ${item.name} is out of stock!\n\nThis item cannot be added to your cart. Please choose another item.`);
      return;
    }

    // Check if adding would exceed available stock
    const existingInCart = cart.find((p) => p._id === item._id);
    const currentCartQty = existingInCart ? existingInCart.qty : 0;
    
    if (item.stock !== -1 && currentCartQty >= item.stock) {
      alert(`⚠️ Cannot add more ${item.name}!\n\nYou already have ${currentCartQty} in your cart, which is the maximum available stock.`);
      return;
    }

    // Add to cart with stock awareness
    setCart((prev) => {
      const existing = prev.find((p) => p._id === item._id);
      if (existing) {
        const newQty = existing.qty + 1;
        // Double check against stock limit
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

    // Show success message
    const remainingStock = item.stock === -1 ? 'unlimited' : item.stock - (currentCartQty + 1);
    if (remainingStock !== 'unlimited' && remainingStock <= 5) {
      alert(`✅ ${item.name} added to cart!\n\n⚠️ Only ${remainingStock} left in stock.`);
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

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
        items: cart.map((it) => ({
          menuItemId: it._id,
          qty: it.qty
        })),
      };

      const res = await api.post("/api/orders", payload);
      setOrderId(res.data._id);
      localStorage.setItem("LAST_ORDER_ID", res.data._id);
      setCart([]);
      
      alert(`🎉 Order placed successfully!\n\nOrder ID: #${res.data._id.slice(-6)}\nEstimated time: ${res.data.estimatedReadyAt ? new Date(res.data.estimatedReadyAt).toLocaleTimeString() : 'TBD'}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to place order";
      if (errorMsg.includes('stock')) {
        alert(`❌ Stock Error!\n\n${errorMsg}\n\nPlease refresh the page and adjust your cart.`);
      } else {
        alert(`❌ Order Failed!\n\n${errorMsg}`);
      }
    }
  };

  const handleCancelOrder = (cancelledOrderId) => {
    if (cancelledOrderId === orderId) setOrderId("");
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
                <div className="text-sm text-gray-500">Welcome back,</div>
                <div className="font-medium text-gray-900">{customerName}</div>
              </div>
              {customerName === "Guest" && (
                <button
                  onClick={() => {
                    const name = prompt("Please enter your name:");
                    if (name) setCustomerName(name);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Set Name
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
