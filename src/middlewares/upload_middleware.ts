import multer from 'multer';
import { AppError } from '../utils/app_error';

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB max
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an image or a generic binary stream (Flutter Dio default for files without extension)
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new AppError({ message: `Only image files are allowed, got ${file.mimetype}`, statusCode: 400, code: 'UPLOAD_INVALID' }));
    }
  }
});

export default upload;
