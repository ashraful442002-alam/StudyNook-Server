require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const {client} = require("./config/db");
const roomsRoutes = require("./routes/rooms.routes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error(error);
  }
}

run();

app.use("/api/rooms", roomsRoutes);

app.get("/", (req, res) => {
  res.send("StudyNook Server Running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});