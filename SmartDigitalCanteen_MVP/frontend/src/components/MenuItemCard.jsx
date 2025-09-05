import { motion } from "framer-motion";

export default function MenuItemCard({ item, onAdd, isFavorite, toggleFavorite }) {
  const handleAddToCart = () => {
    // Check if item is out of stock
    if (item.stock === 0 || item.isOutOfStock) {
      alert(`Sorry! ${item.name} is currently out of stock and cannot be added to cart.`);
      return;
    }
    onAdd(item);
  };

  // Determine stock status
  const getStockStatus = () => {
    if (item.stock === -1) return { text: "Unlimited", color: "text-green-600", bg: "bg-green-50" };
    if (item.stock === 0 || item.isOutOfStock) return { text: "Out of Stock", color: "text-red-600", bg: "bg-red-50" };
    if (item.stock <= 5) return { text: `Only ${item.stock} left`, color: "text-orange-600", bg: "bg-orange-50" };
    return { text: `${item.stock} in stock`, color: "text-green-600", bg: "bg-green-50" };
  };

  const stockStatus = getStockStatus();
  const isOutOfStock = item.stock === 0 || item.isOutOfStock;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group ${
        isOutOfStock ? 'opacity-75' : ''
      }`}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gray-100 flex items-center justify-center">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              isOutOfStock ? 'grayscale' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className={`text-4xl ${isOutOfStock ? 'grayscale' : 'text-gray-400'}`}>🍽️</div>
        )}
        
        {/* Special Badge */}
        {item.isSpecial && !isOutOfStock && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
            Daily Special
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={() => toggleFavorite(item)}
          className="absolute top-2 right-2 p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-all duration-200 shadow-sm"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            className={`w-5 h-5 transition-colors duration-200 ${
              isFavorite ? "text-red-500 fill-current" : "text-gray-400"
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
            {item.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 min-h-10">
            {item.description || "Delicious and fresh"}
          </p>
        </div>

        {/* Stock Status Badge */}
        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
          📦 {stockStatus.text}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={`text-xl font-bold ${isOutOfStock ? 'text-gray-400' : 'text-blue-600'}`}>
              ৳{item.price}
            </p>
            {item.prepTimeMinutes && (
              <p className="text-xs text-gray-500">
                ~{item.prepTimeMinutes} min
              </p>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              isOutOfStock
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
            }`}
            aria-label={`Add ${item.name} to cart`}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>

        {/* Low Stock Warning for Available Items */}
        {!isOutOfStock && item.stock > 0 && item.stock <= 5 && item.stock !== -1 && (
          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
            ⚠️ Only {item.stock} left in stock!
          </div>
        )}
      </div>
    </motion.div>
  );
}
