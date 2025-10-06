import pool from "../config/db.js";
import path from "path";

// ------------------------
// DASHBOARD
// ------------------------
export async function dashboardPage(req, res) {
  const { citizen_id, name } = req.query;

  if (!citizen_id || !name) {
    return res
      .status(400)
      .send("Missing citizen information. Please login again.");
  }

  res.render("citizen/dashboard", {
    user: { id: citizen_id, name },
  });
}

// ------------------------
// APPLY SERVICE PAGE
// ------------------------
export async function applyServicePage(req, res) {
  try {
    const { citizen_id, name } = req.query;

    if (!citizen_id || !name) {
      return res
        .status(400)
        .send("Missing citizen information. Please login again.");
    }

    const services = await pool.query(
      `SELECT s.id, s.name, s.description, s.fee, d.name AS department, s.required_fields
       FROM services s
       JOIN departments d ON s.department_id = d.id`
    );

    res.render("citizen/apply", {
      services: services.rows,
      user: { id: citizen_id, name },
    });
  } catch (err) {
    console.error(err.message);
    res.send("Server error");
  }
}

// ------------------------
// SUBMIT SERVICE REQUEST
// ------------------------
export async function submitServiceRequest(req, res) {
  try {
    const { citizen_id, service_id, name, ...extraFields } = req.body;

    if (!citizen_id || !name || !service_id) {
      return res.status(400).send("Missing required data");
    }

    const result = await pool.query(
      `INSERT INTO requests (citizen_id, service_id, status, request_data) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [citizen_id, service_id, "submitted", JSON.stringify(extraFields)]
    );

    const requestId = result.rows[0].id;

    // Save uploaded files - FIXED: Save only filename
    // Save uploaded files - FIXED: Save only filename
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // ✅ This should be just the filename like "1759468251395.jpg"
        const fileName = file.filename;

        await pool.query(
          `INSERT INTO documents (request_id, file_path, original_file_name, file_type) 
       VALUES ($1, $2, $3, $4)`,
          [
            requestId,
            fileName, // ✅ Save only filename
            file.originalname,
            path.extname(file.originalname).substring(1),
          ]
        );
      }
    }

    res.redirect(
      `/citizen/track?citizen_id=${citizen_id}&name=${encodeURIComponent(name)}`
    );
  } catch (err) {
    console.error("❌ Error in submitServiceRequest:", err.message);
    res.send("Server error");
  }
}

// ------------------------
// TRACK REQUESTS
// ------------------------
export async function trackRequests(req, res) {
  try {
    const { citizen_id, name } = req.query;

    if (!citizen_id || !name) {
      return res
        .status(400)
        .send("Missing citizen information. Please login again.");
    }

    const requests = await pool.query(
      `SELECT r.id, s.name AS service, s.fee, d.name AS department, r.status, r.created_at
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN departments d ON s.department_id = d.id
       WHERE r.citizen_id = $1
       ORDER BY r.created_at DESC`,
      [citizen_id]
    );

    res.render("citizen/track", {
      requests: requests.rows,
      user: { id: citizen_id, name },
    });
  } catch (err) {
    console.error(err.message);
    res.send("Server error");
  }
}

// ------------------------
// NOTIFICATIONS
// ------------------------
export async function notificationsPage(req, res) {
  try {
    const { citizen_id, name } = req.query;

    if (!citizen_id || !name) {
      return res
        .status(400)
        .send("Missing citizen information. Please login again.");
    }

    const notifications = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [citizen_id]
    );

    res.render("citizen/notifications", {
      notifications: notifications.rows,
      user: { id: citizen_id, name },
    });
  } catch (err) {
    console.error(err.message);
    res.send("Server error");
  }
}
