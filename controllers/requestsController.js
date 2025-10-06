import pool from "../config/db.js";
import { createNotification } from "./notificationsController.js";

// ================= Create Request =================
export async function createRequest(req, res) {
  const citizenId = req.user.id;
  const { service_id } = req.body;

  try {
    if (!service_id) {
      return res.status(400).json({ message: "Service ID is required" });
    }

    const result = await pool.query(
      "INSERT INTO requests (citizen_id, service_id) VALUES ($1, $2) RETURNING *",
      [citizenId, service_id]
    );

    res.status(201).json({
      message: "Request submitted successfully",
      request: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in createRequest:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

// ================= Get Requests =================
export async function getRequests(req, res) {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let query = "";
    let values = [];

    if (role === "citizen") {
      query = `
        SELECT r.*, s.name AS service_name, d.name AS department_name
        FROM requests r
        JOIN services s ON r.service_id = s.id
        JOIN departments d ON s.department_id = d.id
        WHERE r.citizen_id = $1
        ORDER BY r.created_at DESC
      `;
      values = [userId];
    } else if (role === "officer" || role === "department_head") {
      // Officer sees requests for their department
      query = `
        SELECT r.*, s.name AS service_name, d.name AS department_name, u.name AS citizen_name
        FROM requests r
        JOIN services s ON r.service_id = s.id
        JOIN departments d ON s.department_id = d.id
        JOIN users u ON r.citizen_id = u.id
        WHERE d.id = $1
        ORDER BY r.created_at DESC
      `;
      // Get officer's department_id
      const officerResult = await pool.query(
        "SELECT department_id FROM users WHERE id = $1",
        [userId]
      );
      const departmentId = officerResult.rows[0].department_id;
      values = [departmentId];
    } else if (role === "admin") {
      // Admin sees all requests
      query = `
        SELECT r.*, s.name AS service_name, d.name AS department_name, u.name AS citizen_name
        FROM requests r
        JOIN services s ON r.service_id = s.id
        JOIN departments d ON s.department_id = d.id
        JOIN users u ON r.citizen_id = u.id
        ORDER BY r.created_at DESC
      `;
      values = [];
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error in getRequests:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

// ================= Get Single Request =================
export async function getRequestById(req, res) {
  const requestId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT r.*, s.name AS service_name, d.name AS department_name, u.name AS citizen_name
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN departments d ON s.department_id = d.id
       JOIN users u ON r.citizen_id = u.id
       WHERE r.id = $1`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error in getRequestById:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

// ================= Update Request Status =================
export async function updateRequestStatus(req, res) {
  const requestId = req.params.id;
  const { status } = req.body;
  const role = req.user.role;

  const validStatuses = ["submitted", "under_review", "approved", "rejected"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    // Only officer/department_head/admin can update
    if (role === "citizen") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ✅ UPDATED: Get request details including service name
    const requestResult = await pool.query(
      `SELECT r.*, s.name as service_name
       FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE r.id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requestResult.rows[0];
    const citizenId = request.citizen_id;

    // Update the request status
    await pool.query(
      "UPDATE requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [status, requestId]
    );

    // ✅ UPDATED: Create notification with service name
    let statusMessage = "";
    switch (status) {
      case "approved":
        statusMessage = "approved ✅";
        break;
      case "rejected":
        statusMessage = "rejected ❌";
        break;
      case "under_review":
        statusMessage = "is under review 🔍";
        break;
      default:
        statusMessage = status;
    }

    await createNotification(
      citizenId,
      `Your ${request.service_name} request is ${statusMessage}.`
    );

    res.json({
      message: "Request status updated",
      request: requestResult.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in updateRequestStatus:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

// Officer: Approve request
export async function approveRequest(req, res) {
  const { id } = req.params;
  const officerId = req.user.id;

  try {
    const officer = await pool.query("SELECT * FROM users WHERE id = $1", [
      officerId,
    ]);
    if (
      officer.rows.length === 0 ||
      !["officer", "department_head"].includes(officer.rows[0].role)
    ) {
      return res.status(403).json({
        message: "Only officers/department heads can approve requests",
      });
    }

    // ✅ UPDATED: Get service name first
    const requestResult = await pool.query(
      `SELECT r.*, s.name as service_name 
       FROM requests r 
       JOIN services s ON r.service_id = s.id 
       WHERE r.id = $1`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requestResult.rows[0];

    const result = await pool.query(
      `UPDATE requests 
       SET status = 'approved', updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    // ✅ UPDATED: Notification with service name
    await createNotification(
      request.citizen_id,
      `Your ${request.service_name} request has been approved! ✅`
    );

    res.json({
      message: "Request approved successfully",
      request: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in approveRequest:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

// Officer: Reject request
export async function rejectRequest(req, res) {
  const { id } = req.params;
  const officerId = req.user.id;

  try {
    const officer = await pool.query("SELECT * FROM users WHERE id = $1", [
      officerId,
    ]);
    if (
      officer.rows.length === 0 ||
      !["officer", "department_head"].includes(officer.rows[0].role)
    ) {
      return res.status(403).json({
        message: "Only officers/department heads can reject requests",
      });
    }

    // ✅ UPDATED: Get service name first
    const requestResult = await pool.query(
      `SELECT r.*, s.name as service_name 
       FROM requests r 
       JOIN services s ON r.service_id = s.id 
       WHERE r.id = $1`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requestResult.rows[0];

    const result = await pool.query(
      `UPDATE requests 
       SET status = 'rejected', updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    // ✅ UPDATED: Notification with service name
    await createNotification(
      request.citizen_id,
      `Your ${request.service_name} request has been rejected. ❌`
    );

    res.json({
      message: "Request rejected successfully",
      request: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in rejectRequest:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}
