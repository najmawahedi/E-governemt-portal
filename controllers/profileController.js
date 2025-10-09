import pool from "../config/db.js";


export async function getProfile(req, res) {
  const userId = req.user.id; 
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, dob, national_id, phone_number, address, department_id, job_title
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error in getProfile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}


export async function updateProfile(req, res) {
  const userId = req.user.id;
  const { dob, national_id, phone_number, address, department_id, job_title } =
    req.body;

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    let updateFields = {};
    if (user.role === "citizen") {
      updateFields = { dob, national_id, phone_number, address };
    } else if (user.role === "officer" || user.role === "department_head") {
      updateFields = { department_id, job_title };
    } else if (user.role === "admin") {
      updateFields = {
        dob,
        national_id,
        phone_number,
        address,
        department_id,
        job_title,
      };
    }

    const fields = Object.entries(updateFields).filter(
      ([_, v]) => v !== undefined
    );
    if (fields.length === 0) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const setQuery = fields
      .map(([key], idx) => `${key} = $${idx + 1}`)
      .join(", ");
    const values = fields.map(([_, val]) => val);
    values.push(userId);

    const updateQuery = `UPDATE users SET ${setQuery} WHERE id = $${values.length} 
                         RETURNING id, name, email, role, dob, national_id, phone_number, address, department_id, job_title`;

    const updated = await pool.query(updateQuery, values);

    res.json({
      message: "Profile updated successfully",
      user: updated.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in updateProfile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}
