import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Product, Order, SiteSettings } from "./src/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-create the directory for base DB storage
const dbDir = path.join(process.cwd(), "data");
const dbPath = path.join(dbDir, "db.json");

// Ensure the data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Global active OTP memory storage
const otpStore = new Map<string, { code: string; expires: number }>();

// Default copyright-free product specifications
const defaultProducts: Product[] = [
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max (Active Titanium)",
    price: 138000,
    originalPrice: 145000,
    description: "Premium global active Snapdragon-modem international model. Sourced directly via Singapore and Hong Kong border networks. Pristine titanium durability, unmatched triple optical-zoom sensor array.",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600"
    ],
    colors: ["Natural Titanium", "Midnight Blue", "Space Black"],
    storageOptions: ["256GB Ultimate", "512GB Ultra-Max", "1TB Sovereign"],
    specs: {
      camera: "48MP Triple-Sensor OIS Super-Wide 5x Zoom",
      battery: "4441 mAh with 25W Fast Charge Direct",
      processor: "A17 Pro Bionic 3nm Neural Core",
      screen: "6.7-inch Super Retina XDR OLED 120Hz ProMotion",
      weight: "221g Premium Lightweight",
      os: "iOS 17 Direct App store"
    },
    stockStatus: "In Stock",
    isExclusive: true,
    featured: true,
    offerText: "🔥 ৳7,000 Flash Discount!",
    category: "Exclusive"
  },
  {
    id: "galaxy-s24-ultra",
    name: "Galaxy S24 Ultra (Titanium Master)",
    price: 125000,
    originalPrice: 132000,
    description: "The peak of mobile productivity. Sourced direct from Dubai & Malaysia border networks. Fully unlocked global Snapdragon 8 Gen 3 for Galaxy, complete with integrated Bluetooth S-Pen stylus.",
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600"
    ],
    colors: ["Titanium Gray", "Titanium Yellow", "Titanium Violet"],
    storageOptions: ["256GB High-Speed", "512GB Sovereign Pro"],
    specs: {
      camera: "200MP Quad-Pixel Laser AF 100x Space Zoom",
      battery: "5000 mAh Intelligent Super-Fast 45W 2.0",
      processor: "Snapdragon 8 Gen 3 (Galaxy Premium Core)",
      screen: "6.8-inch Dynamic AMOLED 2X QHD+ 120Hz Flat Screen",
      weight: "232g Solid Shield",
      os: "Android 14 with One UI 6.1"
    },
    stockStatus: "In Stock",
    isExclusive: false,
    featured: true,
    offerText: "✨ Core Specs Leader!",
    category: "Flagship"
  },
  {
    id: "oneplus-12-global",
    name: "OnePlus 12 (Global OxygenOS Pro)",
    price: 78500,
    originalPrice: 84000,
    description: "Hasselblad Camera for Mobile 4.0 setup. Direct import via mainland channels. Includes clean Global OxygenOS firmware. Ultra fast charging that takes only 26 minutes to full.",
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600"
    ],
    colors: ["Emerald Green", "Silky Black"],
    storageOptions: ["256GB Dual-Split", "512GB Supreme Speed"],
    specs: {
      camera: "LYT-808 50MP Sony Pro Portrait + 64MP Periscope",
      battery: "5400 mAh Dual-Cell 100W SUPERVOOC Charge",
      processor: "Snapdragon 8 Gen 3 Hyper-Core Architecture",
      screen: "6.82-inch 2K Oriental AMOLED ProXDR 4500 nits Peak",
      weight: "220g Ergonomic Curve",
      os: "OxygenOS Pure Global"
    },
    stockStatus: "Limited Stock",
    isExclusive: false,
    featured: true,
    offerText: "⚡ 100W SuperVOOC Charger Inbox!",
    category: "Mid-Range"
  },
  {
    id: "rog-phone-8-pro",
    name: "Asus ROG Phone 8 Pro (Ultimate Gaming)",
    price: 105000,
    originalPrice: 110000,
    description: "The dream of competitive mobile gamers. Features active internal liquid vapor cooling grids and mechanical AirTriggers for absolute control. Anime Vision LED programmable rear screen.",
    images: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600"
    ],
    colors: ["Phantom Black Edition"],
    storageOptions: ["512GB Game-Max", "1TB Pro Overkill"],
    specs: {
      camera: "50MP Gimbal Stabilizer Triple Sensor Array",
      battery: "5500 mAh Dual Battery with 65W HyperCharge",
      processor: "Snapdragon 8 Gen 3 (Overclocked Aero-Core)",
      screen: "6.78-inch Samsung Flexible AMOLED 165Hz LTPO",
      weight: "225g Shield Build",
      os: "ROG UI Android Gaming Skin"
    },
    stockStatus: "In Stock",
    isExclusive: true,
    featured: false,
    offerText: "🎮 Cyber Gaming Bundle Included!",
    category: "Gaming"
  }
];

