
import jwt from "jsonwebtoken";

export async function authMiddleware(req, res, next) {
 
  if (req.session && req.session.user) {
    req.user = req.session.user; 
    return next();
  }

 
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
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

 
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.status(401).json({ message: "No token provided" });
  }
  return res.redirect("/login");
}
