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


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); 

app.use(express.static(path.join(__dirname, "public")));


const PostgresSessionStore = pgSession(session);
app.use(
  session({
    store: new PostgresSessionStore({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true 
    }),
    secret: process.env.SESSION_SECRET || "please_change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      maxAge: 24 * 60 * 60 * 1000, 
      httpOnly: true,
      sameSite: 'lax'
    },
    name: 'egov.sid' 
  })
);


app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/requests", requestsRoutes);
app.use("/api", documentRoutes);
app.use("/payments", paymentRoutes);
app.use("/notifications", notificationsRoutes);


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/admin", adminRoutes);


app.get("/", (req, res) => {
  res.render("home", { 
    title: "E-Government Services Portal"
  });
});


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


app.use("/citizen", citizenRoutes);
app.use("/officer", officerRoutes);
app.use("/dept-head", deptHeadRoutes);

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Error destroying session:", err);
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login");
  });
});

app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist.",
  });
});


app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).render("error", {
    title: "Server Error",
    message: "Something went wrong. Please try again later.",
  });
});


app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode`
  );
  console.log(`Local: http://localhost:${PORT}`);
  if (process.env.NODE_ENV === "production") {
    console.log(`🌐 Production: Check your Render dashboard for the live URL`);
  }
});