const defaultSettings: SiteSettings = {
  paymentNumbers: {
    bKash: "01789-554433 (Personal-Bkash)",
    Nagad: "01822-998844 (Personal-Nagad)",
    Rocket: "01933-221144-8 (Personal-Rocket)",
    bankTransfer: {
      bankName: "City Bank Bangladesh PLC",
      accountName: "DARKCART Tech Import",
      accountNo: "1102983748293021",
      branch: "Dhaka Banani Branch"
    }
  },
  banners: [
    {
      id: "b1",
      title: "BORDER-CROSS SOVEREIGN PREMIUM IMPORTS",
      subtitle: "The ultimate premium smartphones sourced via global border-free channels. Zero activation locks. Full custom-duty cleared.",
      image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=1200",
      link: "#collection",
      active: true
    }
  ],
  offers: [
    {
      id: "o1",
      title: "PREDELIVERY DISCOUNT",
      description: "Pay 5% advance of BDT 5,000+ orders to unlock express courier-direct routing with live tracking link.",
      code: "DARKADVANCE",
      discountPercent: 5,
      active: true
    }
  ],
  reviews: [
    {
      id: "r1",
      name: "Tanzim Rahat",
      rating: 5,
      comment: "Absolutely outstanding border-cross delivery. Solved the Apple activation lock within 2 hours. Handled nicely with express secure drop from Chittagong port. Highly recommended shop!",
      date: "2026-05-18",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      phoneModel: "iPhone 15 Pro Max Natural Titanium"
    },
    {
      id: "r2",
      name: "Sajjad Al-Amin",
      rating: 5,
      comment: "Got my ASUS ROG Phone 8 Pro, completely factory unlocked, works flawlessly with custom-cooling fan accessories. Payment via Nagad was rapid and order validation was done in 10 minutes.",
      date: "2026-05-14",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
      phoneModel: "ROG Phone 8 Pro 1TB Version"
    }
  ],
  contactInfo: {
    address: "Block B, Holding 44/C, Banani Avenue, Dhaka, Bangladesh",
    phone: "+880 1888-009944",
    email: "support@darkcart.com",
    whatsapp: "+8801888009944",
    facebook: "https://facebook.com/darkcart.bd",
    telegram: "@theowner09"
  }
};

const defaultOrders: Order[] = [];

// Initialize data if database does not exist
let database: {
  products: Product[];
  settings: SiteSettings;
  orders: Order[];
};

if (!fs.existsSync(dbPath)) {
  database = {
    products: defaultProducts,
    settings: defaultSettings,
    orders: defaultOrders
  };
  fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
} else {
  try {
    const fileContent = fs.readFileSync(dbPath, "utf-8");
    database = JSON.parse(fileContent);
    // Safety check fields
    if (!database.products) database.products = defaultProducts;
    if (!database.settings) database.settings = defaultSettings;
    if (!database.orders) database.orders = defaultOrders;
  } catch (e) {
    console.error("Failed to parse db.json, resetting database to defaults", e);
    database = {
      products: defaultProducts,
      settings: defaultSettings,
      orders: defaultOrders
    };
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
  }
}

