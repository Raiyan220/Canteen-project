import { api } from '../api/api';

class GuestManager {
  constructor() {
    this.guestId = this.getOrCreateGuestId();
    this.initializeGuest();
  }

  // Generate unique guest ID
  getOrCreateGuestId() {
    let guestId = localStorage.getItem('GUEST_ID');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('GUEST_ID', guestId);
    }
    return guestId;
  }

  // Initialize guest session with backend
  async initializeGuest() {
    try {
      const customerName = localStorage.getItem('CUSTOMER_NAME') || 'Guest';
      const response = await api.post('/api/guest/create', {
        guestId: this.guestId,
        customerName
      });
      
      if (response.data.guest.shouldShowUpgrade) {
        this.scheduleUpgradePrompt();
      }
    } catch (error) {
      console.error('Guest initialization failed:', error);
    }
  }

  // Get guest profile
  getGuestProfile() {
    return {
      guestId: this.guestId,
      customerName: localStorage.getItem('CUSTOMER_NAME') || 'Guest',
      email: localStorage.getItem('GUEST_EMAIL') || '',
      phone: localStorage.getItem('GUEST_PHONE') || '',
      favorites: JSON.parse(localStorage.getItem('FAVORITES') || '[]'),
      orderHistory: JSON.parse(localStorage.getItem('ORDER_HISTORY') || '[]'),
      cart: JSON.parse(localStorage.getItem('CART') || '[]')
    };
  }

  // Update guest preferences
  async updatePreferences(updates) {
    try {
      // Update local storage
      Object.keys(updates).forEach(key => {
        if (key === 'favorites') {
          localStorage.setItem('FAVORITES', JSON.stringify(updates[key]));
        } else if (key === 'customerName') {
          localStorage.setItem('CUSTOMER_NAME', updates[key]);
        } else if (key === 'email') {
          localStorage.setItem('GUEST_EMAIL', updates[key]);
        } else if (key === 'phone') {
          localStorage.setItem('GUEST_PHONE', updates[key]);
        }
      });

      // Sync with backend
      await api.put(`/api/guest/preferences/${this.guestId}`, updates);
    } catch (error) {
      console.error('Failed to update guest preferences:', error);
    }
  }

  // Track order completion
  async trackOrder(orderId, orderTotal) {
    try {
      // Update local order history
      const orderHistory = JSON.parse(localStorage.getItem('ORDER_HISTORY') || '[]');
      orderHistory.unshift({ orderId, orderTotal, date: new Date().toISOString() });
      localStorage.setItem('ORDER_HISTORY', JSON.stringify(orderHistory.slice(0, 10))); // Keep last 10

      // Track with backend
      await api.post('/api/guest/track-order', {
        guestId: this.guestId,
        orderId,
        orderTotal
      });

      // Check if upgrade prompt should show
      if (orderHistory.length >= 2) {
        this.scheduleUpgradePrompt();
      }
    } catch (error) {
      console.error('Failed to track guest order:', error);
    }
  }

  // Schedule upgrade prompt
  scheduleUpgradePrompt() {
    const lastPrompt = localStorage.getItem('LAST_UPGRADE_PROMPT');
    const now = Date.now();
    
    // Don't show more than once per day
    if (lastPrompt && now - parseInt(lastPrompt) < 24 * 60 * 60 * 1000) {
      return;
    }

    setTimeout(() => {
      this.showUpgradePrompt();
    }, 2000); // Show after 2 seconds
  }

  // Show upgrade prompt
  showUpgradePrompt() {
    const profile = this.getGuestProfile();
    
    // Don't show if dismissed recently
    const dismissed = localStorage.getItem('UPGRADE_PROMPT_DISMISSED');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const benefits = [
      '💾 Save your favorites across all devices',
      '⚡ Faster checkout on future orders',
      '🎁 Exclusive member discounts and offers',
      '📱 Track all your orders in one place',
      '🏆 Priority customer support'
    ];

    const shouldCreate = confirm(
      `🎉 Hey ${profile.customerName}!\n\n` +
      `You've placed ${profile.orderHistory.length} orders with us. ` +
      `Create an account to unlock these benefits:\n\n` +
      benefits.join('\n') + '\n\n' +
      'Create account now? (Your order history will be saved!)'
    );

    localStorage.setItem('LAST_UPGRADE_PROMPT', Date.now().toString());

    if (shouldCreate) {
      this.showUpgradeModal();
    } else {
      localStorage.setItem('UPGRADE_PROMPT_DISMISSED', Date.now().toString());
    }
  }

  // Show upgrade modal
  showUpgradeModal() {
    const profile = this.getGuestProfile();
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold mb-4 text-center">🎉 Create Your Account</h2>
        <p class="text-gray-600 mb-4 text-center">Keep your ${profile.orderHistory.length} orders and ${profile.favorites.length} favorites!</p>
        
        <form id="upgradeForm" class="space-y-4">
          <input 
            type="text" 
            placeholder="Username" 
            value="${profile.customerName}" 
            name="username"
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          >
          <input 
            type="email" 
            placeholder="Email address" 
            value="${profile.email}" 
            name="email"
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          >
          <input 
            type="password" 
            placeholder="Create password" 
            name="password"
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
            minlength="6"
          >
          
          <div class="flex space-x-2">
            <button 
              type="submit" 
              class="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              ✅ Create Account
            </button>
            <button 
              type="button" 
              onclick="this.closest('.fixed').remove()" 
              class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
            >
              Maybe Later
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    modal.querySelector('#upgradeForm').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      await this.upgradeToRegisteredUser({
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
      });
      modal.remove();
    };
  }

  // Upgrade to registered user
  async upgradeToRegisteredUser(userData) {
    try {
      const response = await api.post('/api/guest/upgrade', {
        guestId: this.guestId,
        ...userData
      });

      if (response.data.success) {
        // Store auth token
        localStorage.setItem('auth_token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

        // Clear guest data
        localStorage.removeItem('GUEST_ID');
        localStorage.removeItem('UPGRADE_PROMPT_DISMISSED');
        localStorage.removeItem('LAST_UPGRADE_PROMPT');

        alert(`🎉 Welcome ${userData.username}!\n\nYour account has been created successfully.\n${response.data.migratedOrders} previous orders have been saved to your account.`);

        // Reload page to update UI
        window.location.reload();
      }
    } catch (error) {
      alert('Failed to create account: ' + (error.response?.data?.error || error.message));
    }
  }

  // Collect email for order notifications
  async collectEmailForNotifications(orderId) {
    const currentEmail = localStorage.getItem('GUEST_EMAIL');
    if (currentEmail) return currentEmail;

    const email = prompt(
      '📧 Want order updates?\n\n' +
      'Enter your email to receive order status notifications and exclusive offers:'
    );

    if (email && email.includes('@')) {
      localStorage.setItem('GUEST_EMAIL', email);
      await this.updatePreferences({ email });
      
      // Send welcome email with account creation offer
      try {
        await api.post(`/api/guest/send-incentive/${this.guestId}`);
      } catch (error) {
        console.error('Failed to send incentive email:', error);
      }
      
      return email;
    }
    
    return null;
  }
}

// Create singleton instance
const guestManager = new GuestManager();
export default guestManager;
