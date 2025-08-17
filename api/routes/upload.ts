import express, { type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../../uploads');
const backgroundsDir = path.join(uploadsDir, 'backgrounds');
const qrcodesDir = path.join(uploadsDir, 'qrcodes');

[uploadsDir, backgroundsDir, qrcodesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'background') {
      cb(null, backgroundsDir);
    } else if (file.fieldname === 'qrCodes') {
      cb(null, qrcodesDir);
    } else {
      cb(new Error('Invalid field name'), '');
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${timestamp}_${originalName}`);
  }
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG, JPEG, PNG 格式的图片'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 文件上传接口
router.post('/', upload.fields([
  { name: 'background', maxCount: 1 },
  { name: 'qrCodes', maxCount: 100 }
]), (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.background || files.background.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请上传背景图片'
      });
    }
    
    if (!files.qrCodes || files.qrCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请上传至少一个二维码图片'
      });
    }
    
    const backgroundFile = files.background[0];
    const qrCodeFiles = files.qrCodes;
    
    const fileIds = [
      `bg_${path.basename(backgroundFile.filename, path.extname(backgroundFile.filename))}`,
      ...qrCodeFiles.map(file => 
        `qr_${path.basename(file.filename, path.extname(file.filename))}`
      )
    ];
    
    res.json({
      success: true,
      fileIds,
      message: `文件上传成功，共上传 ${qrCodeFiles.length + 1} 个文件`,
      data: {
        background: {
          id: fileIds[0],
          filename: backgroundFile.filename,
          originalName: backgroundFile.originalname,
          path: backgroundFile.path
        },
        qrCodes: qrCodeFiles.map((file, index) => ({
          id: fileIds[index + 1],
          filename: file.filename,
          originalName: file.originalname,
          path: file.path
        }))
      }
    });
    
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败'
    });
  }
});

export default router;