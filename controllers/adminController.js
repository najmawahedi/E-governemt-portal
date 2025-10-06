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
    });
  } catch (err) {
    console.error("❌ Error in getDepartments:", err.message);
    res.status(500).send("Server error");
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, description } = req.body;

    await pool.query(
      "INSERT INTO departments (name, description) VALUES ($1, $2)",
      [name, description]
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
    });
  } catch (err) {
    console.error("❌ Error in getServices:", err.message);
    res.status(500).send("Server error");
  }
}

export async function createService(req, res) {
  try {
    const { name, department_id, description, fee, required_fields } = req.body;

    await pool.query(
      `INSERT INTO services (name, department_id, description, fee, required_fields) 
       VALUES ($1, $2, $3, $4, $5)`,
      [name, department_id, description, parseFloat(fee) || 0, required_fields]
    );

    res.redirect("/admin/services?success=Service created successfully");
  } catch (err) {
    console.error("❌ Error in createService:", err.message);
    res.redirect("/admin/services?error=Failed to create service");
  }
}

// ================= REPORTS =================
// ================= REPORTS =================
export async function getReports(req, res) {
  try {
    // Requests by department with percentages
    const requestsByDept = await pool.query(`
      SELECT 
        d.name as department_name,
        COUNT(r.id) as total_requests,
        SUM(CASE WHEN r.status='approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status='rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN r.status IN ('submitted', 'under_review') THEN 1 ELSE 0 END) as pending,
        ROUND(COUNT(r.id) * 100.0 / (SELECT COUNT(*) FROM requests), 1) as percentage
      FROM departments d
      LEFT JOIN services s ON s.department_id = d.id
      LEFT JOIN requests r ON r.service_id = s.id
      GROUP BY d.id, d.name
      ORDER BY total_requests DESC
    `);

    // Revenue by department
    const revenueByDept = await pool.query(`
      SELECT 
        d.name as department_name,
        COALESCE(SUM(p.amount), 0) as total_collected,
        COUNT(p.id) as total_payments
      FROM departments d
      LEFT JOIN services s ON s.department_id = d.id
      LEFT JOIN requests r ON r.service_id = s.id
      LEFT JOIN payments p ON p.request_id = r.id
      GROUP BY d.id, d.name
      ORDER BY total_collected DESC
    `);

    // Monthly trends (last 6 months)
    const monthlyTrends = await pool.query(`
      SELECT 
        TO_CHAR(date_trunc('month', r.created_at), 'Mon YYYY') as month,
        COUNT(*) as total_requests,
        SUM(CASE WHEN r.status='approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status='rejected' THEN 1 ELSE 0 END) as rejected
      FROM requests r
      WHERE r.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
      GROUP BY date_trunc('month', r.created_at)
      ORDER BY date_trunc('month', r.created_at)
    `);

    // Service popularity
    const servicePopularity = await pool.query(`
      SELECT 
        s.name as service_name,
        d.name as department_name,
        COUNT(r.id) as request_count,
        ROUND(COUNT(r.id) * 100.0 / (SELECT COUNT(*) FROM requests), 1) as percentage
      FROM services s
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN requests r ON r.service_id = s.id
      GROUP BY s.id, s.name, d.name
      ORDER BY request_count DESC
      LIMIT 10
    `);

    // Overall stats
    const totalRequests = await pool.query("SELECT COUNT(*) FROM requests");
    const approvedRequests = await pool.query("SELECT COUNT(*) FROM requests WHERE status='approved'");
    const rejectedRequests = await pool.query("SELECT COUNT(*) FROM requests WHERE status='rejected'");
    const pendingRequests = await pool.query("SELECT COUNT(*) FROM requests WHERE status IN ('submitted', 'under_review')");
    const totalRevenue = await pool.query("SELECT COALESCE(SUM(amount), 0) FROM payments");
    const totalUsers = await pool.query("SELECT COUNT(*) FROM users");

    res.render("admin/reports", {
      title: "Enhanced System Reports",
      reports: {
        // Overall stats
        totalRequests: parseInt(totalRequests.rows[0].count),
        approvedRequests: parseInt(approvedRequests.rows[0].count),
        rejectedRequests: parseInt(rejectedRequests.rows[0].count),
        pendingRequests: parseInt(pendingRequests.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].coalesce) || 0,
        totalUsers: parseInt(totalUsers.rows[0].count),
        
        // Chart data
        requestsByDepartment: requestsByDept.rows,
        revenueByDepartment: revenueByDept.rows,
        monthlyTrends: monthlyTrends.rows,
        servicePopularity: servicePopularity.rows,
        
        // Approval rate 
        approvalRate: totalRequests.rows[0].count > 0 
          ? Math.round((approvedRequests.rows[0].count / totalRequests.rows[0].count) * 100)
          : 0
      }
    });
  } catch (err) {
    console.error("❌ Error in getReports:", err.message);
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
