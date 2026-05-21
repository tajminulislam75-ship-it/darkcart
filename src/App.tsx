/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Search,
  SlidersHorizontal,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  Check,
  ShieldAlert,
  Edit2,
  Trash,
  ChevronRight,
  Send,
  Lock,
  Unlock,
  Eye,
  ShoppingBag,
  Bell,
  RefreshCw,
  Star,
  CheckCircle,
  HelpCircle,
  Phone,
  Settings,
  Image as ImageIcon,
  Sliders,
  TrendingUp,
  Package,
  ArrowRight,
  Database,
  Briefcase,
  Share2
} from "lucide-react";
import { Product, Order, SiteSettings } from "./types";
import ThreeDPhone from "./components/ThreeDPhone";
import NotificationPanel from "./components/NotificationPanel";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Global States
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // UI Controls
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<{ product: Product; color: string; storage: string; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "lowToHigh" | "highToLow" | "name">("default");
  
  // Specs Compare Widget States
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Checkout Wizard States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [devCodeSuggested, setDevCodeSuggested] = useState(""); // development helper

  // Check out info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"bKash" | "Nagad" | "Rocket" | "Bank Transfer">("bKash");
  const [senderAccountNo, setSenderAccountNo] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [proofImageBase64, setProofImageBase64] = useState<string>("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [placedOrderResult, setPlacedOrderResult] = useState<String | null>(null);

  // Hidden Secure Admin Panel States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthError, setAdminAuthError] = useState("");
  const [adminActiveTab, setAdminActiveTab] = useState<"summary" | "products" | "orders" | "settings" | "reviews">("summary");

  // Admin CMS CRUD temporary forms
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);

  // Alerting states
  const [alertToast, setAlertToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Load Initial Sourced Data
  const loadData = async () => {
    try {
      const resProducts = await fetch("/api/products");
      if (resProducts.ok) {
        const data = await resProducts.ok ? await resProducts.json() : [];
        setProducts(data);
      }
      const resSettings = await fetch("/api/settings");
      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettings(data);
      }
      const resOrders = await fetch("/api/orders");
      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Oops! Failed to load initial data from system API backend", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setAlertToast({ message, type });
    setTimeout(() => {
      setAlertToast(null);
    }, 4500);
  };

  // --- CART FUNCTIONS ---
  const addToCart = (product: Product, color: string, storage: string) => {
    // Check if combined key already exists in the local state basket
    const existingIdx = cart.findIndex(
      (item) => item.product.id === product.id && item.color === color && item.storage === storage
    );

    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, color, storage, quantity: 1 }]);
    }
    triggerToast(`Added ${product.name} (${storage}) to your premium cart!`, "success");
    setIsCartOpen(true);
  };

  const updateCartQty = (idx: number, delta: number) => {
    const updated = [...cart];
    updated[idx].quantity += delta;
    if (updated[idx].quantity <= 0) {
      updated.splice(idx, 1);
    }
    setCart(updated);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // --- COMPARE LIST ENGINE ---
  const toggleCompare = (product: Product) => {
    if (compareList.some((p) => p.id === product.id)) {
      setCompareList(compareList.filter((p) => p.id !== product.id));
      triggerToast(`${product.name} removed from spec compare chart`, "info");
    } else {
      if (compareList.length >= 3) {
        triggerToast("You can compare up to 3 sovereign smartphones max!", "error");
        return;
      }
      setCompareList([...compareList, product]);
      triggerToast(`Added ${product.name} to spec compare list`, "success");
      setIsCompareOpen(true);
    }
  };

  // --- OTP VERIFICATION SYSTEM ---
  const reqOtpVerification = async () => {
    if (!checkoutEmail || !checkoutEmail.includes("@")) {
      setOtpError("Please verify your email syntax formatting.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checkoutEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (data.developmentCode) {
          // Store development code directly for instant convenient simulation copy paste
          setDevCodeSuggested(data.developmentCode);
        }
        triggerToast("Simulated secure OTP sent successfully!", "success");
      } else {
        setOtpError(data.error || "System error sending OTP");
      }
    } catch (e) {
      setOtpError("Failed contacting authentication server.");
    } finally {
      setOtpLoading(false);
    }
  };

  const submitOtpVerify = async () => {
    if (!otpCode) {
      setOtpError("Please type the active 6-digit OTP code.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checkoutEmail, code: otpCode })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOtpVerified(true);
        triggerToast("Email certified! Proceeding to advance deposit registration.", "success");
      } else {
        setOtpError(data.error || "Incorrect coupon code or validation expiry mismatch.");
      }
    } catch (e) {
      setOtpError("Authentication routing failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  // --- IMAGE UPLOAD TO BASE64 UTILITY ---
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImageBase64(reader.result as string);
      triggerToast("Payment attachment proof registered into local browser stream!", "success");
    };
    reader.readAsDataURL(file);
  };

  // --- SUBMIT COMPLETED ORDER ---
  const finalizeOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      triggerToast("Please provide primary customer delivery descriptors.", "error");
      return;
    }
    if (!transactionId) {
      triggerToast("Please provide the transaction verification index code.", "error");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderPayload: Omit<Order, "id" | "status" | "createdAt"> = {
        customerInfo: {
          name: customerName,
          email: checkoutEmail,
          phone: customerPhone,
          address: customerAddress
        },
        items: cart.map((c) => ({
          product: {
            id: c.product.id,
            name: c.product.name,
            price: c.product.price,
            image: c.product.images[0]
          },
          color: c.color,
          storage: c.storage,
          quantity: c.quantity
        })),
        paymentMethod: selectedPaymentMethod,
        paymentDetails: {
          accountNo: senderAccountNo,
          transactionId: transactionId,
          note: orderNote,
          paymentProofBase64: proofImageBase64
        },
        total: cartTotal
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();

      if (res.ok) {
        setPlacedOrderResult(data.id);
        setCart([]); // Flush cart
        triggerToast(`Order ${data.id} placed cleanly! Validating transaction shortly.`, "success");
        loadData(); // refresh order indexes
      } else {
        triggerToast(data.error || "Order validation rejected by system controller.", "error");
      }
    } catch (err) {
      triggerToast("Error contacting border-clearance gateway database.", "error");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // --- ADMIN LOGIN ---
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminLoggedIn(true);
        triggerToast("Welcome back High Majesty Owner! CMS Dashboard certified.", "success");
      } else {
        setAdminAuthError(data.error || "Secret credentials rejected.");
      }
    } catch (e) {
      setAdminAuthError("Failed reaching server core router.");
    }
  };

  // --- ADMIN SETTINGS EDIT ---
  const saveAdminSettings = async (updatedSettings: SiteSettings) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        triggerToast("Site CMS metadata values persistent updated!", "success");
      }
    } catch (e) {
      triggerToast("Failed writing site configuration.", "error");
    }
  };

  // --- ADMIN ORDERS STATUS UPDATE ---
  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        triggerToast(`Order ${orderId} status shifted to: ${status}`, "success");
        loadData();
      }
    } catch (e) {
      triggerToast("Failed updating status coordinates.", "error");
    }
  };

  // --- ADMIN ORDER DELETION ---
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Are you sure you want to permanently cancel and delete order ${orderId}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast(`Order ${orderId} has been successfully cancelled and removed from DB registries!`, "success");
        loadData();
      } else {
        triggerToast("Failed cancelling the customer order.", "error");
      }
    } catch (e) {
      triggerToast("Network link timed out purging customer order.", "error");
    }
  };

  // --- ADMIN PRODUCTS CRUD ---
  const handleProductDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exquisite hardware variant entry?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast("Product wiped out from stock files.", "success");
        loadData();
      }
    } catch (e) {
      triggerToast("Failed absolute deletion routine.", "error");
    }
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.id || !editingProduct?.name || !editingProduct?.price) {
      triggerToast("Missing fundamental identifier, name or price details.", "error");
      return;
    }

    try {
      const endpoint = isAddingNewProduct ? `/api/products` : `/api/products/${editingProduct.id}`;
      const method = isAddingNewProduct ? "POST" : "PUT";
      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct)
      });

      if (res.ok) {
        triggerToast(
          isAddingNewProduct ? "Exquisite new device added live!" : "Smart device coordinates recompiled!",
          "success"
        );
        setEditingProduct(null);
        setIsAddingNewProduct(false);
        loadData();
      } else {
        const d = await res.json();
        triggerToast(d.error || "Save operation failed.", "error");
      }
    } catch (e) {
      triggerToast("Network link timed out committing product configurations.", "error");
    }
  };

  // Filter products for storefront display
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (currentCategory === "All") return matchesSearch;
    return p.category === currentCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "lowToHigh") return a.price - b.price;
    if (sortBy === "highToLow") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0; // Default index sorted
  });

  // Calculate stats for admin dashboard view
  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === "Pending Check").length;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-600 selection:text-black overflow-x-hidden relative flex flex-col">
      {/* Decorative dynamic neon luxury glowing lights elements */}
      <div className="absolute top-[-25%] right-[-15%] w-[800px] h-[800px] bg-orange-605/10 rounded-full blur-[140px] pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, transparent 70%)" }} />
      <div className="absolute top-[40%] left-[-20%] w-[800px] h-[800px] bg-cyan-950/10 rounded-full blur-[140px] pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%)" }} />

      {/* --- FLOATING TOAST --- */}
      {alertToast && (
        <div className="fixed top-24 right-4 z-50 max-w-sm animate-bounce">
          <div
            className={`p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 border ${
              alertToast.type === "success"
                ? "bg-lime-950/90 border-lime-500/30 text-lime-300"
                : alertToast.type === "error"
                ? "bg-rose-950/90 border-rose-500/30 text-rose-300"
                : "bg-indigo-950/90 border-indigo-500/30 text-indigo-300"
            }`}
          >
            <span className="text-lg">
              {alertToast.type === "success" ? "🥇" : alertToast.type === "error" ? "🛑" : "💡"}
            </span>
            <div className="text-xs font-mono font-medium leading-relaxed">{alertToast.message}</div>
          </div>
        </div>
      )}

      {/* --- MAIN HEADER / NAVIGATION RAIL --- */}
      <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo brand & Name */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsAdminMode(false);
                setSelectedProduct(null);
              }}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 rounded-xl flex items-center justify-center font-black text-black text-xl italic tracking-tighter shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:scale-105 transition-all">
                D
              </div>
              <div>
                <h1 className="text-2xl font-light tracking-tighter leading-none italic text-zinc-100">
                  DARK<span className="font-extrabold not-italic text-white">CART</span>
                </h1>
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/40 mt-0.5">
                  Border-Cross Imports
                </p>
              </div>
            </button>
          </div>

          {/* Quick Stats Search & Active view selectors for desktop */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search premium models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full px-6 py-2 text-xs font-mono tracking-tight focus:outline-none focus:border-orange-500 w-64 transition-all focus:bg-white/10 placeholder:text-zinc-650"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute right-4 top-2.5" />
            </div>

            {settings?.contactInfo?.whatsapp && (
              <a
                href={`https://wa.me/${settings.contactInfo.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 border border-emerald-800/60 px-4 py-2 rounded-full text-xs text-emerald-400 font-mono"
              >
                <Phone className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Live Spec Support</span>
              </a>
            )}
          </div>

          {/* Cart triggers & Actions */}
          <div className="flex items-center gap-3">
            
            {/* Spec Compare Float Trigger if there are item selections */}
            {compareList.length > 0 && (
              <button
                onClick={() => setIsCompareOpen(true)}
                className="bg-amber-600 text-black font-semibold font-mono text-xs px-3.5 py-2.5 rounded-full flex items-center gap-1.5 hover:bg-amber-500 transition-all select-none animate-pulse"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Compare ({compareList.length})</span>
              </button>
            )}

            {/* Shopping Bag Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl relative transition-all duration-300 flex items-center gap-2"
              title="Open My Bag"
            >
              <ShoppingBag className="w-4 h-4 text-zinc-100" />
              <span className="hidden sm:inline text-xs font-mono text-zinc-300">Bag</span>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {cart.reduce((s, c) => s + c.quantity, 0)}
                </span>
              )}
            </button>

            {/* Toggle Admin Dashboard Mode */}
            <button
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setSelectedProduct(null);
              }}
              className={`p-3 rounded-xl border transition-all ${
                isAdminMode
                  ? "bg-orange-600 border-orange-500 text-black font-bold"
                  : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white"
              }`}
              title="Secure Hidden CRM"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* --- PRE-HEADER EXCLUSIVE DEALS STRIP --- */}
      <div className="bg-[#050505] border-b border-zinc-900/40 text-black py-2.5 px-4 text-center text-[11px] font-mono tracking-widest font-extrabold uppercase relative z-20 select-none flex justify-center items-center gap-3">
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-indigo-700 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
          <span className="bg-black text-white px-2 py-0.5 rounded text-[9px] font-mono tracking-tight shrink-0">
            BORDER-CROSS DIRECT
          </span>
          <span className="hidden sm:inline text-zinc-900">💥 PROMPT 5% ADVANCE DISCOUNTS UNLOCKED THROUGH ACTIVE TICKETS • GLOBAL MODEL HARDWARE IMPORTED LIVE FOR BANGLADESH!</span>
          <span className="sm:hidden text-zinc-900">💥 CURRENT FLASHSALE: 5% OFF ADVANCE DEPOSITS!</span>
        </div>
      </div>

      {/* --- COMPILER WORKSPACE LAYOUT (ADMIN VIEW OR FRONT-END SHOWCASE) --- */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 relative z-10 flex flex-col">
        
        {isAdminMode ? (
          /* ========================================================== */
          /* =================== CMS CLIENT PORTAL ==================== */
          /* ========================================================== */
          <div className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-3xl shadow-[0_30px_70px_rgba(0,0,0,0.95)] animate-fade-in">
            
            {/* Title / Auth Wall */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-5 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 bg-orange-500 rounded-full animate-ping" />
                  <span className="text-xs font-mono text-orange-405 tracking-widest uppercase">
                    CMS Sourced Terminal Security Console
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 flex flex-wrap items-center gap-3">
                  <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] select-all font-mono">
                    DARKCART
                  </span>
                  <span className="text-zinc-100 font-sans tracking-wide">Owner Control Panel</span>
                  {isAdminLoggedIn ? (
                    <span className="text-xs bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full font-mono uppercase tracking-wider shadow-sm">
                      👑 Admin Authorized
                    </span>
                  ) : (
                    <span className="text-xs bg-red-950/60 border border-red-500/30 text-rose-455 px-3 py-1 rounded-full font-mono uppercase tracking-wider shadow-sm">
                      🔒 Guard Enforced
                    </span>
                  )}
                </h2>
              </div>

              {isAdminLoggedIn && (
                <button
                  onClick={() => setIsAdminLoggedIn(false)}
                  className="bg-white/5 hover:bg-white/10 text-zinc-300 font-mono text-xs px-4 py-2 rounded-lg border border-white/10"
                >
                  Log Out Control Setup
                </button>
              )}
            </div>

            {!isAdminLoggedIn ? (
              /* Auth Form Wall */
              <div className="max-w-md mx-auto py-12 px-6 bg-[#090909] border border-zinc-850/80 rounded-2xl shadow-xl">
                <div className="text-center mb-6">
                  <Lock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold">Verification Sourced Node</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    This admin panel route is fully hidden and secured. Provide the credentials to proceed.
                  </p>
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                      Username ID
                    </label>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="e.g. Theowner009"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                      Security Secret Pin
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="XXXX"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono tracking-widest"
                      required
                    />
                  </div>

                  {adminAuthError && (
                    <div className="p-3.5 bg-rose-950/50 border border-rose-500/30 rounded-lg text-xs font-mono text-rose-300 leading-normal">
                      ⚠️ {adminAuthError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold font-mono text-xs py-3 rounded-lg uppercase tracking-wider transition-all"
                  >
                    Authenticate Interface Session
                  </button>
                </form>
              </div>
            ) : (
              /* Authenticated Admin Dashboard Portal Workspace */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Admin Navigation rail sidebar */}
                <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-r border-zinc-800/80 pr-0 lg:pr-6 whitespace-nowrap">
                  <button
                    onClick={() => setAdminActiveTab("summary")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-mono transition-all ${
                      adminActiveTab === "summary"
                        ? "bg-orange-600/10 border-l-4 border-orange-500 text-orange-400 font-bold"
                        : "text-zinc-455 hover:bg-white/5 text-zinc-400"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>OVERVIEW & STATS</span>
                  </button>
                  <button
                    onClick={() => setAdminActiveTab("products")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-mono transition-all ${
                      adminActiveTab === "products"
                        ? "bg-orange-600/10 border-l-4 border-orange-500 text-orange-400 font-bold"
                        : "text-zinc-455 hover:bg-white/5 text-zinc-400"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>MANAGE PRODUCTS ({products.length})</span>
                  </button>
                  <button
                    onClick={() => setAdminActiveTab("orders")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-mono transition-all ${
                      adminActiveTab === "orders"
                        ? "bg-orange-600/10 border-l-4 border-orange-500 text-orange-400 font-bold relative"
                        : "text-zinc-455 hover:bg-white/5 text-zinc-400"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>CUSTOMER ORDERS ({orders.length})</span>
                    {pendingOrdersCount > 0 && (
                      <span className="ml-auto bg-orange-600 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingOrdersCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setAdminActiveTab("settings")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-mono transition-all ${
                      adminActiveTab === "settings"
                        ? "bg-orange-600/10 border-l-4 border-orange-500 text-orange-400 font-bold"
                        : "text-zinc-455 hover:bg-white/5 text-zinc-400"
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>PAYMENT & CMS SETTINGS</span>
                  </button>
                </div>

                {/* Dashboard Tabs Rendering Core */}
                <div className="lg:col-span-9 space-y-6">
                  
                  {/* TAB 1: OVERVIEW STATS */}
                  {adminActiveTab === "summary" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-stone-900/50 p-5 rounded-2xl border border-zinc-850">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                            Total Sourced Orders Gross
                          </span>
                          <span className="text-3xl font-bold font-mono tracking-tight text-orange-500 block mt-2">
                            ৳ {totalRevenue.toLocaleString("en-US")}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                            Excluding cancelled invoices
                          </span>
                        </div>
                        <div className="bg-stone-900/50 p-5 rounded-2xl border border-zinc-850">
                          <span className="text-[10px] font-mono text-zinc-405 uppercase tracking-widest block">
                            Active Phone Sku Options
                          </span>
                          <span className="text-3xl font-bold font-mono tracking-tight text-cyan-400 block mt-2">
                            {products.length} Variants
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                            Fully functional spec matrix
                          </span>
                        </div>
                        <div className="bg-stone-900/50 p-5 rounded-2xl border border-zinc-850">
                          <span className="text-[10px] font-mono text-zinc-405 uppercase tracking-widest block">
                            Unvalidated Pending Checks
                          </span>
                          <span className="text-3xl font-bold font-mono tracking-tight text-amber-400 block mt-2">
                            {pendingOrdersCount} Orders
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                            Needs transaction check
                          </span>
                        </div>
                      </div>

                      <div className="bg-stone-900/30 p-6 rounded-2xl border border-zinc-800">
                        <h4 className="text-sm font-mono text-zinc-300 mb-4 tracking-tight flex items-center gap-2">
                          <Database className="w-4 h-4 text-orange-500" />
                          <span>SECURE DATABASE TELEMETRY WORKSPACE</span>
                        </h4>
                        <div className="text-xs text-zinc-400 leading-relaxed space-y-3">
                          <p>
                            Welcome High Owner. Through this custom terminal, you are connected directly to the custom persistent server DB. Any modifications to item prices, specs lists, active bKash, or Nagad accounts will affect order placements directly.
                          </p>
                          <div className="bg-black/50 p-4 rounded-xl border border-zinc-850 font-mono text-[11px] text-zinc-400">
                            <strong>System Root Security Integrity</strong>: OK • No database leaks detected. Secure OTP simulator logging live checking alerts triggers.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PRODUCTS CMS MANAGEMENTS CRUD */}
                  {adminActiveTab === "products" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-mono text-zinc-300">Product Sku Repositories</h3>
                        <button
                          onClick={() => {
                            setEditingProduct({
                              id: `custom-phone-${Date.now()}`,
                              name: "Exquisite Flagship Device X",
                              price: 95000,
                              originalPrice: 105000,
                              description: "Global unlocked premium series. Direct source custom active.",
                              images: [
                                "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600"
                              ],
                              colors: ["Cosmos Black", "Gold Lustre"],
                              storageOptions: ["256GB Platinum Pro", "512GB Ultra-Speed"],
                              specs: {
                                camera: "108MP Quad Telephoto",
                                battery: "5000 mAh 45W Active",
                                processor: "Snapdragon 8 Gen 3 Standard",
                                screen: "6.7-inch Super AMOLED QHD+",
                                weight: "215g Perfect Light",
                                os: "OxygenOS Pure Direct"
                              },
                              stockStatus: "In Stock",
                              isExclusive: false,
                              featured: false,
                              category: "Flagship"
                            });
                            setIsAddingNewProduct(true);
                          }}
                          className="bg-orange-600 hover:bg-orange-500 text-black text-xs font-mono font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                          <span>ADD NEW SMARTPHONE</span>
                        </button>
                      </div>

                      {/* Editing / Adding modal form container inline */}
                      {editingProduct && (
                        <form
                          onSubmit={handleSaveProductSubmit}
                          className="bg-[#090909] border-2 border-orange-500/40 p-6 rounded-2xl space-y-4 shadow-xl"
                        >
                          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                            <span className="text-xs font-mono font-bold text-orange-400 uppercase">
                              {isAddingNewProduct ? "Add New Spec Record" : "Modify Device Parameters"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(null);
                                setIsAddingNewProduct(false);
                              }}
                              className="text-zinc-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 uppercase">Device ID URL-slug</label>
                              <input
                                type="text"
                                value={editingProduct.id || ""}
                                onChange={(e) => setEditingProduct({ ...editingProduct, id: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-xs font-mono mt-1 text-white"
                                required
                                disabled={!isAddingNewProduct}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 uppercase">Interactive Device Name</label>
                              <input
                                type="text"
                                value={editingProduct.name || ""}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-xs mt-1 text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 uppercase">Category</label>
                              <select
                                value={editingProduct.category || "Flagship"}
                                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                                className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-xs mt-1 text-zinc-300"
                              >
                                <option value="Flagship">Flagship Collection</option>
                                <option value="Gaming">Gaming Extreme</option>
                                <option value="Exclusive">Border-Cross Exclusive</option>
                                <option value="Mid-Range">Balanced Mid-Range</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 uppercase">Live Price BDT</label>
                              <input
                                type="number"
                                value={editingProduct.price || 0}
                                onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                className="w-full bg-zinc-950 border border-zinc-880 p-2 rounded text-xs mt-1 text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 uppercase">Original Price (For Sales markdown)</label>
                              <input
                                type="number"
                                value={editingProduct.originalPrice || 0}
                                onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                                className="w-full bg-zinc-950 border border-zinc-880 p-2 rounded text-xs mt-1 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 uppercase">Stock Coordinates</label>
                              <select
                                value={editingProduct.stockStatus || "In Stock"}
                                onChange={(e) => setEditingProduct({ ...editingProduct, stockStatus: e.target.value as any })}
                                className="w-full bg-zinc-950 border border-zinc-880 p-2 rounded text-xs mt-1 text-zinc-350"
                              >
                                <option value="In Stock">In Stock</option>
                                <option value="Limited Stock">Limited Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                                <option value="Pre-Order">Pre-Order Option</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 uppercase">Offer Promotional Tag</label>
                              <input
                                type="text"
                                value={editingProduct.offerText || ""}
                                placeholder="e.g. 🔥 FLASH 7% ADVANCE DISCOUNT"
                                onChange={(e) => setEditingProduct({ ...editingProduct, offerText: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-880 p-2 rounded text-xs mt-1 text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase">Sourced Images URLs List (One line each)</label>
                            <textarea
                              rows={3}
                              value={editingProduct.images?.join("\n") || ""}
                              onChange={(e) => setEditingProduct({ ...editingProduct, images: e.target.value.split("\n").filter(Boolean) })}
                              className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded text-xs font-mono mt-1 text-stone-300"
                              required
                            />
                            <span className="text-[10px] text-zinc-400">Use high-contrast copyright free unsplash URLs only.</span>
                          </div>

                          {/* Technical Spec matrices */}
                          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3">
                            <span className="text-[11px] font-mono font-semibold text-zinc-400 block pb-1 border-b border-zinc-850">
                              🔩 Core Technical Specification Grid Map
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[9px] text-zinc-500 font-mono">Processor Core</label>
                                <input
                                  type="text"
                                  value={editingProduct.specs?.processor || ""}
                                  onChange={(e) => setEditingProduct({
                                    ...editingProduct,
                                    specs: { ...(editingProduct.specs || {}), processor: e.target.value }
                                  })}
                                  className="w-full bg-[#080808] border border-zinc-850 p-1.5 rounded text-xs text-white search-field"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-zinc-500 font-mono">Camera Specs</label>
                                <input
                                  type="text"
                                  value={editingProduct.specs?.camera || ""}
                                  onChange={(e) => setEditingProduct({
                                    ...editingProduct,
                                    specs: { ...(editingProduct.specs || {}), camera: e.target.value }
                                  })}
                                  className="w-full bg-[#080808] border border-zinc-850 p-1.5 rounded text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-zinc-500 font-mono">Battery Specs</label>
                                <input
                                  type="text"
                                  value={editingProduct.specs?.battery || ""}
                                  onChange={(e) => setEditingProduct({
                                    ...editingProduct,
                                    specs: { ...(editingProduct.specs || {}), battery: e.target.value }
                                  })}
                                  className="w-full bg-[#080808] border border-zinc-850 p-1.5 rounded text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-zinc-500 font-mono">Screen Dimensions</label>
                                <input
                                  type="text"
                                  value={editingProduct.specs?.screen || ""}
                                  onChange={(e) => setEditingProduct({
                                    ...editingProduct,
                                    specs: { ...(editingProduct.specs || {}), screen: e.target.value }
                                  })}
                                  className="w-full bg-[#080808] border border-zinc-850 p-1.5 rounded text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-zinc-500 font-mono">Firmware Operating System</label>
                                <input
                                  type="text"
                                  value={editingProduct.specs?.os || ""}
                                  onChange={(e) => setEditingProduct({
                                    ...editingProduct,
                                    specs: { ...(editingProduct.specs || {}), os: e.target.value }
                                  })}
                                  className="w-full bg-[#080808] border border-zinc-850 p-1.5 rounded text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-zinc-500 font-mono">Hardware Weight Info</label>
                                <input
                                  type="text"
                                  value={editingProduct.specs?.weight || ""}
                                  onChange={(e) => setEditingProduct({
                                    ...editingProduct,
                                    specs: { ...(editingProduct.specs || {}), weight: e.target.value }
                                  })}
                                  className="w-full bg-[#080808] border border-zinc-850 p-1.5 rounded text-xs text-white"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(null);
                                setIsAddingNewProduct(false);
                              }}
                              className="px-4 py-2 bg-stone-900 rounded-lg text-xs text-zinc-400 font-mono"
                            >
                              Discard Changes
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2 bg-orange-600 font-mono font-bold hover:bg-orange-500 text-black rounded-lg text-xs"
                            >
                              Save Coordinates Log
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Product display cards list inside Admin */}
                      <div className="space-y-3">
                        {products.map((p) => (
                          <div
                            key={p.id}
                            className="bg-[#090909] p-4 rounded-xl border border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-805 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-12 h-12 rounded-lg object-cover bg-stone-900 shrink-0 border border-zinc-800"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white">{p.name}</span>
                                  <span className="text-[9px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded-full font-mono uppercase">
                                    {p.category}
                                  </span>
                                </div>
                                <span className="text-xs font-mono text-orange-500 block">
                                  ৳ {p.price.toLocaleString("en-US")} BDT
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsAddingNewProduct(false);
                                  // scroll page to the form trigger
                                  window.scrollTo({ top: 380, behavior: "smooth" });
                                }}
                                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all"
                                title="Edit properties"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleProductDelete(p.id)}
                                className="p-2 bg-rose-950/40 border border-rose-900/40 text-rose-450 hover:bg-rose-900/20 text-rose-300 rounded-lg transition-all"
                                title="Delete from stock variant catalogs"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CUSTOMER ORDERS VIEW & TRANSACTION VERIFICATE */}
                  {adminActiveTab === "orders" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-mono text-zinc-300">Customer Placement Logs</h3>

                      {orders.length === 0 ? (
                        <div className="text-center py-12 text-zinc-650 italic text-sm">
                          No orders registered by users yet. Placements show up instantly here with attachments!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((o) => (
                            <div
                              key={o.id}
                              className="bg-[#090909] p-5 rounded-2xl border border-zinc-850/85 space-y-4 shadow-md"
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800/80 pb-3 gap-2">
                                <div>
                                  <span className="text-xs font-mono font-black text-orange-500 uppercase tracking-widest bg-orange-950/20 px-2.5 py-1 rounded border border-orange-500/20">
                                    🎫 Order ID: {o.id}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-500 ml-3">
                                    {new Date(o.createdAt).toLocaleString("en-US")}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-mono font-medium text-zinc-400">STATUS:</span>
                                  <select
                                    value={o.status}
                                    onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                                    className="bg-black border border-zinc-800 px-3 py-1 text-xs font-mono text-zinc-305 rounded-xl text-yellow-500 mr-2 focus:outline-none focus:border-orange-500"
                                  >
                                    <option value="Pending Check">Pending Deposit Check</option>
                                    <option value="Processing">Processing Global Order</option>
                                    <option value="Completed">Direct Handover Completed</option>
                                    <option value="Cancelled">Cancelled Invoice</option>
                                  </select>

                                  <button
                                    onClick={() => handleDeleteOrder(o.id)}
                                    className="px-3 py-1 bg-rose-950/60 border border-rose-500/30 text-rose-400 hover:bg-rose-900/60 hover:text-white rounded-xl text-[11px] font-mono transition-all flex items-center gap-1.5 active:scale-95"
                                    title="Cancel and Purge Order Log"
                                  >
                                    <Trash className="w-3.5 h-3.5 stroke-[2px]" />
                                    <span>Cancel & Delete</span>
                                  </button>
                                </div>
                              </div>

                              {/* Customer Information detail */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                                  <span className="text-[10px] text-zinc-500 font-mono block uppercase">Customer Details</span>
                                  <p className="font-semibold text-zinc-100">{o.customerInfo.name}</p>
                                  <p className="text-zinc-400">📞 Phone: {o.customerInfo.phone}</p>
                                  <p className="text-zinc-400">✉️ Email: {o.customerInfo.email}</p>
                                  <p className="text-zinc-400">📍 Address: {o.customerInfo.address}</p>
                                </div>

                                <div className="space-y-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                                  <span className="text-[10px] text-zinc-500 font-mono block uppercase">Advance Payment Slip Info</span>
                                  <p className="text-zinc-300">
                                    Method Sourced: <strong className="text-orange-400 uppercase">{o.paymentMethod}</strong>
                                  </p>
                                  <p className="text-zinc-300">
                                    Sender Phone / Account Details: <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded">{o.paymentDetails.accountNo || "No Details"}</span>
                                  </p>
                                  <p className="text-zinc-100">
                                    Transaction ID Reference: <span className="font-mono text-cyan-400 select-all font-bold tracking-widest uppercase bg-cyan-950/40 px-2.5 py-0.5 rounded">{o.paymentDetails.transactionId}</span>
                                  </p>
                                  {o.paymentDetails.note && (
                                    <p className="text-stone-400 italic font-sans">“{o.paymentDetails.note}”</p>
                                  )}
                                </div>
                              </div>

                              {/* Ordered Items Details list */}
                              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-850">
                                <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-2">Order Matrix Specifications</span>
                                <div className="space-y-2">
                                  {o.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs text-zinc-300 leading-normal">
                                      <div className="flex items-center gap-2">
                                        <img src={it.product.image} className="w-8 h-8 rounded bg-stone-900 object-cover" />
                                        <div>
                                          <span className="font-bold text-white">{it.product.name}</span>
                                          <span className="text-[10px] font-mono text-zinc-400 block">
                                            Color: {it.color} • Spec Storage: {it.storage}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="font-mono text-orange-405">
                                        {it.quantity}x • ৳ {it.product.price.toLocaleString("en-US")}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="border-t border-zinc-800 pt-2.5 flex justify-between items-center text-xs font-mono">
                                    <span className="text-zinc-400 font-semibold uppercase">Gross Sourced Value:</span>
                                    <span className="text-orange-500 text-sm font-bold">৳ {o.total.toLocaleString("en-US")} BDT</span>
                                  </div>
                                </div>
                              </div>

                              {/* Placed Payment Proof invoice preview */}
                              {o.paymentDetails.paymentProofBase64 && (
                                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-xs">
                                  <span className="text-[10px] text-zinc-500 font-mono block mb-2 uppercase">Uploaded Payment Slip Proof / Screenshot</span>
                                  <div className="max-w-xs border border-zinc-800 rounded overflow-hidden">
                                    <img
                                      src={o.paymentDetails.paymentProofBase64}
                                      alt="Payment attachment verification"
                                      className="w-full h-auto object-contain bg-zinc-900 max-h-[160px]"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: SYSTEM PAYMENT SETTINGS EDITOR CMS */}
                  {adminActiveTab === "settings" && settings && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-mono text-zinc-300">Editable Payment Accounts Numbers</h3>
                      <p className="text-xs text-zinc-405 leading-relaxed">
                        Change the mobile financial account coordinates in Bangladesh or bank specs directly. Normal customers will see changes live at checkout instantly.
                      </p>

                      <div className="bg-[#090909] p-5 rounded-2xl border border-zinc-850 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase">bKash Personal Wallet</label>
                            <input
                              type="text"
                              value={settings.paymentNumbers.bKash}
                              onChange={(e) =>
                                saveAdminSettings({
                                  ...settings,
                                  paymentNumbers: { ...settings.paymentNumbers, bKash: e.target.value }
                                })
                              }
                              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-xs text-white font-mono mt-1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase">Nagad Personal Wallet</label>
                            <input
                              type="text"
                              value={settings.paymentNumbers.Nagad}
                              onChange={(e) =>
                                saveAdminSettings({
                                  ...settings,
                                  paymentNumbers: { ...settings.paymentNumbers, Nagad: e.target.value }
                                })
                              }
                              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-xs text-white font-mono mt-1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase">Rocket Wallet Code</label>
                            <input
                              type="text"
                              value={settings.paymentNumbers.Rocket}
                              onChange={(e) =>
                                saveAdminSettings({
                                  ...settings,
                                  paymentNumbers: { ...settings.paymentNumbers, Rocket: e.target.value }
                                })
                              }
                              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-xs text-white font-mono mt-1"
                            />
                          </div>
                        </div>

                        {/* Bank Coordinates */}
                        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 space-y-3">
                          <span className="text-[11px] font-mono font-bold text-orange-400 block uppercase">
                            🏦 Direct Import Bank Account Details
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[9px] text-zinc-500 font-mono">Bank Name</label>
                              <input
                                type="text"
                                value={settings.paymentNumbers.bankTransfer.bankName}
                                onChange={(e) =>
                                  saveAdminSettings({
                                    ...settings,
                                    paymentNumbers: {
                                      ...settings.paymentNumbers,
                                      bankTransfer: { ...settings.paymentNumbers.bankTransfer, bankName: e.target.value }
                                    }
                                  })
                                }
                                className="w-full bg-[#080808] border border-zinc-820 p-2 rounded text-xs text-zinc-200 mt-1"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-zinc-500 font-mono">Account Name</label>
                              <input
                                type="text"
                                value={settings.paymentNumbers.bankTransfer.accountName}
                                onChange={(e) =>
                                  saveAdminSettings({
                                    ...settings,
                                    paymentNumbers: {
                                      ...settings.paymentNumbers,
                                      bankTransfer: { ...settings.paymentNumbers.bankTransfer, accountName: e.target.value }
                                    }
                                  })
                                }
                                className="w-full bg-[#080808] border border-zinc-820 p-2 rounded text-xs text-zinc-200 mt-1"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-zinc-500 font-mono">Account Number</label>
                              <input
                                type="text"
                                value={settings.paymentNumbers.bankTransfer.accountNo}
                                onChange={(e) =>
                                  saveAdminSettings({
                                    ...settings,
                                    paymentNumbers: {
                                      ...settings.paymentNumbers,
                                      bankTransfer: { ...settings.paymentNumbers.bankTransfer, accountNo: e.target.value }
                                    }
                                  })
                                }
                                className="w-full bg-[#080808] border border-zinc-820 p-2 rounded text-xs text-zinc-220 mt-1 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-zinc-500 font-mono">Branch Location</label>
                              <input
                                type="text"
                                value={settings.paymentNumbers.bankTransfer.branch}
                                onChange={(e) =>
                                  saveAdminSettings({
                                    ...settings,
                                    paymentNumbers: {
                                      ...settings.paymentNumbers,
                                      bankTransfer: { ...settings.paymentNumbers.bankTransfer, branch: e.target.value }
                                    }
                                  })
                                }
                                className="w-full bg-[#080808] border border-zinc-820 p-2 rounded text-xs text-zinc-220 mt-1"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Contact info edits */}
                        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 space-y-3">
                          <span className="text-[11px] font-mono font-bold text-orange-400 block uppercase">
                            📞 Contact & Map Details CMS Coordinator
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[9px] text-zinc-500 font-mono">Direct Help Helpline</label>
                              <input
                                type="text"
                                value={settings.contactInfo.phone}
                                onChange={(e) =>
                                  saveAdminSettings({
                                    ...settings,
                                    contactInfo: { ...settings.contactInfo, phone: e.target.value }
                                  })
                                }
                                className="w-full bg-[#080808] border border-zinc-820 p-2 rounded text-xs text-zinc-200 mt-1 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-zinc-500 font-mono">Telegram Username</label>
                              <input
                                type="text"
                                value={settings.contactInfo.telegram || ""}
                                onChange={(e) =>
                                  saveAdminSettings({
                                    ...settings,
                                    contactInfo: { ...settings.contactInfo, telegram: e.target.value }
                                  })
                                }
                                className="w-full bg-[#080808] border border-zinc-820 p-2 rounded text-xs text-zinc-205 mt-1 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-zinc-500 font-mono">WhatsApp link digits</label>
                              <input
                                type="text"
                                value={settings.contactInfo.whatsapp}
                                onChange={(e) =>
                                  saveAdminSettings({
                                    ...settings,
                                    contactInfo: { ...settings.contactInfo, whatsapp: e.target.value }
                                  })
                                }
                                className="w-full bg-[#080808] border border-zinc-820 p-2 rounded text-xs text-zinc-205 mt-1 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================== */
          /* ================== STORE FRONT VIEW ====================== */
          /* ========================================================== */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-12 text-zinc-100"
          >
            
            {/* HERO EXQUISITE INTERACTIVE GRID SHOWCASE */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-6">
              
              {/* Product Slogan Specs side heading */}
              <div className="lg:col-span-5 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="inline-block px-3 py-1 rounded bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-widest border border-orange-500/30"
                >
                  ⚡ Sovereign Hardware Direct Sourced 
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
                  className="text-4xl sm:text-6xl font-black leading-none tracking-tight text-white"
                >
                  UNLOCKED<br />
                  <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-indigo-500 bg-clip-text text-transparent">
                    SOVEREIGN CORE
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="text-stone-400 text-sm max-w-sm font-light leading-relaxed"
                >
                  Bypass high markups: authentic international Snapdragon premium models. Duty-cleared, delivered securely with real-time OTP checks and instant order verification.
                </motion.p>

                {/* Core trust chips */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-900"
                >
                  <div>
                    <span className="text-xl font-mono font-bold text-white block">100%</span>
                    <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Unlocked Global</span>
                  </div>
                  <div>
                    <span className="text-xl font-mono font-bold text-white block">Express</span>
                    <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Port Delivery</span>
                  </div>
                  <div>
                    <span className="text-xl font-mono font-bold text-white block">5% Safe</span>
                    <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Advance Deposit</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="pt-2 flex flex-wrap gap-3"
                >
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    href="#collection"
                    className="bg-orange-600 shadow-[0_4px_25px_rgba(249,115,22,0.3)] text-black px-7 py-3 rounded-full text-xs font-mono font-bold tracking-wider hover:bg-orange-500 transition-all inline-block uppercase"
                  >
                    EXPLORE HARDWARE VARIATIONS
                  </motion.a>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (products.length > 0) setSelectedProduct(products[0]);
                    }}
                    className="bg-[#0c0c0c] border border-zinc-800 text-zinc-300 hover:text-white px-5 py-3 rounded-full text-xs font-mono font-semibold hover:border-zinc-700 transition-all"
                  >
                    Quick Spec View
                  </motion.button>
                </motion.div>
              </div>

              {/* CENTER STAGE DRAGGABLE 3D LUXURY FRAME */}
              <div className="lg:col-span-7 relative flex items-center justify-center min-h-[500px]">
                
                {/* Visual Glassmorphism specification board float absolute */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                  className="absolute top-4 left-4 bg-white/[0.02] backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl max-w-[190px] text-left hidden sm:block z-20"
                >
                  <span className="text-[9px] text-zinc-500 uppercase font-mono block">Featured Core</span>
                  <p className="text-sm font-bold text-white mt-1">S24 Titanium Gray</p>
                  <p className="text-[10px] text-cyan-400 font-mono mt-1">100x Space Zoom</p>
                  
                  <div className="mt-4 flex gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-white/20 inline-block" />
                    <span className="w-3.5 h-3.5 rounded-full bg-neutral-400 inline-block" />
                    <span className="w-3.5 h-3.5 rounded-full bg-orange-600 inline-block" />
                  </div>
                </motion.div>

                {/* Visual right side spec bubble */}
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
                  className="absolute bottom-12 right-4 bg-[#090909]/90 border border-zinc-850 p-4 rounded-xl z-20 hidden sm:block text-right"
                >
                  <span className="text-[9px] text-zinc-500 leading-none block uppercase font-mono">Special Direct Clearance</span>
                  <span className="text-2xl font-bold font-mono text-orange-505 block mt-0.5">৳ 125,000</span>
                  <span className="text-[10px] text-lime-400 mt-1 block font-mono">✓ Free express silicon cover</span>
                </motion.div>

                <div className="w-full">
                  <ThreeDPhone color="Natural Titanium" neonGlowColor="orange" interactive={true} />
                </div>
              </div>
            </section>

            {/* FEATURED EXCLUSIVE PRODUCTS CATEGORY FILTER BAR */}
            <section id="collection" className="space-y-8 pt-6 border-t border-zinc-900">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
                <div className="w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">
                      Curated import catalogues
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight mt-1">
                    Exquisite Phone Variations
                  </h3>
                </div>

                {/* Mobile Specific Model Search Bar */}
                <div className="w-full md:hidden relative mt-1">
                  <input
                    type="text"
                    placeholder="Search premium models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0c0c0c] border border-zinc-800 rounded-2xl px-5 py-3 text-xs font-mono tracking-tight focus:outline-none focus:border-orange-500 transition-all placeholder:text-zinc-650 text-zinc-200"
                  />
                  <Search className="w-4 h-4 text-zinc-500 absolute right-4 top-3.5" />
                </div>

                {/* Categories filtering tabs with horizontal swipe scroll support */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:pb-0 md:mx-0 md:px-0 scroll-smooth snap-x w-[calc(100%+2rem)] md:w-auto shrink-0 select-none relative z-10">
                  {["All", "Flagship", "Gaming", "Exclusive", "Mid-Range"].map((cat) => {
                    const isActive = currentCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCurrentCategory(cat)}
                        className={`relative px-4 py-2 rounded-full text-xs font-mono tracking-tight transition-all uppercase shrink-0 snap-start overflow-hidden ${
                          isActive
                            ? "text-black font-bold"
                            : "bg-white/5 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="activeCategoryTag"
                            className="absolute inset-0 bg-orange-600 -z-10 rounded-full shadow-lg"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        {cat === "All" ? "ALL HARDWARE" : cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick sorting criteria */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-3 bg-zinc-950/50 px-4 rounded-xl border border-zinc-900 text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Showing {sortedProducts.length} Premium Options</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#0a0a0a] border border-zinc-850 px-3 py-1.5 text-xs text-zinc-300 rounded font-mono focus:outline-none"
                  >
                    <option value="default">Default Catalogue Order</option>
                    <option value="lowToHigh">Price: Low to Ultimate</option>
                    <option value="highToLow">Price: Ultimate to Low</option>
                    <option value="name">Alphanumeric Model Name</option>
                  </select>
                </div>
              </div>

              {/* PRODUCTS LIST GRID DISPLAY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sortedProducts.map((prod, pIdx) => {
                  const isInCompare = compareList.some((p) => p.id === prod.id);

                  return (
                    <motion.div
                      key={prod.id}
                      initial={{ opacity: 0, y: 35 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: Math.min(pIdx % 4 * 0.1, 0.4) }}
                      className="bg-zinc-950/40 border border-zinc-850/85 hover:border-zinc-800 rounded-2xl overflow-hidden flex flex-col group relative transition-all duration-300 hover:-translate-y-1.5"
                    >
                      {/* Badge Tags absolute */}
                      {prod.offerText && (
                        <div className="absolute top-3 left-3 bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 font-mono text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-md z-10 animate-pulse">
                          {prod.offerText}
                        </div>
                      )}

                      {/* Product catalog image block */}
                      <div className="aspect-square bg-slate-900 relative overflow-hidden flex items-center justify-center p-4">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover rounded-xl bg-stone-900 transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                          <button
                            onClick={() => setSelectedProduct(prod)}
                            className="bg-white text-black font-semibold text-xs py-2 px-4 rounded-full font-mono shadow-xl shrink-0 transition-transform active:scale-95"
                          >
                            Explore Specs
                          </button>
                        </div>
                      </div>

                      {/* Decriptive Content Section */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#080808]">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-[#f97316] uppercase font-bold">
                            {prod.stockStatus}
                          </span>
                          <h4 className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-1 mt-1">
                            {prod.name}
                          </h4>

                          {/* spec pills strip */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="bg-[#0f0f0f] border border-zinc-850 text-[9px] font-mono px-2 py-0.5 rounded text-zinc-400">
                              📷 {prod.specs.camera.split(" ")[0]}camera
                            </span>
                            <span className="bg-[#0f0f0f] border border-zinc-850 text-[9px] font-mono px-2 py-0.5 rounded text-zinc-400">
                              🔋 {prod.specs.battery.split(" ")[0]}mAh
                            </span>
                          </div>
                        </div>

                        {/* Pricing details & action */}
                        <div className="pt-2 border-t border-zinc-900 flex justify-between items-center bg-transparent mt-auto">
                          <div>
                            <span className="text-sm font-black font-mono text-white tracking-tight">
                              ৳ {prod.price.toLocaleString("en-US")} BDT
                            </span>
                            {prod.originalPrice && (
                              <span className="text-[10px] font-mono text-zinc-550 line-through block text-zinc-500">
                                ৳ {prod.originalPrice.toLocaleString("en-US")}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            {/* Compare checklist trigger */}
                            <button
                              onClick={() => toggleCompare(prod)}
                              className={`p-2 rounded text-xs transition-all ${
                                isInCompare
                                  ? "bg-amber-600 border border-amber-500 text-black"
                                  : "bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white"
                              }`}
                              title={isInCompare ? "Active in comparative matrix" : "Add to specs comparatives"}
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                addToCart(prod, prod.colors[0], prod.storageOptions[0]);
                              }}
                              className="bg-orange-600 hover:bg-orange-500 text-black p-2 rounded transition-all shrink-0 font-bold"
                              title="Express order setup"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* SPECS COMPARATIVE SHEET WORKSPACE DROPDOWN */}
            {isCompareOpen && compareList.length > 0 && (
              <section className="bg-zinc-950/80 border-2 border-amber-500/30 p-6 rounded-3xl space-y-4 animate-fade-in relative">
                <button
                  onClick={() => setIsCompareOpen(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="border-b border-zinc-800 pb-2">
                  <span className="text-xs font-mono text-stone-500 tracking-wider uppercase">
                    Interactive technical matrices comparison
                  </span>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    📱 Specs Competitors Compared ({compareList.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                  {/* Row headers names for desktop layout */}
                  <div className="hidden md:flex flex-col justify-end space-y-12 pb-6 text-zinc-500 uppercase font-semibold text-[10px]">
                    <div className="h-28 flex items-end">Core Device Model</div>
                    <div>Price Clearance</div>
                    <div>Processor Sourced</div>
                    <div>Image Capture Resolution</div>
                    <div>Battery Capacity</div>
                    <div>Direct Operating System</div>
                    <div>Handset Weight Parameters</div>
                  </div>

                  {/* Compared products display rows */}
                  {compareList.map((cp) => (
                    <div
                      key={cp.id}
                      className="bg-stone-900/40 p-4 rounded-xl border border-zinc-800 space-y-4 text-left relative"
                    >
                      <button
                        onClick={() => toggleCompare(cp)}
                        className="text-zinc-500 hover:text-rose-400 absolute top-2 right-2 flex items-center"
                        title="Remove device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Header core detail */}
                      <div className="h-28 flex flex-col justify-between">
                        <img src={cp.images[0]} alt={cp.name} className="w-16 h-16 rounded object-cover" />
                        <span className="text-xs font-bold text-white block truncate leading-tight mt-2">
                          {cp.name}
                        </span>
                      </div>

                      {/* specs items data grids */}
                      <div className="space-y-4 text-zinc-300">
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase md:hidden">Price</span>
                          <span className="text-orange-500 font-bold text-sm">৳ {cp.price.toLocaleString("en-US")}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase md:hidden">Processor</span>
                          <span className="text-zinc-200">{cp.specs.processor}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase md:hidden">Camera Specs</span>
                          <span className="text-zinc-200">{cp.specs.camera}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase md:hidden">Battery Specs</span>
                          <span className="text-zinc-200">{cp.specs.battery}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase md:hidden">Operating System</span>
                          <span className="text-zinc-200">{cp.specs.os || "Factory Clear"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase md:hidden">Weight Parameters</span>
                          <span className="text-zinc-200">{cp.specs.weight || "N/A"}</span>
                        </div>
                      </div>

                      {/* Add directly to checkout cart */}
                      <button
                        onClick={() => {
                          addToCart(cp, cp.colors[0], cp.storageOptions[0]);
                          setIsCompareOpen(false);
                        }}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-black text-xs font-mono font-bold py-2 rounded uppercase"
                      >
                        Add Selected Model
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}


          </motion.div>
        )}
      </main>

      {/* --- FOOTER REGISTRY --- */}
      <footer className="bg-stone-950/90 border-t border-zinc-900 px-8 py-10 mt-20 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-zinc-405 leading-relaxed">
          
          <div className="space-y-4">
            <h5 className="text-base font-black italic tracking-tight text-white/90">
              DARK<span className="font-light not-italic text-stone-200">CART BD</span>
            </h5>
            <p className="text-zinc-500 leading-relaxed font-light mt-2 max-w-xs">
              Direct unlocked secure smartphone imports into Bangladesh via Singapore channels. Zero carrier activation block locks. Sourced globally in clean original hardware.
            </p>
          </div>

          <div>
            <h6 className="text-[10px] font-mono tracking-wider font-extrabold text-white uppercase mb-3">
              About & Contact Info
            </h6>
            {settings && (
              <ul className="space-y-2 font-light text-zinc-400">
                <li>📞 Customer Helpline Support: {settings.contactInfo.phone}</li>
                <li>
                  ✈️ Telegram Username:{" "}
                  <a
                    href="https://t.me/theowner09"
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-500 hover:text-orange-400 font-mono font-bold hover:underline"
                  >
                    @theowner09
                  </a>
                </li>
              </ul>
            )}
          </div>

          <div>
            <h6 className="text-[10px] font-mono tracking-wider font-extrabold text-white uppercase mb-3">
              Cleance Channels
            </h6>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="bg-[#d81b60] text-white px-2.5 py-1 text-[10px] font-mono rounded font-bold uppercase">
                bKash
              </span>
              <span className="bg-[#f47216] text-white px-2.5 py-1 text-[10px] font-mono rounded font-bold uppercase">
                Nagad
              </span>
              <span className="bg-[#6a1b9a] text-white px-2.5 py-1 text-[10px] font-mono rounded font-bold uppercase">
                Rocket
              </span>
              <span className="bg-slate-900 text-zinc-300 px-2.5 py-1 text-[10px] font-mono rounded font-bold uppercase border border-white/10">
                City Bank API
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-end space-y-4">
            <div>
              <h6 className="text-[10px] font-mono tracking-wider font-extrabold text-white uppercase mb-3">
                Official Channels
              </h6>
              <div className="flex items-center gap-3">
                <a
                  href="https://t.me/theowner09"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-cyan-400 transition-all flex items-center gap-1.5"
                  title="Official Telegram Channel"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.32-2.74 7.59-3.27 3.61-1.5 4.36-1.76 4.85-1.77.11 0 .35.03.51.16.13.12.17.28.19.39.02.1.03.35.01.53z" />
                  </svg>
                  <span className="text-[10px] font-mono">Telegram</span>
                </a>
                <a
                  href="#"
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-pink-500 transition-all flex items-center gap-1.5"
                  title="Official TikTok"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.81-.74-3.94-1.69-.22-.19-.42-.38-.62-.59v6.52c-.02 2.57-1.07 5.08-3.04 6.66-1.89 1.56-4.51 2.21-6.88 1.74-2.37-.47-4.52-2.12-5.46-4.37-1.07-2.54-.73-5.59.88-7.85 1.5-2.13 4.14-3.29 6.74-2.92v4.09c-1.62-.27-3.32.25-4.29 1.58-.9 1.21-.86 2.97.09 4.09.95 1.15 2.61 1.56 3.99 1.01 1.21-.49 1.93-1.68 1.95-2.98l-.01-13.51z" />
                  </svg>
                  <span className="text-[10px] font-mono">TikTok</span>
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-600 block">
                © 2026 DARKCART Ltd. Sourced Singapore.
              </span>
              <button
                onClick={() => {
                  setIsAdminMode(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-zinc-850 hover:text-orange-500 transition-all opacity-40 hover:opacity-100"
                title="Admin System"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Product Details Full Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#090909] border border-zinc-800 rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-8 space-y-6 relative max-h-[96vh] sm:max-h-[92vh] overflow-y-auto"
            >
            
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 bg-zinc-900 text-zinc-400 p-2 rounded-full hover:text-white hover:bg-zinc-800 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
              
              {/* Images selection columns */}
              <div className="space-y-4">
                <div className="aspect-[5/6] bg-slate-900 rounded-2xl overflow-hidden border border-zinc-800">
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {selectedProduct.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-[#0b0b0b] rounded-lg border border-zinc-850 p-1 cursor-pointer hover:border-orange-500 overflow-hidden"
                    >
                      <img src={img} className="w-full h-full object-cover rounded" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product descriptorsspecs */}
              <div className="space-y-6">
                
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase font-bold">
                    Category: {selectedProduct.category}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 leading-tight">
                    {selectedProduct.name}
                  </h3>
                  <div className="text-2xl font-mono text-orange-550 font-bold tracking-tight text-orange-550 mt-2 text-orange-400">
                    ৳ {selectedProduct.price.toLocaleString("en-US")} BDT
                  </div>
                </div>

                <p className="text-xs text-zinc-400 font-light leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-850/60">
                  {selectedProduct.description}
                </p>

                {/* Technical specification map */}
                <div className="space-y-3 font-mono">
                  <span className="text-[10px] text-zinc-500 uppercase font-black block pb-1 border-b border-zinc-850">
                    🔩 Hardware Specification Coordinates
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-[11px] leading-snug">
                    <div className="p-2.5 bg-[#0f0f0f] border border-zinc-880/40 rounded-lg">
                      <span className="text-[#9ea4ad] text-[9px] block">Processor</span>
                      <p className="text-zinc-200 font-semibold mt-0.5">{selectedProduct.specs.processor}</p>
                    </div>
                    <div className="p-2.5 bg-[#0f0f0f] border border-zinc-880/40 rounded-lg">
                      <span className="text-[#9ea4ad] text-[9px] block">Camera array</span>
                      <p className="text-zinc-200 font-semibold mt-0.5">{selectedProduct.specs.camera}</p>
                    </div>
                    <div className="p-2.5 bg-[#0f0f0f] border border-zinc-880/40 rounded-lg">
                      <span className="text-[#9ea4ad] text-[9px] block">Battery Capacity</span>
                      <p className="text-zinc-200 font-semibold mt-0.5">{selectedProduct.specs.battery}</p>
                    </div>
                    <div className="p-2.5 bg-[#0f0f0f] border border-zinc-880/40 rounded-lg">
                      <span className="text-[#9ea4ad] text-[9px] block">Screen Type</span>
                      <p className="text-zinc-200 font-semibold mt-0.5">{selectedProduct.specs.screen}</p>
                    </div>
                    {selectedProduct.specs.os && (
                      <div className="p-2.5 bg-[#0f0f0f] border border-zinc-880/40 rounded-lg col-span-2">
                        <span className="text-[#9ea4ad] text-[9px] block">Operating System OS</span>
                        <p className="text-zinc-200 font-semibold mt-0.5">{selectedProduct.specs.os}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Color swatches and Storage setups */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block uppercase mb-2">Available Colors</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.colors.map((col, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1.5 bg-[#0d0d0d] border border-zinc-800 text-zinc-300 rounded text-[10px] block"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase mb-2">Internal Storage options</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.storageOptions.map((st, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1.5 bg-[#0d0d0d] border border-zinc-800 text-zinc-300 rounded text-[10px] block"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Advance instruction note */}
                <div className="bg-yellow-950/25 border border-yellow-805/30 px-4 py-3 rounded-xl text-yellow-405 text-xs font-sans leading-relaxed">
                  💡 <strong>Deposit Cleared Delivery</strong>: Pay 5% of direct checkout BDT values, upload proof of dynamic bKash/Nagad txn, and our Banani import agents will ship securely within 24 hours. Full duty cleared!
                </div>

                {/* Checkout selection actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      addToCart(selectedProduct, selectedProduct.colors[0], selectedProduct.storageOptions[0]);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-black text-xs font-mono font-bold py-3.5 rounded-full uppercase tracking-widest transition-all"
                  >
                    ADD TO MY PREMIUM CART
                  </button>
                  {settings?.contactInfo?.whatsapp && (
                    <a
                      href={`https://wa.me/${settings.contactInfo.whatsapp}?text=Hello+DARKCART+I+am+interested+in+the+exquisite+hardware+model:+${encodeURIComponent(selectedProduct.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-black px-5 py-3 rounded-full flex items-center justify-center transition-all shadow-md"
                    >
                      <Phone className="w-4 h-4 text-black fill-black" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Cashout Premium Bag */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#090909] border-l border-zinc-800 w-full max-w-md h-[100dvh] sm:h-full flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.85)] relative"
            >
            
            {/* Slide Header */}
            <div className="p-4 sm:p-5 bg-stone-900/30 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/20">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 font-mono tracking-tight uppercase">
                  My Sourced Hardware Bag
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-zinc-600 text-xs italic">
                  Your premium hardware container is currently empty. Sourced models will show up here.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-950 p-4 rounded-xl border border-zinc-850/80 flex gap-4 text-xs relative"
                  >
                    <button
                      onClick={() => updateCartQty(idx, -100)} // wipes out
                      className="text-zinc-600 hover:text-rose-450 absolute top-2 right-2 transition-all"
                      title="Wipe entry"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-white line-clamp-1">{item.product.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Color: {item.color} • Spec Storage: {item.storage}
                      </p>
                      
                      {/* Qty and price controllers */}
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQty(idx, -1)}
                            className="p-1 bg-stone-900 rounded text-zinc-400"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-zinc-200">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(idx, 1)}
                            className="p-1 bg-stone-900 rounded text-zinc-400"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-mono text-orange-500 font-bold">
                          ৳ {(item.product.price * item.quantity).toLocaleString("en-US")} BDT
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Slide Footer */}
            <div className="p-4 sm:p-5 bg-stone-900/30 border-t border-zinc-900/80 space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-[500] text-zinc-500 font-semibold uppercase">Gross Checklist value:</span>
                <span className="text-orange-505 text-base sm:text-lg font-black text-orange-400">
                  ৳ {cartTotal.toLocaleString("en-US")} BDT
                </span>
              </div>

              {cart.length > 0 ? (
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-black text-xs font-mono font-bold py-3.5 rounded-full uppercase tracking-wider transition-all"
                >
                  PROCEED TO ADVANCE REGISTER CHECK
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-zinc-900 text-zinc-600 text-xs font-mono py-3.5 rounded-full uppercase cursor-not-allowed"
                >
                  CART IS EMPTY
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Secure Advance Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/98 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#090909] border border-zinc-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-8 space-y-6 relative max-h-[96vh] sm:max-h-[92vh] overflow-y-auto"
            >
            
            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                setPlacedOrderResult(null);
                setOtpSent(false);
                setIsOtpVerified(false);
                setOtpCode("");
              }}
              className="absolute top-4 right-4 bg-zinc-900 text-zinc-400 p-2 rounded-full hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {placedOrderResult ? (
              /* Success confirmation view */
              <div className="text-center py-8 space-y-4 animate-fade-in text-zinc-100 font-sans">
                <div className="w-16 h-16 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                  ✓
                </div>
                <h3 className="text-xl font-extrabold tracking-tight">Advance Payment Slip Registered!</h3>
                <div className="text-sm font-mono text-zinc-300">
                  Transaction Checking Ticket Reference: <strong className="text-cyan-400 select-all font-bold tracking-widest">{placedOrderResult}</strong>
                </div>
                <p className="text-zinc-500 text-xs leading-normal max-w-md mx-auto">
                  Our Banani duty checkout agents have queued this transaction into City Bank PLC / mobile clearing registry list. We will send full global tracking details shortly to {checkoutEmail}!
                </p>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setPlacedOrderResult(null);
                    }}
                    className="bg-orange-600 text-black font-semibold font-mono text-xs px-6 py-3 rounded-full uppercase tracking-wider active:scale-95 transition-all"
                  >
                    Return to Storefront
                  </button>
                  {settings?.contactInfo?.whatsapp && (
                    <a
                      href={`https://wa.me/${settings.contactInfo.whatsapp}?text=Hello+DARKCART+I+just+registered+Advance+receipt+index:+${placedOrderResult}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#25d366] text-black hover:bg-emerald-500 font-semibold font-mono text-xs px-6 py-3 rounded-full flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span>Share on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* Interactive checkout wizard steps */
              <div className="space-y-6 leading-relaxed">
                
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight pb-3 border-b border-zinc-850">
                  💳 Premium Port Advance Clearance Checkout
                </h3>

                {/* Secure OTP Identity certification block */}
                {!isOtpVerified ? (
                  <div className="bg-[#0e0e0e] p-4 sm:p-5 rounded-2xl border border-zinc-850 space-y-4 font-sans">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                      <Lock className="w-4 h-4" />
                      <span>STEP 1: IDENTITY EMAIL AUDIT VERIFICATION SIMULATOR</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-normal">
                      DARKCART enforces strict secure ordering. Please authenticate your active email address with system Simulated OTP code.
                    </p>

                    {!otpSent ? (
                      <div className="space-y-3">
                        <label className="block text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                          Recipient Email Address
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            value={checkoutEmail}
                            onChange={(e) => setCheckoutEmail(e.target.value)}
                            placeholder="e.g. client@example.com"
                            className="bg-stone-950 border border-zinc-805 px-4 py-3 text-xs rounded-xl flex-1 text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={reqOtpVerification}
                            disabled={otpLoading}
                            className="bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold px-5 py-3 rounded-xl transition-all active:scale-95 shrink-0"
                          >
                            {otpLoading ? "Sending..." : "Request Code"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-zinc-500 uppercase">
                            SIMULATED RECEIVED PIN (Check Active Simulation Logs Panel)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="Type 6-digit pin"
                              className="bg-[#080808] border border-zinc-800 px-4 py-3 text-xs text-white uppercase rounded-xl font-mono text-center tracking-widest w-full sm:w-44 focus:outline-none focus:border-cyan-500 transition-all"
                              required
                            />
                            <button
                              type="button"
                              onClick={submitOtpVerify}
                              disabled={otpLoading}
                              className="bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold px-5 py-3 rounded-xl transition-all active:scale-95"
                            >
                              Verify OTP Now
                            </button>
                          </div>
                        </div>

                        {/* Development mode helper */}
                        {devCodeSuggested && (
                          <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-xs font-mono leading-relaxed text-cyan-300">
                            💡 {devCodeSuggested} Sourced Token for Client Checkout. Copy and verify.
                          </div>
                        )}
                      </div>
                    )}

                    {otpError && (
                      <p className="text-xs text-rose-400 font-mono">⚠️ {otpError}</p>
                    )}
                  </div>
                ) : (
                  /* Step 2: Information and payment submission details form */
                  <form onSubmit={finalizeOrderSubmit} className="space-y-6">
                    
                    {/* Sum values stats */}
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="text-zinc-[550] text-zinc-500 uppercase block font-semibold text-[10px]">Cart Gross Elements List Total</span>
                        <span className="text-white font-bold">{cart.length} handsets variations</span>
                      </div>
                      <span className="text-orange-500 text-base sm:text-lg font-bold">৳ {cartTotal.toLocaleString("en-US")} BDT</span>
                    </div>

                    {/* Delivery Form parameters */}
                    <div className="bg-stone-900/40 p-4 sm:p-5 rounded-2xl border border-zinc-855 space-y-4">
                      <span className="text-xs font-mono font-semibold text-orange-400 block uppercase">
                        📦 Delivery Specifications Coordinates
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-zinc-500 font-mono mb-1 uppercase">Full Human Name</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. Tazminul Islam"
                            className="bg-[#050505] border border-zinc-800 focus:border-orange-500 px-3 py-2.5 text-xs text-zinc-200 mt-1 rounded-xl w-full focus:outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-mono mb-1 uppercase">Target Phone Contact</label>
                          <input
                            type="text"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="e.g. +880 1711-223344"
                            className="bg-[#050505] border border-zinc-800 focus:border-orange-500 px-3 py-2.5 text-xs text-zinc-200 mt-1 rounded-xl w-full focus:outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-mono mb-1 uppercase">Sourced Delivery address</label>
                          <input
                            type="text"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            placeholder="e.g. Block C, Gulshan Avenue, Dhaka"
                            className="bg-[#050505] border border-zinc-800 focus:border-orange-500 px-3 py-2.5 text-xs text-zinc-200 mt-1 rounded-xl w-full focus:outline-none transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* bKash/Nagad advance receipt verification fields */}
                    <div className="bg-zinc-950/40 p-4 sm:p-5 rounded-2xl border border-zinc-855 space-y-4 font-sans text-xs">
                      <span className="text-xs font-mono font-semibold text-[#f97316] block uppercase">
                        💸 5% ADVANCE DEPOSIT ATTACHMENT DETAILS
                      </span>

                      {/* Payment Accounts Guide values from settings CMS */}
                      {settings && (
                        <div className="p-3 bg-[#0c0c0c] border border-zinc-850 rounded-xl space-y-2">
                          <span className="text-[10px] text-zinc-500 uppercase font-mono block">ActiveDARKCART Wallets Coordinates</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300 font-mono leading-normal">
                            <p>📱 Bkash (Personal): <span className="text-stone-100 select-all">{settings.paymentNumbers.bKash}</span></p>
                            <p>📱 Nagad (Personal): <span className="text-stone-100 select-all">{settings.paymentNumbers.Nagad}</span></p>
                            <p>📱 Rocket: <span className="text-stone-100 select-all">{settings.paymentNumbers.Rocket}</span></p>
                            <p>🏦 Bank: <span className="text-stone-100 font-bold block">{settings.paymentNumbers.bankTransfer.bankName}</span> Account: <span className="text-zinc-[205] block select-all">{settings.paymentNumbers.bankTransfer.accountNo}</span></p>
                          </div>
                        </div>
                      )}

                      {/* Selector strip */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono text-zinc-500 uppercase">Selected Channel</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(["bKash", "Nagad", "Rocket", "Bank Transfer"] as any[]).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setSelectedPaymentMethod(method)}
                              className={`w-full py-2.5 rounded-xl text-[11px] font-bold font-mono transition-all border ${
                                selectedPaymentMethod === method
                                  ? "bg-orange-600 border-orange-500 text-black shadow-lg shadow-orange-600/10"
                                  : "bg-[#0b0b0b] border-zinc-820 text-zinc-400"
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Verification values */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-zinc-550 font-mono mb-1 uppercase">Sender Wallet Account # Details</label>
                          <input
                            type="text"
                            value={senderAccountNo}
                            onChange={(e) => setSenderAccountNo(e.target.value)}
                            placeholder="e.g. 01711223344"
                            className="bg-[#050505] border border-zinc-800 px-3 py-2 text-xs font-mono text-white rounded w-full"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-550 font-mono mb-1 uppercase">Transaction Index ID (TxnID)</label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="e.g. BZ9723A9X82"
                            className="bg-[#050505] border border-zinc-800 px-3 py-2 text-xs font-mono text-white rounded w-full uppercase tracking-wider"
                            required
                          />
                        </div>
                      </div>

                      {/* Base64 Upload widget with drag & drop support */}
                      <div className="space-y-2">
                        <label className="block text-[10px] text-zinc-550 font-mono uppercase">Upload Payment Screenshot / Invoice slip</label>
                        <div
                          className="border border-dashed border-zinc-800 p-6 rounded-xl text-center bg-[#070707] hover:bg-zinc-950 cursor-pointer transition-all"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files[0]) handleImageUpload(files[0]);
                            };
                            input.click();
                          }}
                        >
                          <ImageIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                          <p className="text-[11px] text-zinc-400 font-light">
                            Click or Drag-and-drop receipt image to attach invoice verification details
                          </p>
                          {proofImageBase64 ? (
                            <span className="inline-block mt-2 bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded text-[10px] font-mono">
                              ✓ Slip Sourced Successfully Base64
                            </span>
                          ) : (
                            <span className="inline-block mt-2 text-[10px] font-mono text-zinc-650 text-zinc-500">
                              (JPG, PNG formats supported)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Optional Note */}
                      <div>
                        <label className="block text-[10px] text-zinc-550 font-mono uppercase mb-1">Order Custom Note (Optional)</label>
                        <textarea
                          rows={2}
                          value={orderNote}
                          placeholder="e.g. Please verify immediately for dispatch in same day express courier."
                          onChange={(e) => setOrderNote(e.target.value)}
                          className="bg-[#050505] border border-zinc-800 px-3 py-2 text-xs text-white rounded w-full"
                        />
                      </div>
                    </div>

                    {/* Finalize triggers */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCheckoutOpen(false);
                          setPlacedOrderResult(null);
                        }}
                        className="px-6 py-3.5 bg-stone-900 text-zinc-400 font-mono text-xs rounded-full uppercase"
                      >
                        Discard Setup
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingOrder}
                        className="flex-1 bg-orange-600 hover:bg-orange-500 text-black text-xs font-mono font-bold py-3.5 rounded-full uppercase tracking-wider transition-all shadow-[0_4px_25px_rgba(249,115,22,0.3)]"
                      >
                        {isSubmittingOrder ? "Registering Transaction Check..." : "SUBMIT ORDER CLEARED DISPATCH"}
                      </button>
                    </div>

                  </form>
                )}
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TELEMETRY AND SECURE OTP CODES LOGGER WIDGET --- */}
      <NotificationPanel />

    </div>
  );
}
