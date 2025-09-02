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
    setCart((prev) => {
      const existing = prev.find((p) => p._id === item._id);
      if (existing)
        return prev.map((p) =>
          p._id === item._id ? { ...p, qty: p.qty + 1 } : p
        );
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const payload = {
        customerName,
        items: cart.map((it) => ({ menuItemId: it._id, qty: it.qty })),
      };
      const res = await api.post("/api/orders", payload);
      setOrderId(res.data._id);
      localStorage.setItem("LAST_ORDER_ID", res.data._id);
      setCart([]);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to place order");
    }
  };

  // Handle cancel action from OrderTracker
  const handleCancelOrder = (cancelledOrderId) => {
    if (cancelledOrderId === orderId) setOrderId(""); // Reset UI if current order is cancelled
  };

  return (
    <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left/Main Section */}
      <div className="md:col-span-2 flex flex-col gap-6">
        {/* Customer Name Input */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <label className="text-sm text-gray-600 block mb-2 font-medium">
            Your name (for order tracking)
          </label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your name"
            className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Menu Grid */}
        <MenuGrid onAdd={addToCart} />

        {/* Order Tracker */}
        {orderId && (
          <div className="mt-6">
            <OrderTracker orderId={orderId} onCancel={handleCancelOrder} />
          </div>
        )}
      </div>

      {/* Right/Cart Section */}
      <div className="sticky top-6">
        <Cart items={cart} setItems={setCart} onPlaceOrder={placeOrder} />
      </div>
    </div>
  );
}
