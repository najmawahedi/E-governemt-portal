import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { updateRequestStatus } from "../controllers/requestsController.js";

const router = express.Router();

// Protect all officer routes
router.use(authMiddleware);

// Officer dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const officerId = req.user.id;
    console.log("🏠 Dashboard route - Officer ID:", officerId);

    const officerRes = await pool.query(
      `SELECT u.id, u.name, u.department_id, u.role, d.name as department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = $1`,
      [officerId]
    );

    console.log("🏠 Officer query result:", officerRes.rows);

    if (officerRes.rows.length === 0) {
      console.log("❌ Officer not found in database");
      return res.status(404).send("Officer not found");
    }

    const officer = officerRes.rows[0];

    if (!officer.department_id) {
      console.log("❌ Officer has no department_id:", officer);
      return res
        .status(403)
        .send(
          "Officer has no department assigned. Please contact administrator."
        );
    }

    console.log("✅ Officer department:", officer.department_id);

    // ✅ FIXED QUERY: Use services.department_id
    const q = `
      SELECT r.id, r.status, r.created_at, u.name AS citizen_name, s.name AS service_name
      FROM requests r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON r.citizen_id = u.id
      WHERE s.department_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(q, [officer.department_id]);

    console.log("✅ Dashboard requests found:", result.rows.length);

    res.render("officer/dashboard", {
      user: officer,
      requests: result.rows,
    });
  } catch (err) {
    console.error("❌ officer/dashboard:", err);
    res.status(500).send("Server error: " + err.message);
  }
});

// Request detail page
router.get("/requests/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const reqQ = `
      SELECT r.*, s.name AS service_name, s.description AS service_description, s.fee,
             u.name AS citizen_name, u.email AS citizen_email
      FROM requests r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON r.citizen_id = u.id
      WHERE r.id = $1
    `;
    const rRes = await pool.query(reqQ, [id]);
    if (rRes.rows.length === 0)
      return res.status(404).send("Request not found");

    const docsRes = await pool.query(
      "SELECT * FROM documents WHERE request_id = $1",
      [id]
    );

    res.render("officer/requestDetail", {
      user: req.user,
      request: rRes.rows[0],
      documents: docsRes.rows,
    });
  } catch (err) {
    console.error("❌ officer/requestDetail:", err);
    res.status(500).send("Server error");
  }
});

// Update request status
router.post("/requests/:id/status", async (req, res) => {
  try {
    if (!req.body.status) return res.status(400).send("Missing status");

    // Use the controller function
    const mockRes = {
      json: (data) =>
        res.redirect(
          `/officer/requests/${req.params.id}?success=Status updated`
        ),
      status: (code) => ({
        json: (data) =>
          res.redirect(
            `/officer/requests/${req.params.id}?error=${data.message}`
          ),
      }),
    };

    await updateRequestStatus(req, mockRes);
  } catch (err) {
    console.error("❌ officer/status:", err);
    res.redirect(`/officer/requests/${req.params.id}?error=Server error`);
  }
});

// Search requests
router.get("/search", async (req, res) => {
  try {
    const officerId = req.user.id;
    console.log("🔍 Search route - Officer ID:", officerId);

    // Get officer department - IMPROVED QUERY
    const officerRes = await pool.query(
      `SELECT u.id, u.name, u.department_id, u.role, d.name as department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = $1`,
      [officerId]
    );

    console.log("🔍 Officer query result:", officerRes.rows);

    if (officerRes.rows.length === 0) {
      console.log("❌ Officer not found in database");
      return res.status(404).send("Officer not found");
    }

    const officer = officerRes.rows[0];

    if (!officer.department_id) {
      console.log("❌ Officer has no department_id:", officer);
      return res
        .status(403)
        .send(
          "Officer has no department assigned. Please contact administrator."
        );
    }

    console.log("✅ Officer department:", officer.department_id);

    // Build search query
    let query = `
      SELECT r.*, u.name AS citizen_name, s.name AS service_name
      FROM requests r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON r.citizen_id = u.id
      WHERE s.department_id = $1
    `;

    const queryParams = [officer.department_id];
    let paramCount = 1;

    // Add search filters
    if (req.query.citizen_name) {
      paramCount++;
      query += ` AND u.name ILIKE $${paramCount}`;
      queryParams.push(`%${req.query.citizen_name}%`);
    }

    if (req.query.request_id) {
      paramCount++;
      query += ` AND r.id = $${paramCount}`;
      queryParams.push(parseInt(req.query.request_id));
    }

    if (req.query.status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      queryParams.push(req.query.status);
    }

    if (req.query.service_id) {
      paramCount++;
      query += ` AND r.service_id = $${paramCount}`;
      queryParams.push(parseInt(req.query.service_id));
    }

    query += " ORDER BY r.created_at DESC";

    console.log("🔍 Search query:", query);
    console.log("🔍 Search params:", queryParams);

    const result = await pool.query(query, queryParams);

    // Get services for dropdown
    const services = await pool.query(
      `SELECT * FROM services WHERE department_id = $1 ORDER BY name`,
      [officer.department_id]
    );

    console.log("✅ Search results found:", result.rows.length);

    res.render("officer/search", {
      user: officer,
      requests: result.rows,
      services: services.rows,
      searchParams: req.query,
    });
  } catch (err) {
    console.error("❌ officer/search:", err);
    res.status(500).send("Server error: " + err.message);
  }
});

// Officer profile page - GET
router.get("/profile", async (req, res) => {
  try {
    const officerId = req.user.id;

    const officerResult = await pool.query(
      `
      SELECT u.*, d.name as department_name,
        (SELECT COUNT(*) FROM requests r 
         JOIN services s ON r.service_id = s.id 
         WHERE s.department_id = u.department_id) as total_requests,
        (SELECT COUNT(*) FROM requests r 
         JOIN services s ON r.service_id = s.id 
         WHERE s.department_id = u.department_id AND r.status = 'approved') as approved_requests
      FROM users u
      JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `,
      [officerId]
    );

    if (officerResult.rows.length === 0) {
      return res.status(404).send("Officer not found");
    }

    const officer = officerResult.rows[0];

    res.render("officer/profile", {
      user: officer,
      stats: {
        totalHandled: officer.total_requests || 0,
        approvedCount: officer.approved_requests || 0,
      },
    });
  } catch (err) {
    console.error("❌ officer/profile GET:", err);
    res.status(500).send("Server error");
  }
});

// Officer profile update - POST
router.post("/profile", async (req, res) => {
  try {
    const officerId = req.user.id;
    const { name, job_title } = req.body;

    console.log("📝 Updating officer profile:", { officerId, name, job_title });

    // Update officer profile
    await pool.query(
      "UPDATE users SET name = $1, job_title = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [name, job_title, officerId]
    );

    console.log("✅ Officer profile updated successfully");

    res.redirect("/officer/profile?success=Profile updated successfully");
  } catch (err) {
    console.error("❌ Error updating officer profile:", err.message);
    res.redirect("/officer/profile?error=Failed to update profile");
  }
});

export default router;
