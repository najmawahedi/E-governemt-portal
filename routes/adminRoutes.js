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

// =======================
// ✅ DASHBOARD
// =======================
router.get("/dashboard", adminDashboard);

// =======================
// ✅ USER MANAGEMENT
// =======================
router.get("/users", getUsers);
router.post("/users/officer", createOfficer);
router.post("/users/department-head", createDepartmentHead);

// User edit/delete routes
router.get("/users/:id/edit", async (req, res) => {
  try {
    const userId = req.params.id;

    const userResult = await pool.query(
      `
      SELECT u.*, d.name as department_name 
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id 
      WHERE u.id = $1
    `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    const user = userResult.rows[0];
    const departments = await pool.query(
      "SELECT * FROM departments ORDER BY name"
    );

    res.render("admin/edit-user", {
      title: "Edit User",
      user: user,
      departments: departments.rows,
    });
  } catch (err) {
    console.error("❌ Error loading edit user:", err.message);
    res.status(500).send("Server error");
  }
});

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

router.post("/users/:id/delete", async (req, res) => {
  try {
    const userId = req.params.id;

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

// =======================
// ✅ DEPARTMENT MANAGEMENT
// =======================
router.get("/departments", getDepartments);
router.post("/departments", createDepartment);

// Department edit/delete routes
router.get("/departments/:id/edit", async (req, res) => {
  try {
    const deptId = req.params.id;

    const deptResult = await pool.query(
      "SELECT * FROM departments WHERE id = $1",
      [deptId]
    );

    if (deptResult.rows.length === 0) {
      return res.status(404).send("Department not found");
    }

    res.render("admin/edit-department", {
      title: "Edit Department",
      department: deptResult.rows[0],
    });
  } catch (err) {
    console.error("❌ Error loading edit department:", err.message);
    res.status(500).send("Server error");
  }
});

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
    res.redirect(
      `/admin/departments/${deptId}/edit?error=Failed to update department`
    );
  }
});

router.post("/departments/:id/delete", async (req, res) => {
  try {
    const deptId = req.params.id;

    const servicesCount = await pool.query(
      "SELECT COUNT(*) FROM services WHERE department_id = $1",
      [deptId]
    );
    const officersCount = await pool.query(
      "SELECT COUNT(*) FROM users WHERE department_id = $1",
      [deptId]
    );

    if (parseInt(servicesCount.rows[0].count) > 0) {
      return res.redirect(
        "/admin/departments?error=Cannot delete department with existing services"
      );
    }

    if (parseInt(officersCount.rows[0].count) > 0) {
      return res.redirect(
        "/admin/departments?error=Cannot delete department with assigned officers"
      );
    }

    await pool.query("DELETE FROM departments WHERE id = $1", [deptId]);

    res.redirect("/admin/departments?success=Department deleted successfully");
  } catch (err) {
    console.error("❌ Error deleting department:", err.message);
    res.redirect("/admin/departments?error=Failed to delete department");
  }
});

// =======================
// ✅ SERVICE MANAGEMENT
// =======================
router.get("/services", getServices);
router.post("/services", createService);

// Service edit/delete routes
router.get("/services/:id/edit", async (req, res) => {
  try {
    const serviceId = req.params.id;

    const serviceResult = await pool.query(
      `
      SELECT s.*, d.name as department_name
      FROM services s
      JOIN departments d ON s.department_id = d.id
      WHERE s.id = $1
    `,
      [serviceId]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).send("Service not found");
    }

    const service = serviceResult.rows[0];
    const departments = await pool.query(
      "SELECT * FROM departments ORDER BY name"
    );

    let fieldsString = "";
    if (service.required_fields) {
      try {
        const fieldsArray = JSON.parse(service.required_fields);
        fieldsString = fieldsArray.join(", ");
      } catch (e) {
        fieldsString = service.required_fields;
      }
    }

    res.render("admin/edit-service", {
      title: "Edit Service",
      service: service,
      departments: departments.rows,
      fieldsString: fieldsString,
    });
  } catch (err) {
    console.error("❌ Error loading edit service:", err.message);
    res.status(500).send("Server error");
  }
});

router.post("/services/:id/edit", async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { name, department_id, description, fee, required_fields } = req.body;

    let fieldsArray = [];
    if (required_fields && required_fields.trim()) {
      fieldsArray = required_fields
        .split(",")
        .map((field) => field.trim())
        .filter((field) => field);
    }

    const requiredFieldsJson =
      fieldsArray.length > 0 ? JSON.stringify(fieldsArray) : null;

    await pool.query(
      `UPDATE services SET name = $1, department_id = $2, description = $3, fee = $4, required_fields = $5 
       WHERE id = $6`,
      [
        name,
        department_id,
        description,
        parseFloat(fee) || 0,
        requiredFieldsJson,
        serviceId,
      ]
    );

    res.redirect("/admin/services?success=Service updated successfully");
  } catch (err) {
    console.error("❌ Error updating service:", err.message);
    res.redirect(
      `/admin/services/${serviceId}/edit?error=Failed to update service`
    );
  }
});

router.post("/services/:id/delete", async (req, res) => {
  try {
    const serviceId = req.params.id;

    const requestsCount = await pool.query(
      "SELECT COUNT(*) FROM requests WHERE service_id = $1",
      [serviceId]
    );

    if (parseInt(requestsCount.rows[0].count) > 0) {
      return res.redirect(
        "/admin/services?error=Cannot delete service with existing requests"
      );
    }

    await pool.query("DELETE FROM services WHERE id = $1", [serviceId]);

    res.redirect("/admin/services?success=Service deleted successfully");
  } catch (err) {
    console.error("❌ Error deleting service:", err.message);
    res.redirect("/admin/services?error=Failed to delete service");
  }
});

// =======================
// ✅ REPORTS
// =======================
router.get("/reports", getReports);

// =======================
// ✅ REQUESTS OVERVIEW
// =======================
router.get("/requests", getAllRequests);

// =======================
// ✅ REGISTRATION PAGES
// =======================
router.get("/register-officer", async (req, res) => {
  try {
    const departments = await pool.query(
      "SELECT * FROM departments ORDER BY name"
    );
    res.render("auth/register-officer", {
      title: "Register Officer",
      departments: departments.rows,
    });
  } catch (err) {
    console.error("❌ Error loading officer registration:", err.message);
    res.status(500).send("Server error");
  }
});

router.get("/register-department-head", async (req, res) => {
  try {
    const departments = await pool.query(
      "SELECT * FROM departments ORDER BY name"
    );
    res.render("auth/register-department-head", {
      title: "Register Department Head",
      departments: departments.rows,
    });
  } catch (err) {
    console.error(
      "❌ Error loading department head registration:",
      err.message
    );
    res.status(500).send("Server error");
  }
});

export default router;
