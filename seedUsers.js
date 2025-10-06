// seedUsers.js
import pool from "./config/db.js";
import bcrypt from "bcrypt";

async function seed() {
  try {
    const password = "password123"; // This is the plain text password you want
    const hashed = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (name, email, password, role, department_id)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `;

    const valuesAdmin = [
      "Admin User",
      "admin@example.com",
      hashed,
      "admin",
      null,
    ];
    const valuesOfficer = [
      "Officer User",
      "officer@example.com",
      hashed,
      "officer",
      1,
    ];

    const adminResult = await pool.query(query, valuesAdmin);
    const officerResult = await pool.query(query, valuesOfficer);

    console.log("Admin inserted:", adminResult.rows);
    console.log("Officer inserted:", officerResult.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
