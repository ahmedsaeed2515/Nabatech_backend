import { Request , Response } from "express";
import bcrypt from 'bcrypt';
import crypto from "crypto";
import User from "../models/user_model";
import generateToken from "../utils/generateToken";
import PasswordResetRequest from "../models/password_reset_request_model";


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email: rawEmail, password: rawPassword, phoneNumber } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const trimmedPassword = typeof rawPassword === 'string' ? rawPassword.trim() : '';
    const trimmedPhone = typeof phoneNumber === 'string' ? phoneNumber.trim() : undefined;

    if (!trimmedName || !email || !trimmedPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength
    if (
      trimmedPassword.length < 6 ||
      !/[a-zA-Z]/.test(trimmedPassword) ||
      !/[0-9]/.test(trimmedPassword)
    ) {
      return res.status(400).json({
        message: "Password must be at least 6 characters and contain both letters and numbers"
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    const user = await User.create({
      name: trimmedName,
      email,
      password: hashedPassword,
      phoneNumber: trimmedPhone,
    });

    const token = generateToken(user._id.toString());
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      }
    });
  } catch (error: any) {
    console.error("Registration Error details:", error);
    res.status(500).json({ message: "Registration failed", error: error.message || error });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email: rawEmail, password: rawPassword } = req.body;

    if (!rawEmail || !rawPassword) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id.toString());
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        avatarUrl: user.avatarUrl || "",
        createdAt: user.createdAt.toISOString(),
      }
    });
  } catch (error: any) {
    console.error("Login Error details:", error);
    return res.status(500).json({ message: "Login failed", error: error.message || error });
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email: rawEmail } = req.body;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Always return success shape to avoid account enumeration.
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        data: {
          message:
            "If that email exists, password reset instructions have been generated.",
        },
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await PasswordResetRequest.create({
      email,
      token,
      expiresAt,
      used: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        message:
          "Password reset request created. Integrate email provider to deliver token.",
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to process forgot password request" });
  }
};
