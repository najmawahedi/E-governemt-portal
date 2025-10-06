// index.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts";
import citizenRoutes from "./routes/citizenRoutes.js";
import session from "express-session";
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
app.use(
  session({
    secret: process.env.SESSION_SECRET || "please_change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // change to true when using HTTPS
  })
);

// =======================
// ✅ API ROUTES
// =======================
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/requests", requestsRoutes);
app.use("/api", documentRoutes);
app.use("/payments", paymentRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/admin", adminRoutes);
app.use("/dept-head", deptHeadRoutes);

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

// ✅ Citizen pages (dashboard, apply, track, notifications)
app.use("/citizen", citizenRoutes);
app.use("/officer", officerRoutes); // <--- MOUNT OFFICER ROUTES

// Officer dashboard (example)
app.get("/officer/dashboard", (req, res) => {
  res.render("officer/dashboard", { title: "Officer Dashboard" });
});

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

// Admin dashboard
// app.get("/admin/dashboard", (req, res) => {
//   res.render("admin/dashboard", { title: "Admin Dashboard" });
// });

// =======================
// ✅ START SERVER
// =======================
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
