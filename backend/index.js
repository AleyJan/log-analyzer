// index.js
// Express server — accepts a log file upload, parses it, analyzes it, returns JSON.

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { parseLogFile } = require("./parser");
const { analyze } = require("./analyzer");

const app = express();
const PORT = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Multer Setup ---
// Stores uploaded file temporarily in /uploads folder
const upload = multer({
  dest: path.join(__dirname, "uploads"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    // Accept any text file or .log file
    if (
      file.mimetype === "text/plain" ||
      file.originalname.endsWith(".log") ||
      file.originalname.endsWith(".txt")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .log or .txt files are accepted"));
    }
  },
});

// --- Routes ---

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Log Analyzer API is running" });
});

// Main route — upload a log file and get analysis back
app.post("/analyze", upload.single("logfile"), async (req, res) => {
  // No file uploaded
  if (!req.file) {
    return res
      .status(400)
      .json({ error: "No file uploaded. Send a log file as 'logfile' field." });
  }

  const filePath = req.file.path;

  try {
    // Read the uploaded file
    const content = fs.readFileSync(filePath, "utf8");

    // Parse it
    const { parsed, skipped } = parseLogFile(content);

    // Analyze it
    const result = analyze(parsed, skipped);

    // Add file metadata to response
    result.meta = {
      fileName: req.file.originalname,
      fileSizeKB: Math.round(req.file.size / 1024),
      totalLines: parsed.length + skipped.length,
    };

    res.json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    res
      .status(500)
      .json({ error: "Failed to analyze file", detail: err.message });
  } finally {
    // Always delete the uploaded file after processing
    // We don't want to store user log files on disk
    try {
      fs.unlinkSync(filePath);
    } catch (_) {}
  }
});

// --- Error Handler for Multer ---
app.use((err, req, res, next) => {
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Log Analyzer API running at http://localhost:${PORT}`);
  console.log(`   POST /analyze — upload a log file to analyze`);
});
