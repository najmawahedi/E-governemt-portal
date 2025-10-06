import express from "express";
import {
  adminDashboard,
  getUsers,
  createOfficer,
  createDepartmentHead,
  getDepartments,
  createDepartment,
  getServices,
  createService,
  getReports,
  getAllRequests,
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import pool from "../config/db.js"; 

const router = express.Router();

// Protect all admin routes
router.use(authMiddleware);

// Dashboard
router.get("/dashboard", adminDashboard);

// User management
router.get("/users", getUsers);
router.post("/users/officer", createOfficer);
router.post("/users/department-head", createDepartmentHead);

// Department management
// ================= DEPARTMENT MANAGEMENT =================

// Get all departments
router.get("/departments", async (req, res) => {
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
      departments: departments.rows
    });
  } catch (err) {
    console.error("❌ Error in getDepartments:", err.message);
    res.status(500).send("Server error");
  }
});

// Create new department
router.post("/departments", async (req, res) => {
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
});

// Edit department page
router.get("/departments/:id/edit", async (req, res) => {
  try {
    const deptId = req.params.id;
    
    const deptResult = await pool.query("SELECT * FROM departments WHERE id = $1", [deptId]);
    
    if (deptResult.rows.length === 0) {
      return res.status(404).send("Department not found");
    }
    
    res.render("admin/edit-department", {
      title: "Edit Department",
      department: deptResult.rows[0]
    });
  } catch (err) {
    console.error("❌ Error loading edit department:", err.message);
    res.status(500).send("Server error");
  }
});

// Update department
router.post("/departments/:id/edit", async (req, res) => {
  try {
    const deptId = req.params.id;
    const { name, description } = req.body;
    
    await pool.query(
      "UPDATE departments SET name = $1, description = $2 WHERE id = $3",
      [name, description, deptId]
    );
    
    res.redirect("/admin/departments?success=Department updated successfully");
  } catch (err) {
    console.error("❌ Error updating department:", err.message);
    res.redirect(`/admin/departments/${deptId}/edit?error=Failed to update department`);
  }
});

// Delete department
router.post("/departments/:id/delete", async (req, res) => {
  try {
    const deptId = req.params.id;
    
    // Check if department has services
    const servicesCount = await pool.query("SELECT COUNT(*) FROM services WHERE department_id = $1", [deptId]);
    
    if (parseInt(servicesCount.rows[0].count) > 0) {
      return res.redirect("/admin/departments?error=Cannot delete department with existing services");
    }
    
    // Check if department has officers
    const officersCount = await pool.query("SELECT COUNT(*) FROM users WHERE department_id = $1", [deptId]);
    
    if (parseInt(officersCount.rows[0].count) > 0) {
      return res.redirect("/admin/departments?error=Cannot delete department with assigned officers");
    }
    
    await pool.query("DELETE FROM departments WHERE id = $1", [deptId]);
    
    res.redirect("/admin/departments?success=Department deleted successfully");
  } catch (err) {
    console.error("❌ Error deleting department:", err.message);
    res.redirect("/admin/departments?error=Failed to delete department");
  }
});

// Service management
// ================= SERVICE MANAGEMENT =================

// Get all services
router.get("/services", async (req, res) => {
  try {
    const services = await pool.query(`
      SELECT s.*, d.name as department_name
      FROM services s
      JOIN departments d ON s.department_id = d.id
      ORDER BY d.name, s.name
    `);

    const departments = await pool.query("SELECT * FROM departments ORDER BY name");

    res.render("admin/services", {
      title: "Service Management",
      services: services.rows,
      departments: departments.rows
    });
  } catch (err) {
    console.error("❌ Error in getServices:", err.message);
    res.status(500).send("Server error");
  }
});

// Create new service
router.post("/services", async (req, res) => {
  try {
    const { name, department_id, description, fee, required_fields } = req.body;
    
    // Convert comma-separated fields to JSON array
    let fieldsArray = [];
    if (required_fields && required_fields.trim()) {
      fieldsArray = required_fields.split(',').map(field => field.trim()).filter(field => field);
    }
    
    const requiredFieldsJson = fieldsArray.length > 0 ? JSON.stringify(fieldsArray) : null;
    
    await pool.query(
      `INSERT INTO services (name, department_id, description, fee, required_fields) 
       VALUES ($1, $2, $3, $4, $5)`,
      [name, department_id, description, parseFloat(fee) || 0, requiredFieldsJson]
    );

    res.redirect("/admin/services?success=Service created successfully");
  } catch (err) {
    console.error("❌ Error in createService:", err.message);
    res.redirect("/admin/services?error=Failed to create service");
  }
});

