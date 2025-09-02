import { motion } from "framer-motion";

export default function MenuItemCard({ item, onAdd, isFavorite, toggleFavorite }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.03 }} 
      className="bg-white rounded-2xl shadow-lg p-4 flex flex-col transition-all duration-300"
    >
      <div className="relative">
        <img 
          src={item.imageUrl || '/images/placeholder.svg'} 
          alt={item.name} 
          className="w-full h-40 object-cover rounded-xl"
        />
        {item.isSpecial && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-xs font-semibold px-2 py-1 rounded-full shadow">
            Daily Special
          </span>
        )}
      </div>

      <div className="mt-4 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
          <button 
            onClick={() => toggleFavorite(item)} 
            title="Favorite" 
            className={`text-xl transition-colors duration-200 ${isFavorite ? "text-red-500" : "text-gray-300"} hover:text-red-500`}
          >
            ♥
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-bold text-blue-600 text-lg">৳ {item.price}</span>
        <button
          disabled={item.isOutOfStock}
          onClick={() => onAdd(item)}
          className={`px-4 py-2 rounded-xl text-white font-medium transition-all duration-200
            ${item.isOutOfStock ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"}
          `}
        >
          {item.isOutOfStock ? "Out of stock" : "Add"}
        </button>
      </div>
    </motion.div>
  )
}
