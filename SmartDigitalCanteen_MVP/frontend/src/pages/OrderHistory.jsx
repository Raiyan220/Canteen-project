import { useEffect, useState } from 'react'
import { api } from '../api/api'

function Star({ filled, onClick }) {
  return <button className={"text-xl " + (filled ? "text-yellow-500" : "text-gray-300")} onClick={onClick}>★</button>
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [customerName] = useState(localStorage.getItem('CUSTOMER_NAME') || 'Guest')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    if (!customerName) return
    api.get('/api/orders', { params: { customerName } }).then(res => setOrders(res.data))
  }, [customerName])

  const reorder = (order) => {
    const cartItems = order.items.map(i => ({
      _id: i.menuItemId,
      name: i.name,
      price: i.price,
      qty: i.qty
    }));
    localStorage.setItem('CART', JSON.stringify(cartItems))
    window.location.href = '/'
  }

  const cancel = (order) => {
    api.patch(`/api/orders/${order._id}/cancel`).then(() => {
      api.get('/api/orders', { params: { customerName } }).then(res => setOrders(res.data))
    })
  }

  const submitFeedback = () => {
    const fb = JSON.parse(localStorage.getItem('FEEDBACKS') || '[]')
    fb.push({ orderId: selectedOrder?._id, rating, comment, createdAt: new Date().toISOString() })
    localStorage.setItem('FEEDBACKS', JSON.stringify(fb))
    setRating(0); setComment(''); setSelectedOrder(null)
    alert('Thanks for your feedback!')
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h2 className="font-semibold mb-3">Your Orders</h2>
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o._id} className="border rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">#{o._id.slice(-6)} • {o.status}</div>
                <div className="text-sm text-gray-600">{new Date(o.createdAt).toLocaleString()}</div>
                <div className="text-sm">{o.items.map(i => i.name + '×' + i.qty).join(', ')}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => reorder(o)} className="px-3 py-1 border rounded-lg">Reorder</button>
                {o.status === 'Pending' && <button onClick={() => cancel(o)} className="px-3 py-1 border rounded-lg">Cancel</button>}
                <button onClick={() => setSelectedOrder(o)} className="px-3 py-1 border rounded-lg">Rate</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="mt-4 border rounded-xl p-3">
          <h3 className="font-semibold mb-2">Rate Order #{selectedOrder._id.slice(-6)}</h3>
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map(n => <Star key={n} filled={n <= rating} onClick={() => setRating(n)} />)}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full border rounded-xl px-3 py-2" placeholder="Comments (optional)" />
          <div className="mt-2">
            <button onClick={submitFeedback} className="px-3 py-2 bg-blue-600 text-white rounded-xl">Submit</button>
          </div>
        </div>
      )}
    </div>
  )
}
