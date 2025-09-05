import { useEffect, useState, useMemo } from "react";
import { api } from "../api/api";
import MenuItemCard from "./MenuItemCard";
import { motion, AnimatePresence } from "framer-motion";

export default function MenuGrid({ onAdd }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [specials, setSpecials] = useState(false);
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem("FAVORITES") || "[]")
  );

  const toggleFavorite = (item) => {
    const exists = favorites.find((f) => f._id === item._id);
    const next = exists
      ? favorites.filter((f) => f._id !== item._id)
      : [...favorites, item];
    setFavorites(next);
    localStorage.setItem("FAVORITES", JSON.stringify(next));
  };

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setLoading(true);
        const params = {};
        if (search) params.search = search;
        if (category) params.category = category;
        if (specials) params.specials = true;

        const response = await api.get("/api/menu", { params });
        setItems(response.data);
        setError("");
      } catch (err) {
        setError("Failed to load menu items");
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, [search, category, specials]);

  // Calculate stock information
  const stockInfo = useMemo(() => {
    const totalItems = items.length;
    const inStockItems = items.filter(item => item.stock === -1 || item.stock > 0).length;
    const outOfStockItems = items.filter(item => item.stock === 0).length;
    const totalStock = items.reduce((acc, item) => {
      if (item.stock === -1) return acc + 999; // Unlimited stock
      return acc + Math.max(0, item.stock);
    }, 0);
    
    return { totalItems, inStockItems, outOfStockItems, totalStock };
  }, [items]);

  const categories = ["Breakfast", "Lunch", "Drinks", "Snacks"];

  return (
    <div className="space-y-6">
      {/* Stock Information Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stockInfo.totalItems}</div>
              <div className="text-sm opacity-90">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-200">{stockInfo.inStockItems}</div>
              <div className="text-sm opacity-90">Available</div>
            </div>
            {stockInfo.outOfStockItems > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-200">{stockInfo.outOfStockItems}</div>
                <div className="text-sm opacity-90">Out of Stock</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-200">
                {stockInfo.totalStock === 999 * items.filter(i => i.stock === -1).length ? '∞' : stockInfo.totalStock}
              </div>
              <div className="text-sm opacity-90">Total Stock</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">📦 Inventory Status</div>
            <div className="text-sm opacity-90">Live stock information</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Specials Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={specials}
              onChange={(e) => setSpecials(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span>Daily Specials</span>
          </label>
        </div>

        {/* Active Filters Display */}
        {(search || category || specials) && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {search && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Search: "{search}"
              </span>
            )}
            {category && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {category}
              </span>
            )}
            {specials && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                Daily Specials
              </span>
            )}
            <button
              onClick={() => {
                setSearch("");
                setCategory("");
                setSpecials(false);
              }}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading menu...</span>
        </div>
      )}

      {/* Menu Grid */}
      <AnimatePresence>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          layout
        >
          {items.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              onAdd={onAdd}
              isFavorite={favorites.some((f) => f._id === item._id)}
              toggleFavorite={toggleFavorite}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No items found</h3>
          <p className="text-gray-500">
            {search || category || specials
              ? "Try adjusting your filters"
              : "Menu items will appear here"}
          </p>
        </div>
      )}

      {/* Results Count */}
      {!loading && items.length > 0 && (
        <div className="text-center text-gray-500 text-sm">
          Showing {items.length} item{items.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
