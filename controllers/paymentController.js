import pool from "../config/db.js";

// Simulate a payment
export async function makePayment(req, res) {
  const userId = req.user.id;
  const { requestId } = req.params;
  const { amount } = req.body;

  try {
    // 1️⃣ Check if request exists and belongs to the user
    const requestResult = await pool.query(
      `SELECT r.*, s.name as service_name, s.fee
       FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE r.id = $1 AND r.citizen_id = $2`,
      [requestId, userId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requestResult.rows[0];

    // 2️⃣ Insert payment record (simulated) - FIXED: Match your table columns
    const paymentResult = await pool.query(
      `INSERT INTO payments (request_id, amount, status)
       VALUES ($1, $2, 'success') RETURNING *`,
      [requestId, amount]
    );

    // 3️⃣ Update request status to "under_review" after payment
    await pool.query(
      "UPDATE requests SET status = 'under_review', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [requestId]
    );

    // 4️⃣ Render success page
    res.render("citizen/payment-success", {
      title: "Payment Successful",
      user: req.user,
      paymentDetails: {
        service_name: request.service_name,
        amount: amount,
        payment_id: paymentResult.rows[0].id,
        request_id: requestId,
      },
    });
  } catch (err) {
    console.error("❌ Error in makePayment:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

// Get payment page
// In getPaymentPage function - add debug logging
export async function getPaymentPage(req, res) {
  try {
    const { request_id, citizen_id, name } = req.query;
  
    if (!request_id || !citizen_id || !name) {
      console.log("❌ Missing parameters");
      return res.status(400).send("Missing required parameters");
    }

    // Get request and service details
    const requestResult = await pool.query(
      `SELECT r.*, s.name as service_name, s.fee, s.description, d.name as department_name
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN departments d ON s.department_id = d.id
       WHERE r.id = $1 AND r.citizen_id = $2`,
      [request_id, citizen_id]
    );

   

    if (requestResult.rows.length === 0) {
      console.log("❌ Request not found in database");
      return res.status(404).send("Request not found");
    }

    const request = requestResult.rows[0];
  

    res.render("citizen/payment", {
      title: "Make Payment",
      user: { id: citizen_id, name },
      request: request,
      service: {
        name: request.service_name,
        fee: request.fee,
        department_name: request.department_name
      }
    });
  } catch (err) {
    console.error("❌ Error in getPaymentPage:", err.message);
    res.status(500).send("Server error");
  }
}