const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const {
  verifyFirebaseIdToken,
} = require("../config/firebaseAdmin");

const createToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const sendTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ===============================
// REGISTER
// ===============================
const register = async (req, res) => {
  try {
    const { name, email, photoURL, password } = req.body;

    // Required fields check
    if (!name || !email || !photoURL || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter.",
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one lowercase letter.",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      photoURL,
      password: hashedPassword,
      provider: "email",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful! Please login.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating your account.",
    });
  }
};

// ===============================
// LOGIN
// ===============================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Google account cannot use email/password login
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Please continue with Google to login to this account.",
      });
    }

    // Compare password
    const passwordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate JWT
    const token = createToken(user._id.toString());

    // Store JWT in HTTP-only cookie
    sendTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
    });
  }
};

// ===============================
// GOOGLE LOGIN (Firebase)
// ===============================
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required.",
      });
    }

    // Verify Firebase ID token
    let decodedToken;

    try {
      decodedToken = await verifyFirebaseIdToken(idToken);
    } catch (error) {
      console.error("Firebase token verification error:", error);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google token.",
      });
    }

    const { name, email, picture, uid } = decodedToken;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account must have an email address.",
      });
    }

    // Find existing user by email
    let user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      // Create a new Google user
      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        photoURL: picture || "",
        password: null,
        provider: "google",
        firebaseUid: uid,
      });
    } else {
      // Update photo/name from Google on every login
      user.name = name || user.name;
      user.photoURL = picture || user.photoURL;
      user.provider = "google";
      user.firebaseUid = uid;

      await user.save();
    }

    // Generate JWT
    const token = createToken(user._id.toString());

    // Store JWT in HTTP-only cookie
    sendTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while signing in with Google.",
    });
  }
};

// ===============================
// GET CURRENT USER
// ===============================
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your account.",
    });
  }
};

// ===============================
// LOGOUT
// ===============================
const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to logout.",
    });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getCurrentUser,
  logout,
};