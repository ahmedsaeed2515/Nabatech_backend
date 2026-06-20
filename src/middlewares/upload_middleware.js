"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var multer_1 = __importDefault(require("multer"));
var app_error_1 = require("../utils/app_error");
var storage = multer_1.default.memoryStorage();
var upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 8 * 1024 * 1024, // 8 MB max
    },
    fileFilter: function (req, file, cb) {
        // Check if the file is an image or a generic binary stream (Flutter Dio default for files without extension)
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
            cb(null, true);
        }
        else {
            cb(new app_error_1.AppError({ message: "Only image files are allowed, got ".concat(file.mimetype), statusCode: 400, code: 'UPLOAD_INVALID' }));
        }
    }
});
exports.default = upload;
