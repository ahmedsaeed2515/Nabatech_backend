"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const user_model_1 = __importDefault(require("../models/user_model"));
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        console.log("Received file:", req.file);
        const result = await cloudinary_1.default.uploader.upload_stream({ folder: "users" }, (error, result) => {
            if (error) {
                return res.status(500).json({ success: false, message: "Cloudinary upload failed", error });
            }
            res.status(200).json({ success: true, data: { url: result?.secure_url } });
        });
        result.end(req.file.buffer);
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Image upload failed", error });
        console.error("Upload error:", error);
    }
};
exports.uploadImage = uploadImage;
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        const userId = req.user.id;
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "users" }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve(result.secure_url);
                });
                stream.end(fileBuffer);
            });
        };
        const imageUrl = await streamUpload(req.file.buffer);
        const user = await user_model_1.default.findByIdAndUpdate(userId, { avatarUrl: imageUrl }, { new: true }).select("-password");
        res.json({
            success: true,
            message: "Avatar uploaded",
            data: { user }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Upload failed", error });
    }
};
exports.uploadAvatar = uploadAvatar;
