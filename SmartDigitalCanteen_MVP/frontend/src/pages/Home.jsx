import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import { useUX } from "../contexts/UXContext";
import { guestManager } from "../utils/GuestManager";
import Navbar from "../components/Navbar";
import MenuGrid from "../components/MenuGrid";
import Cart from "../components/Cart";
import OrderTracker from "../components/OrderTracker";

const CART_KEY = "canteen_cart_v2";
const ACTIVE_ORDER_KEY = "canteen_active_order_id";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { notify, setUpgradeModalOpen } = useUX();
  const location = useLocation();
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [guestName, setGuestName] = useState(() => guestManager.getDisplayName());
  const [favoriteIds, setFavoriteIds] = useState(() => guestManager.getFavorites());
  const [pickupSlot, setPickupSlot] = useState("ASAP");
  const [notes, setNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const [activeOrder, setActiveOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const fetchMenu = useCallback(async () => {
    setLoadingMenu(true);
    setMenuError("");
    try {
      const { data } = await api.get("/api/menu");
      setMenu(Array.isArray(data) ? data : []);
    } catch (err) {
      setMenuError(err.response?.data?.error || "Unable to reach kitchen menu right now.");
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    if (!isAuthenticated) {
      guestManager.initializeGuest().then((info) => {
        if (info?.preferences?.favoriteItems) {
          setFavoriteIds(info.preferences.favoriteItems);
        }
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // Handle reorder state passed from OrderHistory
  useEffect(() => {
    const reorderItems = location.state?.reorderItems;
    if (!reorderItems?.length || !menu.length) return;

    const menuById = new Map(menu.map((m) => [m._id, m]));
    const nextCart = [];
    let skipped = 0;

    reorderItems.forEach((entry) => {
      const dish = menuById.get(entry.menuItemId) || menu.find((m) => m.name === entry.name);
      const stockVal = Number(dish?.stock ?? -1);
      const isOut = !dish || dish.isOutOfStock || (stockVal >= 0 && stockVal === 0);
      if (isOut) {
        skipped += 1;
        return;
      }
      const allowedQty = stockVal < 0 ? Number(entry.qty || 1) : Math.min(Number(entry.qty || 1), stockVal);
      nextCart.push({
        menuItemId: dish._id,
        name: dish.name,
        price: Number(dish.price),
        prepTimeMinutes: dish.prepTimeMinutes || 5,
        stock: dish.stock,
        qty: allowedQty,
      });
    });

    if (nextCart.length > 0) {
      setCart(nextCart);
      setDrawerOpen(true);
      notify("Previous order loaded into tray", {
        type: "success",
        description:
          skipped > 0
            ? `${skipped} sold-out item(s) were skipped.`
            : "Review pickup window and place when ready.",
      });
    } else {
      notify("Items currently sold out", {
        type: "warning",
        description: "None of the dishes from that order are currently in stock.",
      });
    }

    navigate("/", { replace: true, state: {} });
  }, [location.state, menu, navigate, notify]);

  // Restore & poll active order
  useEffect(() => {
    const savedId = localStorage.getItem(ACTIVE_ORDER_KEY);
    if (!savedId) return;

    let cancelled = false;
    const pollOrder = async () => {
      try {
        const { data } = await api.get(`/api/orders/${savedId}`);
        if (cancelled) return;
        setActiveOrder(data);
        if (data.status === "Collected" || data.status === "Cancelled") {
          localStorage.removeItem(ACTIVE_ORDER_KEY);
        }
      } catch {
        // Silent retry unless missing
      }
    };

    pollOrder();
    const timer = setInterval(pollOrder, 8000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeOrder?._id, activeOrder?.status]);

  const cartMap = useMemo(() => {
    const map = {};
    cart.forEach((entry) => {
      map[entry.menuItemId] = entry;
    });
    return map;
  }, [cart]);

  const totalTrayCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  const totalTrayAmount = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0),
    [cart]
  );

  const specialsCount = useMemo(
    () =>
      menu.filter(
        (m) => m.isSpecial && !m.isOutOfStock && Number(m.stock ?? -1) !== 0
      ).length,
    [menu]
  );

  const availableCount = useMemo(
    () =>
      menu.filter((m) => !m.isOutOfStock && Number(m.stock ?? -1) !== 0).length,
    [menu]
  );

  const handleAdd = useCallback(
    (item) => {
      setCart((prev) => {
        const existing = prev.find((c) => c.menuItemId === item._id);
        const stockVal = Number(item.stock ?? -1);
        const maxStock = stockVal < 0 ? 99 : stockVal;
        if (existing) {
          if (existing.qty >= maxStock) return prev;
          return prev.map((c) =>
            c.menuItemId === item._id ? { ...c, qty: c.qty + 1 } : c
          );
        }
        return [
          ...prev,
          {
            menuItemId: item._id,
            name: item.name,
            price: Number(item.price),
            prepTimeMinutes: item.prepTimeMinutes || 5,
            stock: item.stock,
            qty: 1,
          },
        ];
      });
      notify(`Added ${item.name}`, { type: "success", duration: 2200 });
    },
    [notify]
  );

  const handleInc = useCallback(
    (menuItemId) => {
      const dish = menu.find((m) => m._id === menuItemId);
      const stockVal = Number(dish?.stock ?? -1);
      const maxStock = stockVal < 0 ? 99 : stockVal;
      setCart((prev) =>
        prev.map((c) => {
          if (c.menuItemId !== menuItemId) return c;
          if (c.qty >= maxStock) {
            notify(`Max available stock reached (${maxStock})`, { type: "warning" });
            return c;
          }
          return { ...c, qty: c.qty + 1 };
        })
      );
    },
    [menu, notify]
  );

  const handleDec = useCallback((menuItemId) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItemId === menuItemId ? { ...c, qty: c.qty - 1 } : c))
        .filter((c) => c.qty > 0)
    );
  }, []);

  const handleRemove = useCallback((menuItemId) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
    notify("Tray cleared", { type: "info" });
  }, [notify]);

  const handleToggleFavorite = useCallback(
    async (item) => {
      const { added, favorites } = await guestManager.toggleFavorite(item._id);
      setFavoriteIds([...favorites]);
      notify(added ? `Saved ${item.name}` : `Removed ${item.name}`, {
        type: "info",
        description: added ? "Filter by Favorites anytime." : "",
        duration: 2400,
      });
    },
    [notify]
  );

  const handleGuestNameChange = useCallback((name) => {
    setGuestName(name);
    guestManager.setDisplayName(name);
  }, []);

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    const resolvedName = isAuthenticated
      ? user?.username || user?.email
      : guestName.trim();

    if (!resolvedName) {
      notify("Enter your pickup name", {
        type: "warning",
        description: "So kitchen staff knows who to call when ready.",
      });
      setDrawerOpen(true);
      return;
    }

    setPlacingOrder(true);
    try {
      const payload = {
        customerName: resolvedName,
        items: cart.map((c) => ({ menuItemId: c.menuItemId, qty: c.qty })),
        pickupSlot,
        notes: notes.trim(),
      };
      const { data } = await api.post("/api/orders", payload);
      setActiveOrder(data);
      localStorage.setItem(ACTIVE_ORDER_KEY, data._id);
      setCart([]);
      setNotes("");
      setDrawerOpen(false);
      fetchMenu();

      if (!isAuthenticated) {
        await guestManager.trackOrder(data);
        if (guestManager.shouldPromptUpgrade()) {
          setTimeout(() => setUpgradeModalOpen(true), 900);
        }
      }

      notify("Order sent to kitchen!", {
        type: "success",
        description: `Pickup window: ${data.pickupSlot || "ASAP"}`,
      });
    } catch (err) {
      notify("Order failed", {
        type: "error",
        description: err.response?.data?.error || "Could not place order. Please try again.",
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCancelActiveOrder = async (orderId) => {
    setCancellingOrder(true);
    try {
      const { data } = await api.patch(`/api/orders/${orderId}/cancel`);
      setActiveOrder(data);
      localStorage.removeItem(ACTIVE_ORDER_KEY);
      fetchMenu();
      notify("Order cancelled", {
        type: "info",
        description: "Items have been returned to kitchen stock.",
      });
    } catch (err) {
      notify("Could not cancel order", {
        type: "error",
        description: err.response?.data?.error || "Order may already be preparing.",
      });
    } finally {
      setCancellingOrder(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <Navbar
        cartCount={totalTrayCount}
        onCartClick={() => setDrawerOpen(true)}
        activeOrderStatus={
          activeOrder &&
          !["Collected", "Cancelled"].includes(activeOrder.status)
            ? activeOrder.status
            : null
        }
      />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Crimson Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-crimson-700 via-crimson-800 to-crimson-950 p-6 sm:p-9 text-white shadow-crimson">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-crimson-500/25 blur-3xl"
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Campus Kitchen Live</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Skip the lunch queue. Order fresh, pick up warm.
              </h1>
              <p className="text-sm sm:text-base text-crimson-100/90 leading-relaxed">
                Browse live stock, pick your counter pickup window, and follow every kitchen step
                from prep to pickup.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#menu-heading"
                  className="rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-crimson-800 shadow-sm hover:bg-crimson-50 transition"
                >
                  Explore Menu
                </a>
                {specialsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("Specials");
                      document.getElementById("menu-heading")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                  >
                    Chef Specials ({specialsCount})
                  </button>
                )}
                <Link
                  to="/history"
                  className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold text-crimson-100 hover:bg-white/10 transition"
                >
                  My Orders →
                </Link>
              </div>
            </div>

            {/* Live Quick Telemetry */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:w-80 shrink-0">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                <p className="font-mono text-2xl font-extrabold tabular-nums">{availableCount}</p>
                <p className="text-[11px] font-medium text-crimson-100">Dishes Ready</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                <p className="font-mono text-2xl font-extrabold tabular-nums">{specialsCount}</p>
                <p className="text-[11px] font-medium text-crimson-100">Specials</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                <p className="font-mono text-2xl font-extrabold tabular-nums">~8m</p>
                <p className="text-[11px] font-medium text-crimson-100">Avg Prep</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Order Tracker */}
        {activeOrder && (
          <OrderTracker
            order={activeOrder}
            onCancel={handleCancelActiveOrder}
            cancelling={cancellingOrder}
          />
        )}

        {/* Main Workspace: Menu + Sticky Desktop Tray */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 items-start">
          <div className="xl:col-span-8">
            <MenuGrid
              items={menu}
              loading={loadingMenu}
              error={menuError}
              onRetry={fetchMenu}
              search={search}
              onSearchChange={setSearch}
              category={category}
              onCategoryChange={setCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              cartMap={cartMap}
              onAdd={handleAdd}
              onInc={handleInc}
              onDec={handleDec}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>

          {/* Sticky Right-Rail Cart on XL Desktop */}
          <aside
            aria-label="Order tray summary"
            className="hidden xl:block xl:col-span-4 xl:sticky xl:top-24 max-h-[calc(100vh-7.5rem)]"
          >
            <Cart
              items={cart}
              onInc={handleInc}
              onDec={handleDec}
              onRemove={handleRemove}
              onClear={handleClearCart}
              onPlaceOrder={handlePlaceOrder}
              placing={placingOrder}
              customerName={guestName}
              onCustomerNameChange={handleGuestNameChange}
              isAuthenticated={isAuthenticated}
              pickupSlot={pickupSlot}
              onPickupSlotChange={setPickupSlot}
              notes={notes}
              onNotesChange={setNotes}
            />
          </aside>
        </div>
      </main>

      {/* Mobile / Tablet Sticky Tray Bar */}
      {totalTrayCount > 0 && !drawerOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-30 xl:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="mx-auto flex w-full max-w-lg items-center justify-between rounded-2xl bg-crimson-600 px-5 py-3.5 text-white shadow-crimson hover:bg-crimson-700 transition"
          >
            <span className="flex items-center gap-2.5 text-sm font-bold">
              <span className="rounded-lg bg-white/20 px-2 py-0.5 font-mono text-xs tabular-nums">
                {totalTrayCount}
              </span>
              Review &amp; Place Order
            </span>
            <span className="font-mono text-base font-extrabold tabular-nums">
              ৳{totalTrayAmount.toFixed(0)}
            </span>
          </button>
        </div>
      )}

      {/* Slide-over Tray Drawer (mobile + triggered from Navbar Tray button) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Tray drawer"
        >
          <div className="h-full w-full max-w-md p-3 sm:p-4">
            <Cart
              items={cart}
              onInc={handleInc}
              onDec={handleDec}
              onRemove={handleRemove}
              onClear={handleClearCart}
              onPlaceOrder={handlePlaceOrder}
              placing={placingOrder}
              customerName={guestName}
              onCustomerNameChange={handleGuestNameChange}
              isAuthenticated={isAuthenticated}
              pickupSlot={pickupSlot}
              onPickupSlotChange={setPickupSlot}
              notes={notes}
              onNotesChange={setNotes}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-line bg-surface-card py-6">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 text-xs text-ink-muted">
          <p className="font-semibold text-ink-secondary">
            CrimsonBite — Smart Digital Campus Canteen
          </p>
          <nav aria-label="Footer navigation" className="flex items-center gap-4">
            <Link to="/" className="hover:text-crimson-600">
              Menu
            </Link>
            <Link to="/history" className="hover:text-crimson-600">
              Order History
            </Link>
            <Link to="/admin" className="hover:text-crimson-600">
              Kitchen &amp; Admin
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
