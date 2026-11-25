import { api } from "../api/api";

const KEYS = {
  guestId: "canteen_guest_id",
  guestName: "canteen_guest_name",
  preferences: "canteen_guest_preferences",
  orders: "canteen_guest_orders",
  upgradeDismissed: "canteen_upgrade_dismissed",
};

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateId() {
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

class GuestManager {
  constructor() {
    this.guestId = localStorage.getItem(KEYS.guestId) || null;
    this.displayName = localStorage.getItem(KEYS.guestName) || "";
    this.preferences = safeParse(localStorage.getItem(KEYS.preferences), {
      favoriteItems: [],
      dietaryNotes: "",
    });
    this.orders = safeParse(localStorage.getItem(KEYS.orders), []);
  }

  _persist() {
    if (this.guestId) {
      localStorage.setItem(KEYS.guestId, this.guestId);
    }
    if (this.displayName) {
      localStorage.setItem(KEYS.guestName, this.displayName);
    } else {
      localStorage.removeItem(KEYS.guestName);
    }
    localStorage.setItem(KEYS.preferences, JSON.stringify(this.preferences));
    localStorage.setItem(KEYS.orders, JSON.stringify(this.orders));
  }

  async initializeGuest() {
    if (!this.guestId) {
      this.guestId = generateId();
      this._persist();
    }
    try {
      const { data } = await api.post("/api/guest/create", {
        guestId: this.guestId,
        displayName: this.displayName || undefined,
      });
      if (data?.guestId) {
        this.guestId = data.guestId;
      }
      if (data?.preferences) {
        this.preferences = {
          favoriteItems: Array.isArray(data.preferences.favoriteItems)
            ? data.preferences.favoriteItems
            : this.preferences.favoriteItems || [],
          dietaryNotes: data.preferences.dietaryNotes ?? this.preferences.dietaryNotes ?? "",
        };
      }
      this._persist();
    } catch {
      // Offline/local fallback already persisted above
    }
    return this.getGuestInfo();
  }

  getDisplayName() {
    return this.displayName;
  }

  setDisplayName(name) {
    this.displayName = String(name || "").trim();
    this._persist();
    return this.displayName;
  }

  getPreferences() {
    return this.preferences;
  }

  getFavorites() {
    return this.preferences?.favoriteItems || [];
  }

  isFavorite(menuItemId) {
    return this.getFavorites().includes(menuItemId);
  }

  async updatePreferences(partial) {
    this.preferences = { ...this.preferences, ...partial };
    this._persist();
    if (this.guestId) {
      try {
        await api.put(`/api/guest/preferences/${this.guestId}`, {
          preferences: this.preferences,
        });
      } catch {
        // Non-blocking sync
      }
    }
    return this.preferences;
  }

  async toggleFavorite(menuItemId) {
    const current = new Set(this.getFavorites());
    const added = !current.has(menuItemId);
    if (added) {
      current.add(menuItemId);
    } else {
      current.delete(menuItemId);
    }
    await this.updatePreferences({ favoriteItems: Array.from(current) });
    return { added, favorites: this.getFavorites() };
  }

  async trackOrder(orderData) {
    if (!this.guestId) {
      this.guestId = generateId();
    }
    const summary = {
      orderId: orderData?._id || orderData?.id,
      totalAmount: orderData?.total ?? orderData?.totalAmount ?? 0,
      status: orderData?.status || "Pending",
      createdAt: orderData?.createdAt || new Date().toISOString(),
    };
    this.orders = [summary, ...this.orders.filter((o) => o.orderId !== summary.orderId)].slice(
      0,
      30
    );
    this._persist();

    try {
      await api.post("/api/guest/track-order", {
        guestId: this.guestId,
        orderId: summary.orderId,
        orderData: summary,
      });
    } catch {
      // Local tracking preserved
    }
    return this.orders;
  }

  getOrders() {
    return this.orders;
  }

  getOrderCount() {
    return this.orders.length;
  }

  shouldPromptUpgrade() {
    const dismissedAt = Number(localStorage.getItem(KEYS.upgradeDismissed) || 0);
    const coolDownPassed = Date.now() - dismissedAt > 1000 * 60 * 60 * 12;
    return this.orders.length >= 2 && coolDownPassed;
  }

  dismissUpgradePrompt() {
    localStorage.setItem(KEYS.upgradeDismissed, String(Date.now()));
  }

  async upgradeToRegisteredUser({ username, email, password }) {
    const { data } = await api.post("/api/guest/upgrade", {
      guestId: this.guestId,
      username,
      email,
      password,
    });
    if (data?.token) {
      localStorage.setItem("auth_token", data.token);
    }
    this.clearGuestData();
    return data;
  }

  clearGuestData() {
    this.guestId = null;
    this.displayName = "";
    this.preferences = { favoriteItems: [], dietaryNotes: "" };
    this.orders = [];
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }

  getGuestInfo() {
    return {
      guestId: this.guestId,
      displayName: this.displayName,
      preferences: this.preferences,
      orderCount: this.orders.length,
    };
  }
}

export const guestManager = new GuestManager();
export default guestManager;
