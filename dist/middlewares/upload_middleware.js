"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const app_error_1 = require("../utils/app_error");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 8 * 1024 * 1024, // 8 MB max
    },
    fileFilter: (req, file, cb) => {
        // Check if the file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new app_error_1.AppError({ message: 'Only image files are allowed', statusCode: 400, code: 'UPLOAD_INVALID' }));
        }
    }
});
exports.default = upload;
