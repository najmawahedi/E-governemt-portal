import pool from "../config/db.js";
import bcrypt from "bcrypt";

// ================= ADMIN DASHBOARD =================
export async function adminDashboard(req, res) {
  try {
    // Get total users count
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");

    // Get total requests count
    const requestsCount = await pool.query("SELECT COUNT(*) FROM requests");

    // Get pending requests count
    const pendingCount = await pool.query(
      "SELECT COUNT(*) FROM requests WHERE status = 'submitted' OR status = 'under_review'"
    );

    // Get total revenue
    const revenueResult = await pool.query("SELECT SUM(amount) FROM payments");

    // Get recent requests
    const recentRequests = await pool.query(`
      SELECT r.*, u.name as citizen_name, s.name as service_name, d.name as department_name
      FROM requests r
      JOIN users u ON r.citizen_id = u.id
      JOIN services s ON r.service_id = s.id
      JOIN departments d ON s.department_id = d.id
      ORDER BY r.created_at DESC LIMIT 5
    `);

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalRequests: parseInt(requestsCount.rows[0].count),
        pendingRequests: parseInt(pendingCount.rows[0].count),
        totalRevenue: parseFloat(revenueResult.rows[0].sum) || 0,
      },
      recentRequests: recentRequests.rows,
    });
  } catch (err) {
    console.error("❌ Error in adminDashboard:", err.message);
    res.status(500).send("Server error");
  }
}

// ================= USER MANAGEMENT =================
export async function getUsers(req, res) {
  try {
    const users = await pool.query(`
      SELECT u.*, d.name as department_name 
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id 
      ORDER BY u.created_at DESC
    `);

    res.render("admin/users", {
      title: "User Management",
      users: users.rows,
    });
  } catch (err) {
    console.error("❌ Error in getUsers:", err.message);
    res.status(500).send("Server error");
  }
}

export async function createOfficer(req, res) {
  try {
    const { name, email, password, department_id, job_title } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (name, email, password, role, department_id, job_title) 
       VALUES ($1, $2, $3, 'officer', $4, $5)`,
      [name, email, hashedPassword, department_id, job_title || "Officer"]
    );

    res.redirect("/admin/users?success=Officer created successfully");
  } catch (err) {
    console.error("❌ Error in createOfficer:", err.message);
    res.redirect("/admin/users?error=Failed to create officer");
  }
}

export async function createDepartmentHead(req, res) {
  try {
    const { name, email, password, department_id, job_title } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (name, email, password, role, department_id, job_title) 
       VALUES ($1, $2, $3, 'department_head', $4, $5)`,
      [
        name,
        email,
        hashedPassword,
        department_id,
        job_title || "Department Head",
      ]
    );

    res.redirect("/admin/users?success=Department head created successfully");
  } catch (err) {
    console.error("❌ Error in createDepartmentHead:", err.message);
    res.redirect("/admin/users?error=Failed to create department head");
  }
}

