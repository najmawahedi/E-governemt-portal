import pool from "../config/db.js";


export async function getNotifications(req, res) {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", // ✅ Use user_id (your actual column name)
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error in getNotifications:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

// Create notification helper function
export async function createNotification(userId, message) {
  try {
    await pool.query(
      "INSERT INTO notifications (user_id, message) VALUES ($1, $2)", // ✅ Use user_id (your actual column name)
      [userId, message]
    );
  } catch (err) {
    console.error("❌ Error creating notification:", err.message);
  }
}

// Mark notification as read
export async function markNotificationRead(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *", // ✅ Use user_id (your actual column name)
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in markNotificationRead:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}
