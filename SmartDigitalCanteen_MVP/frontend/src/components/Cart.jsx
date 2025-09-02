import { motion, AnimatePresence } from "framer-motion";

export default function Cart({ items, setItems, onPlaceOrder }) {
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const updateQty = (id, delta) => {
    setItems(prev => prev.map(it => it._id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
  };
  const remove = (id) => setItems(prev => prev.filter(it => it._id !== id));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
      <h2 className="font-semibold text-xl mb-4 text-gray-800">Your Cart</h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {items.map(it => (
              <motion.div 
                key={it._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 shadow-sm"
              >
                <div>
                  <div className="font-medium text-gray-700">{it.name}</div>
                  <div className="text-sm text-gray-500">৳ {it.price} × {it.qty}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateQty(it._id, -1)} 
                    className="px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                  >
                    -
                  </button>
                  <span className="w-5 text-center">{it.qty}</span>
                  <button 
                    onClick={() => updateQty(it._id, +1)} 
                    className="px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => remove(it._id)} 
                    className="px-2 py-1 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Total + Place Order */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="font-bold text-lg text-gray-800">Total: ৳ {total}</div>
            <button 
              onClick={onPlaceOrder} 
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium shadow-md transition"
            >
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