// Function to write back into db.json
function saveDatabase() {
  fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Endpoints: Products
  app.get("/api/products", (req, res) => {
    res.json(database.products);
  });

  app.get("/api/products/:id", (req, res) => {
    const product = database.products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  });

  app.post("/api/products", (req, res) => {
    const newProduct: Product = req.body;
    if (!newProduct.id || !newProduct.name || !newProduct.price) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Check if ID is matching existing
    const index = database.products.findIndex((p) => p.id === newProduct.id);
    if (index !== -1) {
      // Overwrite or error
      database.products[index] = newProduct;
    } else {
      database.products.push(newProduct);
    }
    saveDatabase();
    res.status(201).json(newProduct);
  });

  app.put("/api/products/:id", (req, res) => {
    const updatedProduct = req.body;
    const index = database.products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found to update" });
    }
    // Retain existing ID
    updatedProduct.id = req.params.id;
    database.products[index] = { ...database.products[index], ...updatedProduct };
    saveDatabase();
    res.json(database.products[index]);
  });

  // Fallback POST endpoint for updating products to ensure seamless operations
  app.post("/api/products/:id", (req, res) => {
    const updatedProduct = req.body;
    const index = database.products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found to update" });
    }
    updatedProduct.id = req.params.id;
    database.products[index] = { ...database.products[index], ...updatedProduct };
    saveDatabase();
    res.json(database.products[index]);
  });

  app.delete("/api/products/:id", (req, res) => {
    const initialLength = database.products.length;
    database.products = database.products.filter((p) => p.id !== req.params.id);
    if (database.products.length === initialLength) {
      return res.status(404).json({ error: "Product not found for deletion" });
    }
    saveDatabase();
    res.json({ success: true, message: "Product deleted successfully" });
  });

  // API Endpoints: Orders
  app.get("/api/orders", (req, res) => {
    res.json(database.orders);
  });

  app.get("/api/orders/:id", (req, res) => {
    const order = database.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order details not found" });
    }
    res.json(order);
  });

  app.post("/api/orders", (req, res) => {
    const newOrder: Order = req.body;
    if (!newOrder.customerInfo || !newOrder.items || newOrder.items.length === 0) {
      return res.status(400).json({ error: "Incomplete order specifications" });
    }
    // Generate order ID
    const nanoId = "DC-" + Math.floor(100000 + Math.random() * 900000);
    newOrder.id = nanoId;
    newOrder.status = "Pending Check";
    newOrder.createdAt = new Date().toISOString();
    database.orders.unshift(newOrder); // Add to beginning of records
    saveDatabase();
    res.status(201).json(newOrder);
  });

  app.put("/api/orders/:id/status", (req, res) => {
    const { status } = req.body;
    const index = database.orders.findIndex((o) => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }
    database.orders[index].status = status;
    saveDatabase();
    res.json(database.orders[index]);
  });

  // API Endpoint: Order cancellation & absolute deletion purge
  app.delete("/api/orders/:id", (req, res) => {
    const initialLength = database.orders.length;
    database.orders = database.orders.filter((o) => o.id !== req.params.id);
    if (database.orders.length === initialLength) {
      return res.status(404).json({ error: "Order log files not found for purge" });
    }
    saveDatabase();
    res.json({ success: true, message: "Customer order purged from system records cleanly." });
  });

  // API Endpoints: Dynamic Settings CMS
  app.get("/api/settings", (req, res) => {
    res.json(database.settings);
  });

  app.put("/api/settings", (req, res) => {
    const updatedSettings = req.body;
    database.settings = { ...database.settings, ...updatedSettings };
    saveDatabase();
    res.json(database.settings);
  });

  // API Endpoints: Simulated Admin Auth
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "Theowner009" && password === "3366") {
      res.json({ success: true, token: "ADMIN-AUTHENTICATED-DARKCART-SESSION" });
    } else {
      res.status(401).json({ error: "Invalid owner username or secret pin" });
    }
  });

  // API Endpoints: Simulated OTP with Email trigger
  app.post("/api/auth/otp", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    otpStore.set(email, { code: verificationCode, expires: expiresAt });

    // Print active log simulation in server console
    console.log(`\n=================== OTP REGISTRY SERVER ===================`);
    console.log(`[EMAIL SEND simulation] Target: ${email}`);
    console.log(`[CODE GENERATED] PIN: ${verificationCode}`);
    console.log(`===========================================================\n`);

    // Log internally for development widget display query
    const otpMsg = `🔔 OTP SENT: Sourced secure verification token [${verificationCode}] to email: ${email}`;
    fs.appendFileSync(path.join(dbDir, "otp_log.txt"), `[${new Date().toISOString()}] ${otpMsg}\n`);

    res.json({
      success: true,
      message: `Simulated OTP email pushed successfully to ${email}.`,
      developmentCode: verificationCode // Expose code to client development mode so it verifies out of the box seamlessly!
    });
  });

  app.post("/api/auth/otp/verify", (req, res) => {
    const { email, code } = req.body;
    const stored = otpStore.get(email);
    if (!stored) {
      return res.status(400).json({ error: "No OTP request active for this email address" });
    }
    if (stored.expires < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ error: "Verification code has expired" });
    }
    if (stored.code !== code) {
      return res.status(400).json({ error: "Incorrect verification code. Access denied" });
    }

    // Success
    otpStore.delete(email);
    res.json({ success: true, message: "Email verification successful." });
  });

  // Fetch development OTP simulation logs for the UI console popup
  app.get("/api/dev-logs", (req, res) => {
    const logFilePath = path.join(dbDir, "otp_log.txt");
    if (fs.existsSync(logFilePath)) {
      const logsContent = fs.readFileSync(logFilePath, "utf-8");
      // return last 15 lines split
      const lines = logsContent.trim().split("\n").slice(-15);
      return res.json({ logs: lines });
    }
    res.json({ logs: ["No server activity logs generated yet. Trigger an OTP request!"] });
  });

  // Vite Integration Middlewares block
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DARKCART Server booting successfully on port ${PORT}`);
  });
}

startServer();
