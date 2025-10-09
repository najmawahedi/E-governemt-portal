import pool from "../config/db.js";
import path from "path";
import fs from "fs";

export async function dashboardPage(req, res) {
  try {
    // Try session first, then fall back to query parameters for compatibility
    let user = req.session.user;

    if (!user) {
      // Fallback to query parameters for backward compatibility
      const { citizen_id, name } = req.query;
      if (citizen_id && name) {
        user = { id: citizen_id, name: name, role: "citizen" };
      } else {
        return res.redirect("/auth/login");
      }
    }

    if (user.role !== "citizen") {
      return res.redirect("/auth/login");
    }

    res.render("citizen/dashboard", {
      user: { id: user.id, name: user.name },
    });
  } catch (err) {
    console.error("❌ Error in dashboardPage:", err.message);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Failed to load dashboard. Please try again.",
    });
  }
}


export async function applyServicePage(req, res) {
  try {
    // Try session first, then fall back to query parameters for compatibility
    let user = req.session.user;

    if (!user) {
      // Fallback to query parameters for backward compatibility
      const { citizen_id, name } = req.query;
      if (citizen_id && name) {
        user = { id: citizen_id, name: name, role: "citizen" };
      } else {
        return res.redirect("/auth/login");
      }
    }

    if (user.role !== "citizen") {
      return res.redirect("/auth/login");
    }

    const services = await pool.query(
      `SELECT s.id, s.name, s.description, s.fee, d.name AS department, s.required_fields
       FROM services s
       JOIN departments d ON s.department_id = d.id`
    );

    res.render("citizen/apply", {
      services: services.rows,
      user: { id: user.id, name: user.name },
    });
  } catch (err) {
    console.error("❌ Error in applyServicePage:", err.message);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Failed to load services. Please try again.",
    });
  }
}


export async function submitServiceRequest(req, res) {
  try {
    
    let user = req.session.user;
    const { service_id, citizen_id, name, ...extraFields } = req.body;

    if (!user) {
      
      if (citizen_id && name) {
        user = { id: citizen_id, name: name, role: "citizen" };
      } else {
        return res.redirect("/auth/login");
      }
    }

    if (user.role !== "citizen") {
      return res.redirect("/auth/login");
    }

    if (!service_id) {
      return res.status(400).render("error", {
        title: "Missing Information",
        message: "Please select a service.",
      });
    }

    // ✅ Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const result = await pool.query(
      `INSERT INTO requests (citizen_id, service_id, status, request_data) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, service_id, "submitted", JSON.stringify(extraFields)]
    );

    const requestId = result.rows[0].id;

    // Save uploaded files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = file.filename;

        await pool.query(
          `INSERT INTO documents (request_id, file_path, original_file_name, file_type) 
           VALUES ($1, $2, $3, $4)`,
          [
            requestId,
            fileName,
            file.originalname,
            path.extname(file.originalname).substring(1),
          ]
        );
      }
    }

    
    res.redirect("/citizen/track");
  } catch (err) {
    console.error("❌ Error in submitServiceRequest:", err.message);
    res.status(500).render("error", {
      title: "Application Failed",
      message: "Failed to submit your application. Please try again.",
    });
  }
}


export async function trackRequests(req, res) {
  try {
   
    let user = req.session.user;

    if (!user) {
  
      const { citizen_id, name } = req.query;
      if (citizen_id && name) {
        user = { id: citizen_id, name: name, role: "citizen" };
      } else {
        return res.redirect("/auth/login");
      }
    }

    if (user.role !== "citizen") {
      return res.redirect("/auth/login");
    }

    const requests = await pool.query(
      `SELECT r.id, s.name AS service, s.fee, d.name AS department, r.status, r.created_at
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN departments d ON s.department_id = d.id
       WHERE r.citizen_id = $1
       ORDER BY r.created_at DESC`,
      [user.id]
    );

    res.render("citizen/track", {
      requests: requests.rows,
      user: { id: user.id, name: user.name },
    });
  } catch (err) {
    console.error("❌ Error in trackRequests:", err.message);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Failed to load your requests. Please try again.",
    });
  }
}


export async function notificationsPage(req, res) {
  try {
    
    let user = req.session.user;

    if (!user) {
      
      const { citizen_id, name } = req.query;
      if (citizen_id && name) {
        user = { id: citizen_id, name: name, role: "citizen" };
      } else {
        return res.redirect("/auth/login");
      }
    }

    if (user.role !== "citizen") {
      return res.redirect("/auth/login");
    }

    const notifications = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id]
    );

    res.render("citizen/notifications", {
      notifications: notifications.rows,
      user: { id: user.id, name: user.name },
    });
  } catch (err) {
    console.error("❌ Error in notificationsPage:", err.message);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Failed to load notifications. Please try again.",
    });
  }
}
