import pool from "../config/db.js";

// Get payment page - FIXED VERSION
export async function getPaymentPage(req, res) {
  try {
    const { request_id, citizen_id, name } = req.query;

    console.log("📝 Payment page parameters:", {
      request_id,
      citizen_id,
      name,
    });

    if (!request_id || !citizen_id || !name) {
      console.log("❌ Missing parameters in payment page");
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

    // Check if payment already exists for this request
    const existingPayment = await pool.query(
      "SELECT * FROM payments WHERE request_id = $1",
      [request_id]
    );

    if (existingPayment.rows.length > 0) {
      return res.redirect(
        `/citizen/track?citizen_id=${citizen_id}&name=${encodeURIComponent(
          name
        )}&message=Payment already processed`
      );
    }

    

    res.render("citizen/payment", {
      title: "Make Payment",
      user: { id: citizen_id, name },
      request: request,
      service: {
        name: request.service_name,
        fee: request.fee,
        department_name: request.department_name,
      },
    });
  } catch (err) {
    
    res.status(500).send("Server error: " + err.message);
  }
}

// Simulate a payment - FIXED VERSION
export async function makePayment(req, res) {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;
    const { amount } = req.body;

   

    if (!userId) {
      console.log("❌ No user ID in session");
      return res.redirect("/login?error=Please login to make payment");
    }

    // 1️⃣ Check if request exists and belongs to the user
    const requestResult = await pool.query(
      `SELECT r.*, s.name as service_name, s.fee
       FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE r.id = $1 AND r.citizen_id = $2`,
      [requestId, userId]
    );

    if (requestResult.rows.length === 0) {
      console.log("❌ Request not found or doesn't belong to user");
      return res.status(404).render("error", {
        message:
          "Request not found or you don't have permission to pay for this request",
      });
    }

    const request = requestResult.rows[0];

    // 2️⃣ Check if payment already exists
    const existingPayment = await pool.query(
      "SELECT * FROM payments WHERE request_id = $1",
      [requestId]
    );

    if (existingPayment.rows.length > 0) {
      console.log("⚠️ Payment already exists for this request");
      return res.redirect(
        `/citizen/track?citizen_id=${userId}&message=Payment already processed`
      );
    }

    // 3️⃣ Insert payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (request_id, amount, status, payment_date)
       VALUES ($1, $2, 'success', CURRENT_TIMESTAMP) RETURNING *`,
      [requestId, amount || request.fee]
    );

    // 4️⃣ Update request status
    await pool.query(
      "UPDATE requests SET status = 'under_review', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [requestId]
    );

    console.log("✅ Payment successful for request:", requestId);

    // 5️⃣ Redirect to success page instead of rendering
    res.redirect(
      `/payments/success?request_id=${requestId}&payment_id=${paymentResult.rows[0].id}`
    );
  } catch (err) {
    console.error("❌ Error in makePayment:", err.message);
    res.status(500).render("error", {
      message: "Payment processing failed. Please try again.",
    });
  }
}
