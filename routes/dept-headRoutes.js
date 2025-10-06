import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

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
        COUNT(DISTINCT CASE WHEN r.status = 'submitted' THEN r.id END) as pending_requests,
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
       ORDER BY u.created_at DESC`,
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

// Manage Department Officers
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
      `SELECT u.*, 
        (SELECT COUNT(*) FROM requests r 
         JOIN services s ON r.service_id = s.id 
         WHERE s.department_id = $1) as department_requests
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

// Department Reports - FIXED VERSION
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

    // ✅ FIXED: Simple officer list without performance tracking
    const officerPerformance = await pool.query(
      `SELECT u.name as officer_name,
              'Not tracked' as total_handled,
              'Not tracked' as approved, 
              'Not tracked' as rejected
       FROM users u
       WHERE u.department_id = $1 AND u.role = 'officer'
       ORDER BY u.name`,
      [departmentId]
    );

    const monthlyStats = await pool.query(
      `SELECT 
        TO_CHAR(r.created_at, 'YYYY-MM') as month,
        COUNT(r.id) as total_requests,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE s.department_id = $1
       GROUP BY TO_CHAR(r.created_at, 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 6`,
      [departmentId]
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
        officerPerformance: officerPerformance.rows,
        monthlyStats: monthlyStats.rows,
      },
    });
  } catch (err) {
    console.error("❌ dept-head/reports:", err);
    res.status(500).send("Server error");
  }
});

export default router;
