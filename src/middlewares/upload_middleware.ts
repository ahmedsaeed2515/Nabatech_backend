import multer from 'multer';
import { AppError } from '../utils/app_error';

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB max
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError({ message: 'Only image files are allowed', statusCode: 400, code: 'UPLOAD_INVALID' }));
    }
  }
});

export default upload;
