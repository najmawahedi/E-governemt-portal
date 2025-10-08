import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Protect all department head routes
router.use(authMiddleware);

// Department Head Dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const deptHeadId = req.user.id;

    // Get department head info and department
    const deptHeadResult = await pool.query(
      `SELECT u.*, d.name as department_name, d.id as department_id
       FROM users u
       JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1 AND u.role = 'department_head'`,
      [deptHeadId]
    );

    if (deptHeadResult.rows.length === 0) {
      return res.status(403).send("Access denied or department not found");
    }

    const deptHead = deptHeadResult.rows[0];
    const departmentId = deptHead.department_id;

    // Get department statistics
    const statsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT r.id) as total_requests,
        COUNT(DISTINCT CASE WHEN r.status IN ('submitted', 'under_review') THEN r.id END) as pending_requests,
        COUNT(DISTINCT CASE WHEN r.status = 'approved' THEN r.id END) as approved_requests,
        COUNT(DISTINCT u2.id) as total_officers
       FROM departments d
       LEFT JOIN services s ON s.department_id = d.id
       LEFT JOIN requests r ON r.service_id = s.id
       LEFT JOIN users u2 ON u2.department_id = d.id AND u2.role = 'officer'
       WHERE d.id = $1`,
      [departmentId]
    );

    // Get recent requests
    const recentRequests = await pool.query(
      `SELECT r.*, s.name as service_name, u.name as citizen_name
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN users u ON r.citizen_id = u.id
       WHERE s.department_id = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [departmentId]
    );

    // Get department officers
    const officers = await pool.query(
      `SELECT u.id, u.name, u.email, u.job_title, u.created_at
       FROM users u
       WHERE u.department_id = $1 AND u.role = 'officer'
       ORDER BY u.created_at DESC
       LIMIT 5`,
      [departmentId]
    );

    res.render("dept-head/dashboard", {
      title: "Department Head Dashboard",
      user: deptHead,
      department: {
        id: departmentId,
        name: deptHead.department_name,
      },
      stats: statsResult.rows[0],
      recentRequests: recentRequests.rows,
      officers: officers.rows,
    });
  } catch (err) {
    console.error("❌ dept-head/dashboard:", err);
    res.status(500).send("Server error");
  }
});

// Manage Department Officers - LIST
router.get("/officers", async (req, res) => {
  try {
    const deptHeadId = req.user.id;

    // Get department head info
    const deptHeadResult = await pool.query(
      `SELECT u.department_id, d.name as department_name
       FROM users u
       JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1 AND u.role = 'department_head'`,
      [deptHeadId]
    );

    if (deptHeadResult.rows.length === 0) {
      return res.status(403).send("Access denied");
    }

    const departmentId = deptHeadResult.rows[0].department_id;
    const departmentName = deptHeadResult.rows[0].department_name;

    // Get all officers in the department
    const officers = await pool.query(
      `SELECT u.*
       FROM users u
       WHERE u.department_id = $1 AND u.role = 'officer'
       ORDER BY u.created_at DESC`,
      [departmentId]
    );

    res.render("dept-head/officers", {
      title: "Manage Officers",
      user: req.user,
      department: {
        id: departmentId,
        name: departmentName,
      },
      officers: officers.rows,
    });
  } catch (err) {
    console.error("❌ dept-head/officers:", err);
    res.status(500).send("Server error");
  }
});

// Add New Officer Form - DEPARTMENT HEAD VERSION
router.get("/officers/new", async (req, res) => {
  try {
    const deptHeadId = req.user.id;

    // Get department head info
    const deptHeadResult = await pool.query(
      `SELECT u.department_id, d.name as department_name
       FROM users u
       JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1 AND u.role = 'department_head'`,
      [deptHeadId]
    );

    if (deptHeadResult.rows.length === 0) {
      return res.status(403).send("Access denied");
    }

    const departmentId = deptHeadResult.rows[0].department_id;
    const departmentName = deptHeadResult.rows[0].department_name;

    res.render("dept-head/add-officer", {
      title: "Add New Officer",
      user: req.user,
      department: {
        id: departmentId,
        name: departmentName,
      },
    });
  } catch (err) {
    console.error("❌ dept-head/officers/new:", err);
    res.status(500).send("Server error");
  }
});

