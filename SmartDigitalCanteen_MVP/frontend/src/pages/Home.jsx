import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import MenuGrid from "../components/MenuGrid";
import Cart from "../components/Cart";
import OrderTracker from "../components/OrderTracker";
import guestManager from "../utils/GuestManager";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("CART") || "[]")
  );
  const [customerName, setCustomerName] = useState(() => {
    if (isAuthenticated && user) return user.username;
    return localStorage.getItem("CUSTOMER_NAME") || "Guest";
  });
  const [orderId, setOrderId] = useState(
    localStorage.getItem("LAST_ORDER_ID") || ""
  );
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);

  // All your existing useEffect hooks and functions remain exactly the same
  useEffect(() => {
    localStorage.setItem("CART", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("CUSTOMER_NAME", customerName);
      guestManager.updatePreferences({ customerName });
    }
  }, [customerName, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      const orderHistory = JSON.parse(localStorage.getItem('ORDER_HISTORY') || '[]');
      const favorites = JSON.parse(localStorage.getItem('FAVORITES') || '[]');
      
      if (orderHistory.length >= 2 || favorites.length >= 3) {
        setTimeout(() => setShowUpgradeHint(true), 5000);
      }
    }
  }, [isAuthenticated]);

  const addToCart = (item) => {
    if (item.stock === 0 || item.isOutOfStock) {
      alert(`❌ ${item.name} is out of stock!\n\nThis item cannot be added to your cart. Please choose another item.`);
      return;
    }

    const existingInCart = cart.find((p) => p._id === item._id);
    const currentCartQty = existingInCart ? existingInCart.qty : 0;
    
    if (item.stock !== -1 && currentCartQty >= item.stock) {
      alert(`⚠️ Cannot add more ${item.name}!\n\nYou already have ${currentCartQty} in your cart, which is the maximum available stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((p) => p._id === item._id);
      if (existing) {
        const newQty = existing.qty + 1;
        if (item.stock !== -1 && newQty > item.stock) {
          alert(`⚠️ Stock limit reached!\n\nOnly ${item.stock} ${item.name} available in stock.`);
          return prev;
        }
        return prev.map((p) =>
          p._id === item._id ? { ...p, qty: newQty } : p
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });

    const remainingStock = item.stock === -1 ? 'unlimited' : item.stock - (currentCartQty + 1);
    if (remainingStock !== 'unlimited' && remainingStock <= 5) {
      alert(`✅ ${item.name} added to cart!\n\n⚠️ Only ${remainingStock} left in stock.`);
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      for (const cartItem of cart) {
        if (cartItem.stock === 0 || cartItem.isOutOfStock) {
          alert(`❌ Order cannot be placed!\n\n${cartItem.name} is out of stock. Please remove it from your cart.`);
          return;
        }
        if (cartItem.stock !== -1 && cartItem.qty > cartItem.stock) {
          alert(`❌ Order cannot be placed!\n\n${cartItem.name}: You have ${cartItem.qty} in cart but only ${cartItem.stock} available in stock.`);
          return;
        }
      }

      const payload = {
        customerName,
        items: cart.map((item) => ({
          menuItemId: item._id,
          qty: item.qty,
        })),
        ...(isAuthenticated && user && { userId: user.id })
      };

      const response = await api.post("/api/orders", payload);
      const newOrderId = response.data._id;
      const orderTotal = response.data.total;
      
      setOrderId(newOrderId);
      localStorage.setItem("LAST_ORDER_ID", newOrderId);
      setCart([]);
      
      if (!isAuthenticated) {
        guestManager.trackOrder(newOrderId, orderTotal);
        setTimeout(() => {
          guestManager.collectEmailForNotifications(newOrderId);
        }, 1000);
      }
      
      alert(`🎉 Order placed successfully!\n\nOrder ID: #${newOrderId.slice(-6)}\nEstimated time: ${response.data.estimatedReadyAt ? new Date(response.data.estimatedReadyAt).toLocaleTimeString() : 'TBD'}`);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to place order";
      if (errorMsg.includes('stock')) {
        alert(`❌ Stock Error!\n\n${errorMsg}\n\nPlease refresh the page and adjust your cart.`);
      } else {
        alert(`❌ Order Failed!\n\n${errorMsg}`);
      }
    }
  };

  const handleCancelOrder = (cancelledOrderId) => {
    if (cancelledOrderId === orderId) {
      setOrderId("");
      localStorage.removeItem("LAST_ORDER_ID");
    }
  };

  const handleSetName = () => {
    const name = prompt("Please enter your name:");
    if (name && name.trim()) {
      setCustomerName(name.trim());
    }
  };

  const handleCreateAccount = () => {
    guestManager.showUpgradeModal();
    setShowUpgradeHint(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* All your existing header, hero, and main content sections remain the same */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-slate-200/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                  <span className="text-white text-2xl font-bold">🍽️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Smart Digital Canteen
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">Fresh • Fast • Delicious</p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#menu" className="text-slate-600 hover:text-orange-600 font-medium transition-colors">Menu</a>
              {isAuthenticated && (
                <a href="/order-history" className="text-slate-600 hover:text-orange-600 font-medium transition-colors">My Orders</a>
              )}
              <a href="#about" className="text-slate-600 hover:text-orange-600 font-medium transition-colors">About</a>
              <a href="#contact" className="text-slate-600 hover:text-orange-600 font-medium transition-colors">Contact</a>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-4 text-sm text-slate-600 border-l border-slate-200 pl-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Orders</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Fast Delivery</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">
                    {isAuthenticated ? (
                      <span className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-sm font-bold">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-slate-700 font-medium">Welcome, {customerName}</div>
                          <div className="text-xs text-green-600">✓ Member Account</div>
                        </div>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-sm">👤</span>
                        </div>
                        <div>
                          <div className="text-slate-700 font-medium">Welcome, {customerName}</div>
                          <div className="text-xs text-amber-600">Guest User</div>
                        </div>
                      </span>
                    )}
                  </div>
                </div>
                
                {!isAuthenticated && (
                  <div className="flex space-x-2">
                    {customerName === "Guest" && (
                      <button
                        onClick={handleSetName}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        Set Name
                      </button>
                    )}
                    <button
                      onClick={handleCreateAccount}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Sign Up Free
                    </button>
                  </div>
                )}

                {isAuthenticated && (
                  <div className="flex space-x-2">
                    <a href="/order-history" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">My Orders</a>
                    <button
                      onClick={() => {
                        localStorage.removeItem('auth_token');
                        window.location.reload();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Upgrade Banner */}
      {showUpgradeHint && !isAuthenticated && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">🎉</span>
              </div>
              <div>
                <p className="font-semibold text-lg">You&apos;re a valued customer!</p>
                <p className="text-sm text-white/90">Create an account to unlock premium features and save your favorites</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateAccount}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 border border-white/30"
              >
                Create Account
              </button>
              <button
                onClick={() => setShowUpgradeHint(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-white to-red-50 opacity-70"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Delicious Food,
              <span className="block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Delivered Fresh
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Experience the finest cuisine from our digital canteen. Fresh ingredients, 
              expert preparation, and lightning-fast delivery right to your table.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl shadow-md">
              <div className="text-3xl font-bold text-orange-600 mb-1">500+</div>
              <div className="text-sm text-slate-600 font-medium">Happy Customers</div>
            </div>
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl shadow-md">
              <div className="text-3xl font-bold text-green-600 mb-1">15min</div>
              <div className="text-sm text-slate-600 font-medium">Avg Delivery</div>
            </div>
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-1">4.9★</div>
              <div className="text-sm text-slate-600 font-medium">Customer Rating</div>
            </div>
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl shadow-md">
              <div className="text-3xl font-bold text-purple-600 mb-1">100+</div>
              <div className="text-sm text-slate-600 font-medium">Menu Items</div>
            </div>
          </div>

          <button
            onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Order Now 🍽️
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main id="menu-section" className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-slate-900 mb-3">Our Menu</h3>
              <p className="text-slate-600 text-lg">Discover our carefully crafted selection of delicious meals</p>
            </div>
            <MenuGrid onAdd={addToCart} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-28">
              <Cart items={cart} setItems={setCart} onPlaceOrder={placeOrder} />
              {orderId && (
                <div className="mt-6">
                  <OrderTracker orderId={orderId} onCancel={handleCancelOrder} />
                </div>
              )}
              {!isAuthenticated && (
                <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl shadow-md">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-xl">🎁</span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Premium Benefits</h3>
                    <p className="text-sm text-slate-600 mb-4">Unlock exclusive features with a free account</p>
                  </div>
                  
                  <ul className="text-sm text-slate-700 space-y-3 mb-6">
                    <li className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span>Save favorites across devices</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span>Faster checkout process</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span>Order history & tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span>Exclusive member discounts</span>
                    </li>
                  </ul>
                  
                  <button
                    onClick={handleCreateAccount}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Create Free Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Why Choose Smart Canteen?</h3>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              We&apos;re committed to providing the best digital dining experience with cutting-edge technology and exceptional service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Lightning Fast</h4>
              <p className="text-slate-300">Average preparation time of just 15 minutes. Fresh food, delivered fast.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍃</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Fresh Ingredients</h4>
              <p className="text-slate-300">We source the finest ingredients daily to ensure maximum freshness and flavor.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Smart Ordering</h4>
              <p className="text-slate-300">Advanced ordering system with real-time tracking and seamless payment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🎉 UPDATED FOOTER WITH LARGE DEVELOPER PHOTO */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🍽️</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Smart Digital Canteen</h4>
                  <p className="text-slate-600 text-sm">Fresh • Fast • Delicious</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Experience the finest cuisine with our digital ordering platform. 
                Fresh ingredients, expert preparation, and lightning-fast delivery.
              </p>
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Secure Ordering</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Fast Delivery</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-slate-900 mb-4">Quick Links</h5>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#menu" className="hover:text-orange-600 transition-colors">Menu</a></li>
                <li><a href="#about" className="hover:text-orange-600 transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-orange-600 transition-colors">Contact</a></li>
                <li><a href="/order-history" className="hover:text-orange-600 transition-colors">Order History</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-slate-900 mb-4">Contact Info</h5>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <span>📧</span>
                  <span>support@smartcanteen.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>+880 1234-567890</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>Dhaka, Bangladesh</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>🕒</span>
                  <span>24/7 Service</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 🎉 ENHANCED LARGE DEVELOPER PHOTO SECTION */}
          <div className="border-t border-slate-200 pt-8">
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl p-8 shadow-md">
              <div className="text-center mb-8">
                <h5 className="text-2xl font-bold text-slate-900 mb-3 flex items-center justify-center space-x-3">
                  <span className="text-3xl">👨‍💻</span>
                  <span>Meet the Developer</span>
                </h5>
                <p className="text-slate-600 text-base">Built with passion for exceptional digital experiences</p>
              </div>
              
              <div className="flex flex-col lg:flex-row items-center justify-center space-y-8 lg:space-y-0 lg:space-x-12">
                {/* 📸 MUCH LARGER DEVELOPER PHOTO */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-orange-200 via-red-200 to-pink-200 flex items-center justify-center shadow-2xl border-8 border-white">
                      <img
                        src="https://i.postimg.cc/Ssd5WxXJ/1f38be7c-20e4-4ac7-a8cf-4355db245c63.jpg"
                        alt="Md. Al-Raiyan"
                        className="w-44 h-44 md:w-52 md:h-52 lg:w-60 lg:h-60 rounded-full object-cover border-4 border-white shadow-xl"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-44 h-44 md:w-52 md:h-52 lg:w-60 lg:h-60 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-6xl md:text-7xl lg:text-8xl font-bold" style={{display: 'none'}}>
                        AR
                      </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-500 rounded-full border-6 border-white flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">✓</span>
                    </div>
                    
                    {/* Professional Badge */}
                    <div className="absolute -top-4 -left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      Developer
                    </div>
                  </div>
                </div>

                {/* Enhanced Developer Info */}
                <div className="flex-1 text-center lg:text-left max-w-lg">
                  <h6 className="text-3xl font-bold text-slate-900 mb-3">Md. Al-Raiyan</h6>
                  <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                    Full-Stack Developer passionate about creating innovative digital solutions. 
                    Specializing in modern web technologies and user-centered design to deliver 
                    exceptional digital experiences that make a difference.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-center lg:justify-start space-x-4">
                      <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-lg">📱</span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Phone</p>
                          <a 
                            href="tel:+8801859736951" 
                            className="text-slate-700 hover:text-orange-600 transition-colors font-semibold"
                          >
                            +880 1859736951
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-start space-x-4">
                      <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-lg">✉️</span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Email</p>
                          <a 
                            href="mailto:md.al.raiyan@g.bracu.ac.bd" 
                            className="text-slate-700 hover:text-orange-600 transition-colors font-semibold"
                          >
                            md.al.raiyan@g.bracu.ac.bd
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Social Links */}
                    <div className="flex items-center justify-center lg:justify-start space-x-4 pt-4">
                      <a 
                        href="https://github.com/Raiyan220" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center space-x-3 bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        title="GitHub Profile"
                      >
                        <span className="text-lg">🔗</span>
                        <span className="font-medium">GitHub</span>
                      </a>
                      <a 
                        href="https://www.linkedin.com/in/md-al-raiyan-337444279/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        title="LinkedIn Profile"
                      >
                        <span className="text-lg">💼</span>
                        <span className="font-medium">LinkedIn</span>
                      </a>
                      <a 
                        href="https://yourportfolio.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center space-x-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        title="Portfolio Website"
                      >
                        <span className="text-lg">🌐</span>
                        <span className="font-medium">Portfolio</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Skills/Technologies */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-4 font-medium">Built with modern technologies</p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {[
                      { name: 'React', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                      { name: 'Node.js', color: 'bg-green-100 text-green-700 border-green-200' },
                      { name: 'MongoDB', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                      { name: 'Tailwind CSS', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
                      { name: 'Express.js', color: 'bg-gray-100 text-gray-700 border-gray-200' }
                    ].map((tech) => (
                      <span 
                        key={tech.name} 
                        className={`${tech.color} px-4 py-2 rounded-full text-sm font-semibold border shadow-sm hover:shadow-md transition-shadow`}
                      >
                        {tech.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-500">
            <p>&copy; 2025 Smart Digital Canteen. All rights reserved. | Secure Digital Ordering Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
