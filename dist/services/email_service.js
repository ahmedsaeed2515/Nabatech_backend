"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = exports.sendPasswordResetEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendPasswordResetEmail = async (to, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://nabatech.app'}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: `"Nabatech" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Password Reset Request - Nabatech',
        html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="color: #4CAF50;">Reset Password</a>
      <p>This link expires in 30 minutes.</p>
      <p>If you did not request this, ignore this email.</p>
    `,
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendVerificationEmail = async (to, token) => {
    // In a real app this would point to a frontend route that then calls the API.
    // For the sake of this implementation, we can link directly to the API endpoint or a frontend page.
    const verifyUrl = `${process.env.FRONTEND_URL || 'https://nabatech.app'}/verify-email?token=${token}`;
    await transporter.sendMail({
        from: `"Nabatech" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Verify your email - Nabatech',
        html: `
      <h2>Welcome to Nabatech!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}" style="color: #4CAF50;">Verify Email</a>
      <p>If you did not create an account, you can safely ignore this email.</p>
    `,
    });
};
exports.sendVerificationEmail = sendVerificationEmail;