// Create New Officer - DEPARTMENT HEAD VERSION
router.post("/officers", async (req, res) => {
  try {
    const deptHeadId = req.user.id;
    const { name, email, password, job_title } = req.body;

    // Get department head info
    const deptHeadResult = await pool.query(
      `SELECT department_id FROM users WHERE id = $1 AND role = 'department_head'`,
      [deptHeadId]
    );

    if (deptHeadResult.rows.length === 0) {
      return res.status(403).send("Access denied");
    }

    const departmentId = deptHeadResult.rows[0].department_id;

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.redirect(
        "/dept-head/officers/new?error=Email already registered"
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create officer
    await pool.query(
      `INSERT INTO users (name, email, password, role, department_id, job_title) 
       VALUES ($1, $2, $3, 'officer', $4, $5)`,
      [name, email, hashedPassword, departmentId, job_title || "Officer"]
    );

    res.redirect("/dept-head/officers?success=Officer created successfully");
  } catch (err) {
    console.error("❌ dept-head/officers POST:", err);
    res.redirect("/dept-head/officers/new?error=Failed to create officer");
  }
});

// Edit Officer Form
router.get("/officers/:id/edit", async (req, res) => {
  try {
    const deptHeadId = req.user.id;
    const officerId = req.params.id;

    // Get department head info
    const deptHeadResult = await pool.query(
      `SELECT department_id FROM users WHERE id = $1 AND role = 'department_head'`,
      [deptHeadId]
    );

    if (deptHeadResult.rows.length === 0) {
      return res.status(403).send("Access denied");
    }

    const departmentId = deptHeadResult.rows[0].department_id;

    // Get officer info (must be in same department)
    const officerResult = await pool.query(
      `SELECT u.*, d.name as department_name
       FROM users u
       JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1 AND u.department_id = $2 AND u.role = 'officer'`,
      [officerId, departmentId]
    );

    if (officerResult.rows.length === 0) {
      return res.status(404).send("Officer not found in your department");
    }

    res.render("dept-head/edit-officer", {
      title: "Edit Officer",
      user: req.user,
      officer: officerResult.rows[0],
    });
  } catch (err) {
    console.error("❌ dept-head/officers/edit:", err);
    res.status(500).send("Server error");
  }
});

// Update Officer
router.post("/officers/:id/edit", async (req, res) => {
  try {
    const deptHeadId = req.user.id;
    const officerId = req.params.id;
    const { name, job_title } = req.body;

    // Verify department head has access to this officer
    const deptHeadResult = await pool.query(
      `SELECT department_id FROM users WHERE id = $1 AND role = 'department_head'`,
      [deptHeadId]
    );

    if (deptHeadResult.rows.length === 0) {
      return res.status(403).send("Access denied");
    }

    const departmentId = deptHeadResult.rows[0].department_id;

    // Update officer
    await pool.query(
      `UPDATE users SET name = $1, job_title = $2 
       WHERE id = $3 AND department_id = $4 AND role = 'officer'`,
      [name, job_title, officerId, departmentId]
    );

    res.redirect("/dept-head/officers?success=Officer updated successfully");
  } catch (err) {
    console.error("❌ dept-head/officers/edit POST:", err);
    res.redirect(
      `/dept-head/officers/${officerId}/edit?error=Failed to update officer`
    );
  }
});

// Remove Officer from Department
router.post("/officers/:id/remove", async (req, res) => {
  try {
    const deptHeadId = req.user.id;
    const officerId = req.params.id;

    // Verify department head has access to this officer
    const deptHeadResult = await pool.query(
      `SELECT department_id FROM users WHERE id = $1 AND role = 'department_head'`,
      [deptHeadId]
    );

    if (deptHeadResult.rows.length === 0) {
      return res.status(403).send("Access denied");
    }

    const departmentId = deptHeadResult.rows[0].department_id;

    // Remove officer from department (set department_id to NULL)
    await pool.query(
      `UPDATE users SET department_id = NULL 
       WHERE id = $1 AND department_id = $2 AND role = 'officer'`,
      [officerId, departmentId]
    );

    res.redirect("/dept-head/officers?success=Officer removed from department");
  } catch (err) {
    console.error("❌ dept-head/officers/remove:", err);
    res.redirect("/dept-head/officers?error=Failed to remove officer");
  }
});

// Department Reports
router.get("/reports", async (req, res) => {
  try {
    const deptHeadId = req.user.id;

    // Get department head info
    const deptHeadResult = await pool.query(
      `SELECT u.department_id, d.name as department_name
       FROM users u
       JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1 AND u.role = 'department_head'`,
      [deptHeadId]
    );

    if (deptHeadResult.rows.length === 0) {
      return res.status(403).send("Access denied");
    }

    const departmentId = deptHeadResult.rows[0].department_id;
    const departmentName = deptHeadResult.rows[0].department_name;

    // Get department reports
    const requestsByService = await pool.query(
      `SELECT s.name as service_name,
              COUNT(r.id) as total_requests,
              SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
              SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM services s
       LEFT JOIN requests r ON r.service_id = s.id
       WHERE s.department_id = $1
       GROUP BY s.name
       ORDER BY s.name`,
      [departmentId]
    );

    // Get basic officer list
    const officers = await pool.query(
      `SELECT name as officer_name
       FROM users 
       WHERE department_id = $1 AND role = 'officer'
       ORDER BY name`,
      [departmentId]
    );

    // Get monthly stats
    const monthlyStats = await pool.query(
      `SELECT 
        TO_CHAR(r.created_at, 'YYYY-MM') as month,
        COUNT(r.id) as total_requests,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE s.department_id = $1 AND r.created_at >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY TO_CHAR(r.created_at, 'YYYY-MM')
       ORDER BY month DESC`,
      [departmentId]
    );

    // Calculate totals
    const totalRequests = requestsByService.rows.reduce(
      (sum, service) => sum + parseInt(service.total_requests),
      0
    );
    const totalApproved = requestsByService.rows.reduce(
      (sum, service) => sum + parseInt(service.approved),
      0
    );
    const totalRejected = requestsByService.rows.reduce(
      (sum, service) => sum + parseInt(service.rejected),
      0
    );

    res.render("dept-head/reports", {
      title: "Department Reports",
      user: req.user,
      department: {
        id: departmentId,
        name: departmentName,
      },
      reports: {
        requestsByService: requestsByService.rows,
        officers: officers.rows,
        monthlyStats: monthlyStats.rows,
        totalRequests,
        totalApproved,
        totalRejected,
      },
    });
  } catch (err) {
    console.error("❌ dept-head/reports:", err);
    res.status(500).send("Server error");
  }
});

export default router;
