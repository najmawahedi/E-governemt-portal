import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// ✅ ONLY use DATABASE_URL - remove all other options
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // ✅ Required for Render
  },
});

pool
  .connect()
  .then(() => console.log("✅ Connected to DEPLOYED PostgreSQL"))
  .catch((err) => console.error("❌ Connection error:", err.message));

export default pool;
