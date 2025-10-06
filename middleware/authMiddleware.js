// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export async function authMiddleware(req, res, next) {
  // 1) Session-based auth (EJS pages)
  if (req.session && req.session.user) {
    req.user = req.session.user; // { id, name, role, department_id }
    return next();
  }

  // 2) Authorization header (Bearer token) — for APIs that use JWT
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // payload should contain { id, role, name, ... }
      req.user = payload;
      return next();
    } catch (err) {
      // token invalid
      if (req.headers.accept && req.headers.accept.includes("application/json")) {
        return res.status(401).json({ message: "Invalid token" });
      }
      return res.redirect("/login");
    }
  }

  // 3) No credentials
  // If browser expects HTML, redirect to login; otherwise return JSON
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.status(401).json({ message: "No token provided" });
  }
  return res.redirect("/login");
}
