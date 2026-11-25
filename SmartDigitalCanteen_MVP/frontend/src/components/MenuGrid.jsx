import React, { useEffect, useMemo, useRef } from "react";
import MenuItemCard from "./MenuItemCard";

export default function MenuGrid({
  items = [],
  loading = false,
  error = "",
  onRetry,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sortBy,
  onSortChange,
  cartMap = {},
  onAdd,
  onInc,
  onDec,
  favoriteIds = [],
  onToggleFavorite,
}) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        if (search) {
          onSearchChange("");
        } else {
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [search, onSearchChange]);

  const categories = useMemo(() => {
    const dynamic = Array.from(
      new Set(items.map((i) => i.category).filter(Boolean))
    );
    return ["All", "Specials", "Favorites", ...dynamic];
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = items.filter((item) => {
      if (category === "Specials" && !item.isSpecial) return false;
      if (category === "Favorites" && !favoriteIds.includes(item._id)) return false;
      if (
        category !== "All" &&
        category !== "Specials" &&
        category !== "Favorites" &&
        item.category !== category
      ) {
        return false;
      }

      if (query) {
        const hay = `${item.name} ${item.description || ""} ${item.category || ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    list = [...list];
    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "prep-asc") {
      list.sort((a, b) => Number(a.prepTimeMinutes || 5) - Number(b.prepTimeMinutes || 5));
    } else {
      // Recommended: specials and in-stock items first
      list.sort((a, b) => {
        const aOut = a.isOutOfStock || Number(a.stock ?? -1) === 0 ? 1 : 0;
        const bOut = b.isOutOfStock || Number(b.stock ?? -1) === 0 ? 1 : 0;
        if (aOut !== bOut) return aOut - bOut;
        return Number(b.isSpecial ? 1 : 0) - Number(a.isSpecial ? 1 : 0);
      });
    }
    return list;
  }, [items, search, category, sortBy, favoriteIds]);

  const resetFilters = () => {
    onSearchChange("");
    onCategoryChange("All");
    onSortChange("recommended");
  };

  return (
    <section aria-labelledby="menu-heading" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="menu-heading" className="text-2xl font-extrabold tracking-tight text-ink-primary">
            Today&apos;s Menu
          </h2>
          <p className="text-sm text-ink-muted">
            Freshly cooked campus favorites. Press{" "}
            <kbd className="rounded border border-line-strong bg-surface-card px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink-primary">
              /
            </kbd>{" "}
            to search.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
          <div className="relative flex-1 sm:w-64">
            <label htmlFor="menu-search" className="sr-only">
              Search menu items
            </label>
            <input
              ref={searchInputRef}
              id="menu-search"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search burgers, tea, fries..."
              className="w-full rounded-xl border border-line bg-surface-card pl-3.5 pr-14 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-crimson-600 focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-xs font-bold text-ink-muted hover:text-crimson-600"
              >
                ✕
              </button>
            ) : (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-surface-base px-1.5 py-0.5 font-mono text-[11px] text-ink-muted"
              >
                /
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="menu-sort" className="sr-only">
              Sort menu items
            </label>
            <select
              id="menu-sort"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="rounded-xl border border-line bg-surface-card px-3 py-2.5 text-xs font-semibold text-ink-primary focus:border-crimson-600 focus:outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="prep-asc">Fastest Prep</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div
        role="tablist"
        aria-label="Menu categories"
        className="flex flex-wrap items-center gap-2"
      >
        {categories.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onCategoryChange(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-crimson-600 text-white shadow-crimson"
                  : "border border-line bg-surface-card text-ink-secondary hover:border-crimson-500/50 hover:text-crimson-600"
              }`}
            >
              {cat}
              {cat === "Favorites" && favoriteIds.length > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 font-mono text-[10px]">
                  {favoriteIds.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* States: Error / Loading / Empty / Grid */}
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-crimson-500/40 bg-surface-card p-6 text-center"
        >
          <p className="text-sm font-bold text-crimson-600">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-xl bg-crimson-600 px-4 py-2 text-xs font-bold text-white hover:bg-crimson-700"
            >
              Retry Loading Menu
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="overflow-hidden rounded-2xl border border-line bg-surface-card p-4 animate-pulse"
            >
              <div className="aspect-[16/10] w-full rounded-xl bg-surface-elevated" />
              <div className="mt-4 h-4 w-2/3 rounded bg-surface-elevated" />
              <div className="mt-2 h-3 w-full rounded bg-surface-elevated" />
              <div className="mt-4 h-9 w-full rounded-xl bg-surface-elevated" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface-card p-10 text-center">
          <p className="text-base font-bold text-ink-primary">No matching dishes found</p>
          <p className="mt-1 text-sm text-ink-muted">
            {category === "Favorites"
              ? "Tap the heart icon on any dish to save it to your favorites."
              : "Try clearing your search or switching back to all categories."}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-xl bg-crimson-600 px-4 py-2 text-xs font-bold text-white hover:bg-crimson-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              cartQty={cartMap[item._id]?.qty || 0}
              onAdd={onAdd}
              onInc={onInc}
              onDec={onDec}
              isFavorite={favoriteIds.includes(item._id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}
