const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const roomRoutes = require("./routes/roomRoutes");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Database
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

// Routes
app.get("/", (req, res) => {
  res.send("StudyNook server is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StudyNook API is healthy",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Server
app.listen(PORT, () => {
  console.log(`StudyNook server running on port ${PORT}`);
});