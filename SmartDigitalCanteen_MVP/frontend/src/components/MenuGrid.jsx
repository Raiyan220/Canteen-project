import { useEffect, useState } from "react";
import { api } from "../api/api";
import MenuItemCard from "./MenuItemCard";
import { motion, AnimatePresence } from "framer-motion";

export default function MenuGrid({ onAdd }) {
  const [items, setItems] = useState([]);
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
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (specials) params.specials = true;

    api.get("/api/menu", { params }).then((res) => setItems(res.data));
  }, [search, category, specials]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="border border-gray-300 rounded-xl px-4 py-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Categories</option>
          <option>Breakfast</option>
          <option>Lunch</option>
          <option>Drinks</option>
          <option>Snacks</option>
        </select>
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={specials}
            onChange={(e) => setSpecials(e.target.checked)}
            className="accent-blue-500"
          />
          Daily specials
        </label>
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-xl mb-3 text-gray-800">
            Favorites
          </h2>
          <AnimatePresence>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {favorites.map((item) => (
                <MenuItemCard
                  key={"fav-" + item._id}
                  item={item}
                  isFavorite
                  toggleFavorite={toggleFavorite}
                  onAdd={onAdd}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Menu Items */}
      <AnimatePresence>
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {items.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              isFavorite={!!favorites.find((f) => f._id === item._id)}
              toggleFavorite={toggleFavorite}
              onAdd={onAdd}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
