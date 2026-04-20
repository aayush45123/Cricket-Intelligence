import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ───────────────────────────────────────────── */
/* 🔐 SIGN TOKEN */
/* ───────────────────────────────────────────── */
const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET missing in .env");
    throw new Error("JWT_SECRET not configured");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/* ───────────────────────────────────────────── */
/* 🟢 REGISTER */
/* ───────────────────────────────────────────── */
export const register = async (req, res) => {
  try {
    console.log("➡️ REGISTER REQUEST:", req.body);

    const { name, email, password } = req.body;

    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    /* VALIDATION */
    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    /* CHECK EXISTING USER */
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    /* CREATE USER */
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
    });

    console.log("✅ USER CREATED:", user._id);

    /* TOKEN */
    const token = signToken(user._id);

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    res.status(500).json({
      message: err.message || "Registration failed",
    });
  }
};

/* ───────────────────────────────────────────── */
/* 🔵 LOGIN */
/* ───────────────────────────────────────────── */
export const login = async (req, res) => {
  try {
    console.log("➡️ LOGIN REQUEST:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = signToken(user._id);

    res.json({
      status: "success",
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);

    res.status(500).json({
      message: err.message || "Login failed",
    });
  }
};

/* ───────────────────────────────────────────── */
/* 🟡 GET ME */
/* ───────────────────────────────────────────── */
export const getMe = async (req, res) => {
  res.json({
    status: "success",
    data: {
      user: req.user,
    },
  });
};
