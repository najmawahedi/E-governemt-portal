
import pool from "../config/db.js";


export async function getRequestsPerDepartment(req, res) {
  try {
    const result = await pool.query(`
      SELECT d.name AS department_name,
             COUNT(r.id) AS total_requests,
             SUM(CASE WHEN r.status='approved' THEN 1 ELSE 0 END) AS approved,
             SUM(CASE WHEN r.status='rejected' THEN 1 ELSE 0 END) AS rejected
      FROM departments d
      LEFT JOIN services s ON s.department_id = d.id
      LEFT JOIN requests r ON r.service_id = s.id
      GROUP BY d.name
      ORDER BY d.name;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error in getRequestsPerDepartment:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}


export async function getPaymentSummary(req, res) {
  try {
    const result = await pool.query(`
      SELECT d.name AS department_name,
             SUM(p.amount) AS total_collected
      FROM payments p
      JOIN requests r ON r.id = p.request_id
      JOIN services s ON s.id = r.service_id
      JOIN departments d ON d.id = s.department_id
      GROUP BY d.name
      ORDER BY d.name;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error in getPaymentSummary:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}
