import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Register Citizen only
export async function registerUser(req, res) {
  const {
    name,
    email,
    password,
    dob,
    national_id,
    phone_number,
    address,
    job_title,
  } = req.body;

  try {
    if (!name || !email || !password) {
      return res.render("auth/register", {
        error: "Name, email, and password are required",
      });
    }

    const role = "citizen";

    // Check if email exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.render("auth/register", { error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      `INSERT INTO users (name, email, password, role, dob, national_id, phone_number, address, job_title, department_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        name,
        email,
        hashedPassword,
        role,
        dob || null,
        national_id || null,
        phone_number || null,
        address || null,
        job_title || null,
        null,
      ]
    );

    res.redirect("/auth/login?success=1");
  } catch (err) {
    console.error("❌ Error in registerUser:", err.message);
    res.render("auth/register", { error: "Server error" });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.render("auth/login", { error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.render("auth/login", { error: "Invalid email or password" });
    }

    // ✅ Save user info in session
    req.session.user = {
      id: user.id,
      name: user.name,
      role: user.role,
      department_id: user.department_id || null,
    };

    // ✅ FIXED: Clean redirects without URL parameters
    if (user.role === "citizen") {
      return res.redirect("/citizen/dashboard");
    } else if (user.role === "officer") {
      return res.redirect("/officer/dashboard");
    } else if (user.role === "department_head") {
      return res.redirect("/dept-head/dashboard");
    } else if (user.role === "admin") {
      return res.redirect("/admin/dashboard");
    } else {
      return res.redirect("/");
    }
  } catch (err) {
    console.error("❌ Error in loginUser:", err.message);
    return res.render("auth/login", { error: "Server error" });
  }
}
