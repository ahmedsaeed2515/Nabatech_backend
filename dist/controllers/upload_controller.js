"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCover = exports.uploadAvatar = exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const user_model_1 = __importDefault(require("../models/user_model"));
// Unified Cloudinary stream uploader helper
const streamUploadToCloudinary = (buffer, folder, resourceType = 'image') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => {
            if (error)
                return reject(error);
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
        });
        stream.end(buffer);
    });
};
// @desc    Generic image upload (returns URL only, no DB update)
// @route   POST /api/upload/image
// @access  Private
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const result = await streamUploadToCloudinary(req.file.buffer, 'nabatech/uploads');
        res.status(200).json({ success: true, data: { url: result.secure_url, public_id: result.public_id } });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Image upload failed', error });
    }
};
exports.uploadImage = uploadImage;
// @desc    Upload user avatar → saves to Cloudinary and updates DB
// @route   POST /api/upload/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const userId = req.user.id;
        const result = await streamUploadToCloudinary(req.file.buffer, 'nabatech/avatars');
        const user = await user_model_1.default.findByIdAndUpdate(userId, { avatarUrl: result.secure_url }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                url: result.secure_url,
                public_id: result.public_id,
                user: {
                    id: user._id,
                    avatarUrl: user.avatarUrl,
                    name: user.name,
                    email: user.email,
                }
            }
        });
    }
    catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ success: false, message: 'Avatar upload failed', error });
    }
};
exports.uploadAvatar = uploadAvatar;
// @desc    Upload user cover image → saves to Cloudinary and updates DB
// @route   POST /api/upload/cover
// @access  Private
const uploadCover = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const userId = req.user.id;
        const result = await streamUploadToCloudinary(req.file.buffer, 'nabatech/covers');
        const user = await user_model_1.default.findByIdAndUpdate(userId, { coverUrl: result.secure_url }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Cover image uploaded successfully',
            data: {
                url: result.secure_url,
                public_id: result.public_id,
                user: {
                    id: user._id,
                    coverUrl: user.coverUrl,
                    name: user.name,
                    email: user.email,
                }
            }
        });
    }
    catch (error) {
        console.error('Cover upload error:', error);
        res.status(500).json({ success: false, message: 'Cover image upload failed', error });
    }
};
exports.uploadCover = uploadCover;
