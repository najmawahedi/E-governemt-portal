import multer from "multer";
import pool from "../config/db.js";
import path from "path";

// Set storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    
    cb(null, `doc_${req.params.id}_${Date.now()}${ext}`);
  },
});

// Filter files
const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase()))
    cb(null, true);
  else cb(new Error("Invalid file type"), false);
};

export const upload = multer({ storage, fileFilter });

// Controller
export async function uploadDocument(req, res) {
  const requestId = req.params.id;
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileName = req.file.filename; 

    const result = await pool.query(
      "INSERT INTO documents (request_id, file_path, file_type) VALUES ($1, $2, $3) RETURNING *",
      [requestId, fileName, path.extname(req.file.originalname).slice(1)]
    );

    res.json({
      message: "File uploaded successfully",
      document: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in uploadDocument:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

// Get all documents for a specific request
export async function getDocuments(req, res) {
  const requestId = req.params.id;

  try {
    const result = await pool.query(
      "SELECT * FROM documents WHERE request_id = $1",
      [requestId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No documents found for this request" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching documents:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}
