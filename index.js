const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Database
connectDB();

// Middleware


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://studynook-client-gold-one.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(helmet());

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
app.use("/api/bookings", bookingRoutes);

// Server
app.listen(PORT, () => {
  console.log(`StudyNook server running on port ${PORT}`);
});