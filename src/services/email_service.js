"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = exports.sendPasswordResetEmail = void 0;
var nodemailer_1 = __importDefault(require("nodemailer"));
var transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
var sendPasswordResetEmail = function (to, token) { return __awaiter(void 0, void 0, void 0, function () {
    var resetUrl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                resetUrl = "".concat(process.env.FRONTEND_URL || 'https://nabatech.app', "/reset-password?token=").concat(token);
                return [4 /*yield*/, transporter.sendMail({
                        from: "\"Nabatech\" <".concat(process.env.SMTP_USER, ">"),
                        to: to,
                        subject: 'Password Reset Request - Nabatech',
                        html: "\n      <h2>Password Reset</h2>\n      <p>You requested a password reset. Click the link below to reset your password:</p>\n      <a href=\"".concat(resetUrl, "\" style=\"color: #4CAF50;\">Reset Password</a>\n      <p>This link expires in 30 minutes.</p>\n      <p>If you did not request this, ignore this email.</p>\n    "),
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.sendPasswordResetEmail = sendPasswordResetEmail;
var sendVerificationEmail = function (to, token) { return __awaiter(void 0, void 0, void 0, function () {
    var verifyUrl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                verifyUrl = "".concat(process.env.FRONTEND_URL || 'https://nabatech.app', "/verify-email?token=").concat(token);
                return [4 /*yield*/, transporter.sendMail({
                        from: "\"Nabatech\" <".concat(process.env.SMTP_USER, ">"),
                        to: to,
                        subject: 'Verify your email - Nabatech',
                        html: "\n      <h2>Welcome to Nabatech!</h2>\n      <p>Please verify your email address by clicking the link below:</p>\n      <a href=\"".concat(verifyUrl, "\" style=\"color: #4CAF50;\">Verify Email</a>\n      <p>If you did not create an account, you can safely ignore this email.</p>\n    "),
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.sendVerificationEmail = sendVerificationEmail;
