const express = require("express");

const {
  register,
  login,
  googleLogin,
  getCurrentUser,
  logout,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

// Private route
router.get("/me", authMiddleware, getCurrentUser);

// Logout
router.post("/logout", logout);

module.exports = router;