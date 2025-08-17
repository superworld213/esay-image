import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fontController } from '../controllers/fontController.js';

const router = express.Router();

// 配置字体文件存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/fonts'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `font_${uniqueId}${ext}`);
  }
});

// 字体文件过滤器
const fontFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'font/woff',
    'font/woff2', 
    'font/ttf',
    'font/otf',
    'application/font-woff',
    'application/font-woff2',
    'application/x-font-ttf',
    'application/x-font-otf'
  ];
  
  const allowedExtensions = ['.woff', '.woff2', '.ttf', '.otf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('只支持字体文件格式 (WOFF, WOFF2, TTF, OTF)'));
  }
};

const upload = multer({
  storage,
  fileFilter: fontFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 上传字体文件
router.post('/upload', upload.single('font'), fontController.uploadFont);

// 获取已安装字体列表
router.get('/', fontController.getFonts);

// 删除字体
router.delete('/:fontId', fontController.deleteFont);

export default router;