// Edit service page
router.get("/services/:id/edit", async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const serviceResult = await pool.query(`
      SELECT s.*, d.name as department_name
      FROM services s
      JOIN departments d ON s.department_id = d.id
      WHERE s.id = $1
    `, [serviceId]);
    
    if (serviceResult.rows.length === 0) {
      return res.status(404).send("Service not found");
    }
    
    const service = serviceResult.rows[0];
    const departments = await pool.query("SELECT * FROM departments ORDER BY name");
    
    // Convert JSON fields back to comma-separated string for editing
    let fieldsString = '';
    if (service.required_fields) {
      try {
        const fieldsArray = JSON.parse(service.required_fields);
        fieldsString = fieldsArray.join(', ');
      } catch (e) {
        fieldsString = service.required_fields;
      }
    }
    
    res.render("admin/edit-service", {
      title: "Edit Service",
      service: service,
      departments: departments.rows,
      fieldsString: fieldsString
    });
  } catch (err) {
    console.error("❌ Error loading edit service:", err.message);
    res.status(500).send("Server error");
  }
});

// Update service
router.post("/services/:id/edit", async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { name, department_id, description, fee, required_fields } = req.body;
    
    // Convert comma-separated fields to JSON array
    let fieldsArray = [];
    if (required_fields && required_fields.trim()) {
      fieldsArray = required_fields.split(',').map(field => field.trim()).filter(field => field);
    }
    
    const requiredFieldsJson = fieldsArray.length > 0 ? JSON.stringify(fieldsArray) : null;
    
    await pool.query(
      `UPDATE services SET name = $1, department_id = $2, description = $3, fee = $4, required_fields = $5 
       WHERE id = $6`,
      [name, department_id, description, parseFloat(fee) || 0, requiredFieldsJson, serviceId]
    );
    
    res.redirect("/admin/services?success=Service updated successfully");
  } catch (err) {
    console.error("❌ Error updating service:", err.message);
    res.redirect(`/admin/services/${serviceId}/edit?error=Failed to update service`);
  }
});

// Delete service
router.post("/services/:id/delete", async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    // Check if service has requests
    const requestsCount = await pool.query("SELECT COUNT(*) FROM requests WHERE service_id = $1", [serviceId]);
    
    if (parseInt(requestsCount.rows[0].count) > 0) {
      return res.redirect("/admin/services?error=Cannot delete service with existing requests");
    }
    
    await pool.query("DELETE FROM services WHERE id = $1", [serviceId]);
    
    res.redirect("/admin/services?success=Service deleted successfully");
  } catch (err) {
    console.error("❌ Error deleting service:", err.message);
    res.redirect("/admin/services?error=Failed to delete service");
  }
});

// Reports
router.get("/reports", getReports);

// Requests overview
router.get("/requests", getAllRequests);
// Add these GET routes for the registration forms
router.get("/register-officer", async (req, res) => {
  try {
    const departments = await pool.query("SELECT * FROM departments ORDER BY name");
    res.render("auth/register-officer", { 
      title: "Register Officer",
      departments: departments.rows 
    });
  } catch (err) {
    console.error("❌ Error loading officer registration:", err.message);
    res.status(500).send("Server error");
  }
});

router.get("/register-department-head", async (req, res) => {
  try {
    const departments = await pool.query("SELECT * FROM departments ORDER BY name");
    res.render("auth/register-department-head", { 
      title: "Register Department Head",
      departments: departments.rows 
    });
  } catch (err) {
    console.error("❌ Error loading department head registration:", err.message);
    res.status(500).send("Server error");
  }
});

// Edit user page
router.get("/users/:id/edit", async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user details
    const userResult = await pool.query(`
      SELECT u.*, d.name as department_name 
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id 
      WHERE u.id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found");
    }
    
    const user = userResult.rows[0];
    
    // Get departments for dropdown (if editing officer/dept head)
    const departments = await pool.query("SELECT * FROM departments ORDER BY name");
    
    res.render("admin/edit-user", {
      title: "Edit User",
      user: user,
      departments: departments.rows
    });
  } catch (err) {
    console.error("❌ Error loading edit user:", err.message);
    res.status(500).send("Server error");
  }
});

// Update user
router.post("/users/:id/edit", async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, department_id, job_title } = req.body;
    
    await pool.query(
      `UPDATE users SET name = $1, email = $2, department_id = $3, job_title = $4 
       WHERE id = $5`,
      [name, email, department_id, job_title, userId]
    );
    
    res.redirect("/admin/users?success=User updated successfully");
  } catch (err) {
    console.error("❌ Error updating user:", err.message);
    res.redirect(`/admin/users/${userId}/edit?error=Failed to update user`);
  }
});

// Delete user
router.post("/users/:id/delete", async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves
    if (req.user.id == userId) {
      return res.redirect("/admin/users?error=Cannot delete your own account");
    }
    
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    
    res.redirect("/admin/users?success=User deleted successfully");
  } catch (err) {
    console.error("❌ Error deleting user:", err.message);
    res.redirect("/admin/users?error=Failed to delete user");
  }
});

export default router;
