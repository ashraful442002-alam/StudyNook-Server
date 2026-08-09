const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Root route
app.get("/", (req, res) => {
  res.send("StudyNook server is running");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StudyNook API is healthy",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`StudyNook server running on port ${PORT}`);
});