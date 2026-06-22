import multer from 'multer';
import { AppError } from '../utils/app_error';

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    // Strip original name of path components and check extension
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const dangerousExts = ['svg', 'exe', 'zip', 'js', 'html', 'php', 'sh', 'bat'];

    if (dangerousExts.includes(ext ?? '')) {
      return cb(new AppError({ message: `Dangerous file extensions are not allowed`, statusCode: 400, code: 'UPLOAD_INVALID' }));
    }

    if (allowedMimeTypes.includes(file.mimetype) || (file.mimetype === 'application/octet-stream' && ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext))) {
      cb(null, true);
    } else {
      cb(new AppError({ message: `Only jpg, png, webp image files are allowed, got ${file.mimetype}`, statusCode: 400, code: 'UPLOAD_INVALID' }));
    }
  }
});

export default upload;