// ================= DEPARTMENT MANAGEMENT =================
export async function getDepartments(req, res) {
  try {
    const departments = await pool.query(`
      SELECT d.*, 
        COUNT(DISTINCT s.id) as service_count,
        COUNT(DISTINCT u.id) as officer_count
      FROM departments d
      LEFT JOIN services s ON s.department_id = d.id
      LEFT JOIN users u ON u.department_id = d.id AND u.role IN ('officer', 'department_head')
      GROUP BY d.id
      ORDER BY d.name
    `);

    res.render("admin/departments", {
      title: "Department Management",
      departments: departments.rows,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (err) {
    console.error("❌ Error in getDepartments:", err.message);
    res.status(500).send("Server error");
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.redirect(
        "/admin/departments?error=Department name is required"
      );
    }

    // Check if department already exists
    const existingDept = await pool.query(
      "SELECT id FROM departments WHERE name = $1",
      [name.trim()]
    );

    if (existingDept.rows.length > 0) {
      return res.redirect(
        "/admin/departments?error=Department name already exists"
      );
    }

    await pool.query(
      "INSERT INTO departments (name, description) VALUES ($1, $2)",
      [name.trim(), description?.trim() || null]
    );

    res.redirect("/admin/departments?success=Department created successfully");
  } catch (err) {
    console.error("❌ Error in createDepartment:", err.message);
    res.redirect("/admin/departments?error=Failed to create department");
  }
}

// ================= SERVICE MANAGEMENT =================
export async function getServices(req, res) {
  try {
    const services = await pool.query(`
      SELECT s.*, d.name as department_name
      FROM services s
      JOIN departments d ON s.department_id = d.id
      ORDER BY d.name, s.name
    `);

    const departments = await pool.query(
      "SELECT * FROM departments ORDER BY name"
    );

    res.render("admin/services", {
      title: "Service Management",
      services: services.rows,
      departments: departments.rows,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (err) {
    console.error("❌ Error in getServices:", err.message);
    res.status(500).send("Server error");
  }
}

export async function createService(req, res) {
  try {
    const { name, department_id, description, fee, required_fields } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.redirect("/admin/services?error=Service name is required");
    }

    if (!department_id) {
      return res.redirect("/admin/services?error=Department is required");
    }

    // Check if service already exists in this department
    const existingService = await pool.query(
      "SELECT id FROM services WHERE name = $1 AND department_id = $2",
      [name.trim(), department_id]
    );

    if (existingService.rows.length > 0) {
      return res.redirect(
        "/admin/services?error=Service name already exists in this department"
      );
    }

    // Process required fields
    let requiredFieldsJson = null;
    if (required_fields && required_fields.trim()) {
      const fieldsArray = required_fields
        .split(",")
        .map((field) => field.trim())
        .filter((field) => field);

      if (fieldsArray.length > 0) {
        requiredFieldsJson = JSON.stringify(fieldsArray);
      }
    }

    // Let the database auto-generate the ID by not specifying it in INSERT
    await pool.query(
      `INSERT INTO services (department_id, name, description, fee, required_fields) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        department_id,
        name.trim(),
        description?.trim() || null,
        parseFloat(fee) || 0,
        requiredFieldsJson,
      ]
    );

    res.redirect("/admin/services?success=Service created successfully");
  } catch (err) {
    console.error("❌ Error in createService:", err.message);

    if (err.code === "23505") {
      if (err.constraint === "services_pkey") {
        return res.redirect(
          "/admin/services?error=Database error: ID conflict. Please try again."
        );
      }
      return res.redirect(
        "/admin/services?error=Service name already exists in this department"
      );
    }

    res.redirect("/admin/services?error=Failed to create service");
  }
}
// ================= SIMPLE REPORTS =================
export async function getReports(req, res) {
  try {
    // Simple requests by department
    const requestsByDept = await pool.query(`
      SELECT d.name as department_name,
             COUNT(r.id) as total_requests,
             SUM(CASE WHEN r.status='approved' THEN 1 ELSE 0 END) as approved,
             SUM(CASE WHEN r.status='rejected' THEN 1 ELSE 0 END) as rejected
      FROM departments d
      LEFT JOIN services s ON s.department_id = d.id
      LEFT JOIN requests r ON r.service_id = s.id
      GROUP BY d.name
      ORDER BY d.name;
    `);

    // Simple revenue by department
    const revenueByDept = await pool.query(`
      SELECT d.name as department_name,
             SUM(p.amount) as total_collected
      FROM payments p
      JOIN requests r ON r.id = p.request_id
      JOIN services s ON s.id = r.service_id
      JOIN departments d ON d.id = s.department_id
      GROUP BY d.name
      ORDER BY d.name;
    `);

    // Total stats
    const totalRequests = await pool.query("SELECT COUNT(*) FROM requests");
    const approvedRequests = await pool.query(
      "SELECT COUNT(*) FROM requests WHERE status='approved'"
    );
    const rejectedRequests = await pool.query(
      "SELECT COUNT(*) FROM requests WHERE status='rejected'"
    );
    const totalRevenue = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) FROM payments"
    );

    res.render("admin/reports", {
      title: "System Reports",
      reports: {
        totalRequests: parseInt(totalRequests.rows[0].count),
        approvedRequests: parseInt(approvedRequests.rows[0].count),
        rejectedRequests: parseInt(rejectedRequests.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].coalesce) || 0,
        requestsByDepartment: requestsByDept.rows,
        revenueByDepartment: revenueByDept.rows,
      },
    });
  } catch (err) {
    console.error("❌ ERROR in getReports:", err.message);
    res.status(500).send("Server error");
  }
}

// ================= ALL REQUESTS =================
export async function getAllRequests(req, res) {
  try {
    const requests = await pool.query(`
      SELECT r.*, u.name as citizen_name, s.name as service_name, d.name as department_name
      FROM requests r
      JOIN users u ON r.citizen_id = u.id
      JOIN services s ON r.service_id = s.id
      JOIN departments d ON s.department_id = d.id
      ORDER BY r.created_at DESC
    `);

    const departments = await pool.query(
      "SELECT * FROM departments ORDER BY name"
    );

    res.render("admin/requests", {
      title: "All System Requests",
      requests: requests.rows,
      departments: departments.rows,
    });
  } catch (err) {
    console.error("❌ Error in getAllRequests:", err.message);
    res.status(500).send("Server error");
  }
}
