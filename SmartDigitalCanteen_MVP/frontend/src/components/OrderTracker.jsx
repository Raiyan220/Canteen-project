import { useEffect, useState } from "react";
import { api } from "../api/api";
import { motion } from "framer-motion";

const steps = ["Pending", "Preparing", "Ready", "Collected"];

export default function OrderTracker({ orderId }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = () => api.get(`/api/orders/${orderId}`).then(res => setOrder(res.data));
    fetchOrder();
    const id = setInterval(fetchOrder, 5000);
    return () => clearInterval(id);
  }, [orderId]);

  if (!order) return null;

  const currentStep = steps.indexOf(order.status);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 mt-4">
      {/* Order Info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-gray-800">Order #{order._id.slice(-6)}</div>
          <div className="text-sm text-gray-600">Status: {order.status}</div>
        </div>
        {order.estimatedReadyAt && (
          <div className="text-sm text-gray-700 font-medium">
            ETA: {new Date(order.estimatedReadyAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      {/* Progress Tracker */}
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const active = idx <= currentStep;
          return (
            <div key={step} className="flex-1 flex flex-col items-center relative">
              {/* Step Circle */}
              <motion.div
                layout
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
                  active ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                {idx + 1}
              </motion.div>
              {/* Step Label */}
              <span className="text-xs mt-1 text-gray-600">{step}</span>

              {/* Connector Bar */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-3 left-1/2 w-full h-1 -translate-x-1/2 z-0 ${
                    idx < currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                  style={{ width: "100%" }}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
