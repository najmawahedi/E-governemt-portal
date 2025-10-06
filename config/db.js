import pkg from "pg";
import dotenv from "dotenv";

// Load correct .env file
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config(); // loads .env
}

const { Pool } = pkg;

// Handle both connection types
const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };

const pool = new Pool(poolConfig);

pool.connect()
  .then(() => console.log(`✅ Connected to ${process.env.NODE_ENV === 'production' ? 'DEPLOYED' : 'LOCAL'} PostgreSQL`))
  .catch((err) => console.error("❌ Connection error:", err.message));

export default pool;