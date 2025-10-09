// index.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts";
import citizenRoutes from "./routes/citizenRoutes.js";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pool from "./config/db.js";

// Import API routes
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profileRoutes.js";
import requestsRoutes from "./routes/requestsRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import officerRoutes from "./routes/officerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import deptHeadRoutes from "./routes/dept-headRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Helpers for ES Modules (__dirname replacement)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); // default layout file = views/layout.ejs

// ✅ Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Session configuration (FIXED for production)
// ✅ Session configuration (FIXED for Render.com)
const PostgresSessionStore = pgSession(session);
app.use(
  session({
    store: new PostgresSessionStore({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true, // Add this line
    }),
    secret: process.env.SESSION_SECRET || "please_change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // ⚠️ CHANGE TO FALSE for Render.com
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: "lax",
    },
    name: "egov.sid", // Explicit session name
  })
);
app.use((req, res, next) => {
  console.log("🔍 Session Debug:", {
    sessionID: req.sessionID,
    hasUser: !!req.session.user,
    user: req.session.user,
    path: req.path,
    method: req.method,
  });
  next();
});

// =======================
// ✅ API ROUTES
// =======================
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/requests", requestsRoutes);
app.use("/api", documentRoutes);
app.use("/payments", paymentRoutes);
app.use("/notifications", notificationsRoutes);

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount admin and department head routes
app.use("/admin", adminRoutes);

// =======================
// ✅ FRONTEND ROUTES (EJS)
// =======================

// Home Page
app.get("/", (req, res) => {
  res.render("home", { title: "Home" });
});

// Auth pages
app.get("/login", (req, res) => {
  const success = req.query.success;
  res.render("auth/login", {
    title: "Login",
    successMessage: success ? "Registered successfully! Please log in." : null,
  });
});

app.get("/register", (req, res) => {
  res.render("auth/register", { title: "Register" });
});

// ✅ Citizen and Officer routes
app.use("/citizen", citizenRoutes);
app.use("/officer", officerRoutes);
app.use("/dept-head", deptHeadRoutes);
// =======================
// ✅ LOGOUT ROUTE
// =======================
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Error destroying session:", err);
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login");
  });
});

// =======================
// ✅ ERROR HANDLING
// =======================

// 404 handler
// =======================
// ✅ ERROR HANDLING
// =======================

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist.",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).render("error", {
    title: "Server Error",
    message: "Something went wrong. Please try again later.",
  });
});

// =======================
// ✅ START SERVER
// =======================
app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode`
  );
  console.log(`📍 Local: http://localhost:${PORT}`);
  if (process.env.NODE_ENV === "production") {
    console.log(`🌐 Production: Check your Render dashboard for the live URL`);
  }
});
