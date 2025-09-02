import { useState, useEffect } from "react";

export default function Cart({ items, setItems, onPlaceOrder }) {
  const [total, setTotal] = useState(0);

  // Calculate total whenever cart changes
  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + item.price * item.qty, 0);
    setTotal(sum);
  }, [items]);

  const increment = (id) => {
    setItems(
      items.map((i) => (i._id === id ? { ...i, qty: i.qty + 1 } : i))
    );
  };

  const decrement = (id) => {
    setItems(
      items.map((i) => (i._id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))
    );
  };

  const removeItem = (id) => {
    setItems(items.filter((i) => i._id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 w-full">
      <h2 className="font-semibold text-lg mb-4">Your Cart</h2>
      {items.length === 0 ? (
        <p className="text-gray-500">Cart is empty</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex justify-between items-center bg-gray-50 rounded-xl p-3"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-gray-500 text-sm">
                  ৳ {item.price} × {item.qty} = ৳ {item.price * item.qty}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => decrement(item._id)}
                  className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  -
                </button>
                <span>{item.qty}</span>
                <button
                  onClick={() => increment(item._id)}
                  className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item._id)}
                  className="px-2 py-1 text-red-500 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <hr className="my-2" />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>৳ {total}</span>
          </div>

          <button
            onClick={onPlaceOrder}
            disabled={items.length === 0}
            className={`mt-4 w-full font-semibold py-2 rounded-xl transition-all ${
              items.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}
